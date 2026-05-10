import json
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"


def stream_chat_with_model(prompt: str):
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": "gemma4:26b",
            "prompt": prompt,
            "stream": True,
            "think": False
        },
        headers={
            "Content-Type": "application/json"
        },
        stream=True,
        timeout=None,
    )

    for raw_line in response.iter_lines(decode_unicode=True):
        if not raw_line:
            continue

        try:
            payload = json.loads(raw_line)
            text = payload.get("response")
        except json.JSONDecodeError:
            text = raw_line

        if not text:
            continue

        yield text