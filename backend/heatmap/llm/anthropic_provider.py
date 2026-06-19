import json
import os
import anthropic
from .base_provider import LLMProvider
from typing import Any

class AnthropicProvider(LLMProvider):
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", "your-anthropic-api-key-here"))

    def generate_chat(self, messages: list[dict], system_prompt: str) -> str:
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1000,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text

    def generate_analysis_json(self, prompt: str) -> dict[str, Any]:
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        
        text = response.content[0].text
        # Naive json extraction
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            text = text[start:end+1]
            
        return json.loads(text)
