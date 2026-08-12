from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class LlmTool(str, Enum):
    WEB_SEARCH = 'web_search'


@dataclass(frozen=True)
class LlmRequest:
    system_prompt: str
    user_payload: dict[str, Any]
    tools: frozenset[LlmTool] = field(default_factory=frozenset)
