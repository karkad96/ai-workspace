import json
import httpx

from config import OLLAMA_MODEL, OLLAMA_URL


async def stream_chat_with_model(messages: list[dict]):
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": True,
                "think": False
            },
        ) as response:
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    payload = json.loads(line)
                    text = payload.get("message", {}).get("content")
                except json.JSONDecodeError:
                    text = line
                if text:
                    yield text
