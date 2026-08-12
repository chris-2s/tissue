import json

import requests

from app.integrations.llms.base import LlmProvider
from app.integrations.llms.registry import llm_registry
from app.integrations.llms.types import LlmRequest
from app.schema.setting import Setting


class OpenAICompatibleLlmProvider(LlmProvider):
    key = 'openai_compatible'
    label = 'OpenAI Chat Completions'

    def _request_text(self, request: LlmRequest) -> str:
        base_url, api_key, model = self._require_config()
        response = requests.post(
            f'{base_url}/chat/completions',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={
                'model': model,
                'temperature': 0,
                'messages': [
                    {'role': 'system', 'content': request.system_prompt},
                    {'role': 'user', 'content': json.dumps(request.user_payload, ensure_ascii=False)},
                ],
            },
            timeout=Setting().crawler.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        return (((payload.get('choices') or [{}])[0].get('message') or {}).get('content') or '')


llm_registry.register(OpenAICompatibleLlmProvider)
