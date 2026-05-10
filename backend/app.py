from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from auth import (
    TokenData,
    create_access_token,
    get_optional_user,
    get_required_user,
    hash_password,
    verify_password,
)
from database import create_user, get_history, get_user_by_email, init_db, save_history
from llm import stream_chat_with_model


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/history")
def chat_history(user: TokenData = Depends(get_required_user)):
    return get_history(user.user_id)


class ChatRequest(BaseModel):
    message: str


@app.post("/chat-stream")
def chat_stream(
    req: ChatRequest,
    user: Optional[TokenData] = Depends(get_optional_user),
):
    def generate():
        full_response = ""
        for chunk in stream_chat_with_model(req.message):
            full_response += chunk
            yield chunk
        if user and full_response:
            save_history(user.user_id, req.message, full_response)

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")
