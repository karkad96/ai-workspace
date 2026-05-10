import json
import requests

from config import OLLAMA_MODEL, OLLAMA_URL


def stream_chat_with_model(prompt: str):
    response = requests.post(
        OLLAMA_URL,
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": True, "think": False},
        headers={"Content-Type": "application/json"},
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
        if text:
            yield text
