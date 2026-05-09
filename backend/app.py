from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from llm import chat_with_model, stream_chat_with_model
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    reply = chat_with_model(req.message)
    return {"reply": reply}

@app.post("/chat-stream")
def chat_stream(req: ChatRequest):
    return StreamingResponse(
        stream_chat_with_model(req.message),
        media_type="text/plain; charset=utf-8",
    )