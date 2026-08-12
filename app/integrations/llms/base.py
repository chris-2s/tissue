import json
import re
from abc import ABC, abstractmethod
from typing import Any

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.llms.prompts import (
    ACTOR_TRANSLATION_PROMPT,
    METADATA_TRANSLATION_PROMPT,
)
from app.integrations.llms.types import LlmRequest, LlmTool


class LlmProvider(ABC):
    key: str
    label: str
    supported_tools: frozenset[LlmTool] = frozenset()

    def __init__(self, config: dict[str, Any]):
        self.config = config

    def translate_metadata_fields(
        self,
        payload: dict[str, object],
        target_language: str,
    ) -> dict[str, object]:
        if not payload:
            return {}
        result = self._request_json(LlmRequest(
            system_prompt=METADATA_TRANSLATION_PROMPT,
            user_payload={'target_language': target_language, 'metadata': payload},
        ))
        if not isinstance(result, dict):
            self._raise_invalid_response()
        return result

    def translate_actor_names(self, names: list[str], target_language: str) -> list[str]:
        if not names:
            return []
        result = self._request_json(LlmRequest(
            system_prompt=ACTOR_TRANSLATION_PROMPT,
            user_payload={'target_language': target_language, 'names': names},
        ))
        if not isinstance(result, list) or any(not isinstance(item, str) for item in result):
            self._raise_invalid_response()
        if len(result) != len(names):
            raise BizException('LLM 返回结果数量不匹配', error_code=ErrorCode.REQUEST_FAILED)
        return result

    def _request_json(self, request: LlmRequest):
        unsupported = request.tools - self.supported_tools
        if unsupported:
            raise BizException('当前 LLM 不支持请求的工具', error_code=ErrorCode.PROVIDER_UNSUPPORTED)
        return self._parse_json_content(self._request_text(request).strip())

    @abstractmethod
    def _request_text(self, request: LlmRequest) -> str:
        pass

    def _require_config(self) -> tuple[str, str, str]:
        base_url = (self.config.get('base_url') or '').rstrip('/')
        api_key = self.config.get('api_key') or ''
        model = self.config.get('model') or ''
        if not base_url or not api_key or not model:
            raise BizException('LLM 配置不完整', error_code=ErrorCode.REQUEST_FAILED)
        return base_url, api_key, model

    @classmethod
    def _parse_json_content(cls, content: str):
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            fenced_match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL | re.IGNORECASE)
            if fenced_match:
                try:
                    return json.loads(fenced_match.group(1).strip())
                except json.JSONDecodeError:
                    pass
            raise BizException('LLM 返回格式无效', error_code=ErrorCode.REQUEST_FAILED) from exc

    @staticmethod
    def _raise_invalid_response() -> None:
        raise BizException('LLM 返回格式无效', error_code=ErrorCode.REQUEST_FAILED)
