import os
import json
from google import genai
from google.genai import types
from .base_provider import LLMProvider
from typing import Any

class GeminiProvider(LLMProvider):
    def __init__(self):
        # google-genai automatically picks up GEMINI_API_KEY from environment
        self.client = genai.Client()

    def generate_chat(self, messages: list[dict], system_prompt: str) -> str:
        # Map anthropic messages format to gemini format if needed. 
        # Anthropic format: [{"role": "user", "content": "..."}]
        # Gemini format: types.Content(role="user", parts=[types.Part.from_text("...")])
        
        gemini_messages = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            gemini_messages.append(
                types.Content(role=role, parts=[types.Part.from_text(msg["content"])])
            )

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
        )

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=gemini_messages,
            config=config,
        )
        return response.text

    def generate_analysis_json(self, prompt: str) -> dict[str, Any]:
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        )
        
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=config,
        )
        
        return json.loads(response.text)
