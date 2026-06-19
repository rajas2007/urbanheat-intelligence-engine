import os

def get_llm_provider():
    provider_name = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    if provider_name == "anthropic":
        from .anthropic_provider import AnthropicProvider
        return AnthropicProvider()
    elif provider_name == "gemini":
        from .gemini_provider import GeminiProvider
        return GeminiProvider()
    else:
        from .gemini_provider import GeminiProvider
        return GeminiProvider()
