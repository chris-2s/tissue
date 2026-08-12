import json

import requests

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.llms.base import LlmProvider
from app.integrations.llms.registry import llm_registry
from app.integrations.llms.types import LlmRequest, LlmTool
from app.schema.setting import Setting


class OpenAIResponsesLlmProvider(LlmProvider):
    key = 'openai_responses'
    label = 'OpenAI Responses'
    supported_tools = frozenset({LlmTool.WEB_SEARCH})

    def _request_text(self, request: LlmRequest) -> str:
        base_url, api_key, model = self._require_config()
        payload: dict[str, object] = {
            'model': model,
            'instructions': request.system_prompt,
            'input': json.dumps(request.user_payload, ensure_ascii=False),
            'store': False,
        }
        if LlmTool.WEB_SEARCH in request.tools:
            payload['tools'] = [{'type': 'web_search'}]
            payload['tool_choice'] = 'required'

        response = requests.post(
            f'{base_url}/responses',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json=payload,
            timeout=Setting().crawler.timeout,
        )
        response.raise_for_status()
        result = response.json()
        output = result.get('output') or []
        if LlmTool.WEB_SEARCH in request.tools and not any(
            isinstance(item, dict) and item.get('type') == 'web_search_call' for item in output
        ):
            raise BizException('LLM 未执行联网搜索', error_code=ErrorCode.REQUEST_FAILED)

        if isinstance(result.get('output_text'), str):
            return result['output_text']
        for item in reversed(output):
            if not isinstance(item, dict) or item.get('type') != 'message':
                continue
            for content in item.get('content') or []:
                if isinstance(content, dict) and content.get('type') in {'output_text', 'text'}:
                    text = content.get('text')
                    if isinstance(text, str):
                        return text
        return ''


llm_registry.register(OpenAIResponsesLlmProvider)
