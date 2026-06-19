from abc import ABC, abstractmethod
from typing import Any

class LLMProvider(ABC):
    @abstractmethod
    def generate_chat(self, messages: list[dict], system_prompt: str) -> str:
        """Generate a chat response."""
        pass

    @abstractmethod
    def generate_analysis_json(self, prompt: str) -> dict[str, Any]:
        """Generate an analysis report in JSON format."""
        pass
