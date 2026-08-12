import json

import requests

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.llms.base import LlmProvider
from app.integrations.llms.registry import llm_registry
from app.integrations.llms.types import LlmRequest, LlmTool
from app.schema.setting import Setting


class GeminiLlmProvider(LlmProvider):
    key = 'gemini'
    label = 'Google Gemini'
    supported_tools = frozenset({LlmTool.WEB_SEARCH})

    def _request_text(self, request: LlmRequest) -> str:
        url, api_key, model = self._require_config()
        payload: dict[str, object] = {
            'model': model,
            'input': f'{request.system_prompt}\n\nInput JSON:\n{json.dumps(request.user_payload, ensure_ascii=False)}',
        }
        if LlmTool.WEB_SEARCH in request.tools:
            payload['tools'] = [{'type': 'google_search'}]

        response = requests.post(
            url,
            headers={'x-goog-api-key': api_key, 'Content-Type': 'application/json'},
            json=payload,
            timeout=Setting().crawler.timeout,
        )
        response.raise_for_status()
        result = response.json()
        steps = result.get('steps') or []
        if LlmTool.WEB_SEARCH in request.tools and not any(
            isinstance(step, dict) and step.get('type') == 'google_search_call' for step in steps
        ):
            raise BizException('LLM 未执行联网搜索', error_code=ErrorCode.REQUEST_FAILED)

        if isinstance(result.get('output_text'), str):
            return result['output_text']
        for step in reversed(steps):
            if not isinstance(step, dict) or step.get('type') != 'model_output':
                continue
            for content in step.get('content') or []:
                if isinstance(content, dict) and isinstance(content.get('text'), str):
                    return content['text']
        return ''


llm_registry.register(GeminiLlmProvider)
