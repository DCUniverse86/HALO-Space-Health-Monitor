import asyncio

from google import genai
from pydantic import BaseModel

from app.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)


class ChatOutput(BaseModel):
    summary: str
    likely_causes: list[str]
    questions: list[str]
    actions: list[str]


async def ask_gemini(prompt: str) -> ChatOutput:
    response = await asyncio.to_thread(
        client.interactions.create,
        model="gemini-3.6-flash",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": ChatOutput.model_json_schema(),
        },
    )
    return ChatOutput.model_validate_json(response.output_text)
