import json
import httpx

from config import OLLAMA_MODEL, OLLAMA_URL


async def stream_chat_with_model(prompt: str):
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": True,
                "think": False
            },
        ) as response:
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    payload = json.loads(line)
                    text = payload.get("response")
                except json.JSONDecodeError:
                    text = line
                if text:
                    yield text
