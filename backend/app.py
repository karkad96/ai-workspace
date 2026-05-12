from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import CORS_ORIGINS
from auth import (
    TokenData,
    create_access_token,
    get_optional_user,
    get_required_user,
    hash_password,
    verify_password,
)
from database import (
    create_conversation,
    create_user,
    delete_conversation,
    delete_last_message,
    get_conversation,
    get_conversation_messages,
    get_conversations,
    get_user_by_email,
    init_db,
    save_message,
)
from llm import stream_chat_with_model


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id"],
)


class AuthRequest(BaseModel):
    email: str
    password: str


@app.post("/auth/register")
def register(req: AuthRequest):
    if get_user_by_email(req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(req.email, hash_password(req.password))
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "email": user["email"]}


@app.post("/auth/login")
def login(req: AuthRequest):
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "email": user["email"]}


@app.get("/auth/me")
def me(user: TokenData = Depends(get_required_user)):
    return {"email": user.email}


class ConversationRequest(BaseModel):
    title: str


@app.get("/conversations")
def list_conversations(user: TokenData = Depends(get_required_user)):
    return get_conversations(user.user_id)


@app.post("/conversations")
def new_conversation(req: ConversationRequest, user: TokenData = Depends(get_required_user)):
    return create_conversation(user.user_id, req.title)


@app.get("/conversations/{conv_id}/messages")
def conversation_messages(conv_id: int, user: TokenData = Depends(get_required_user)):
    if not get_conversation(conv_id, user.user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return get_conversation_messages(conv_id, user.user_id)


@app.delete("/conversations/{conv_id}/messages/last")
def remove_last_message(conv_id: int, user: TokenData = Depends(get_required_user)):
    if not get_conversation(conv_id, user.user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    delete_last_message(conv_id, user.user_id)
    return {"ok": True}


@app.delete("/conversations/{conv_id}")
def remove_conversation(conv_id: int, user: TokenData = Depends(get_required_user)):
    if not get_conversation(conv_id, user.user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    delete_conversation(conv_id, user.user_id)
    return {"ok": True}


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    history: list[dict] = []
    use_client_history: bool = False


@app.post("/chat-stream")
async def chat_stream(
    req: ChatRequest,
    user: Optional[TokenData] = Depends(get_optional_user),
):
    conv_id = req.conversation_id

    if user and conv_id is None:
        conv = create_conversation(user.user_id, req.message[:80])
        conv_id = conv["id"]
    elif user and conv_id is not None:
        if not get_conversation(conv_id, user.user_id):
            raise HTTPException(status_code=404, detail="Conversation not found")

    if req.use_client_history:
        history = req.history
    elif user and conv_id:
        history = get_conversation_messages(conv_id, user.user_id)
    else:
        history = req.history
    messages = []
    for turn in history:
        messages.append({"role": "user", "content": turn["user"]})
        messages.append({"role": "assistant", "content": turn["bot"]})
    messages.append({"role": "user", "content": req.message})

    async def generate():
        full_response = ""
        async for chunk in stream_chat_with_model(messages):
            full_response += chunk
            yield chunk
        if user and full_response and conv_id:
            save_message(conv_id, user.user_id, req.message, full_response)

    headers = {"X-Conversation-Id": str(conv_id)} if conv_id else {}
    headers.update({
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
    })
    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8", headers=headers)
