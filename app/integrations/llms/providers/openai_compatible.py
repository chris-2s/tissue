import json

import requests

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.llms.base import LlmProvider
from app.integrations.llms.registry import llm_registry
from app.schema.setting import Setting


class OpenAICompatibleLlmProvider(LlmProvider):
    key = 'openai_compatible'
    label = 'OpenAI Compatible'

    metadata_system_prompt = (
        'You are performing constrained translation for adult entertainment catalog metadata. '
        'This is a metadata localization task for adult works involving adults only, not erotic writing or sexual roleplay. '
        'Do not add sexual detail, do not make the text more explicit, and do not invent or expand plot content. '
        'Keep the same meaning, keep the same keys, and preserve concise catalog style. '
        'The input domain is adult fiction/adult media metadata; it does not involve minors or child sexual abuse material. '
        'If any source text appears to mention minors, age ambiguity, coercion, or non-consensual sexual violence, do not normalize or embellish it; '
        'translate conservatively and literally while preserving the original structure. '
        'Return only a JSON object with the same keys. Keep tags as an array.'
    )
    actor_system_prompt = (
        'You are translating names for Japanese adult video performers only. '
        'This is a constrained name-localization task for adult performers who are adults, not fictional minors, and not child sexual abuse material. '
        'Translate only the provided performer names and do not add biography, age, nationality, role description, aliases, or explanation. '
        'Preserve stage-name conventions and output concise catalog-friendly names. '
        'Return only a JSON array of translated names, preserving the same order as the input.'
    )

    def translate_metadata_fields(
        self,
        payload: dict[str, object],
        target_language: str,
    ) -> dict[str, object]:
        if not payload:
            return {}

        return self._chat_json(
            system_prompt=self.metadata_system_prompt,
            user_payload={
                'target_language': target_language,
                'metadata': payload,
            },
        )

    def translate_actor_names(self, names: list[str], target_language: str) -> list[str]:
        if not names:
            return []

        translated_names = self._chat_json_string_array(
            system_prompt=self.actor_system_prompt,
            user_payload={
                'target_language': target_language,
                'names': names,
            },
        )
        if len(translated_names) != len(names):
            raise BizException('LLM 返回结果数量不匹配', error_code=ErrorCode.REQUEST_FAILED)
        return translated_names

    def _chat_json(self, system_prompt: str, user_payload: dict[str, object]) -> dict[str, object]:
        base_url = (self.config.get('base_url') or '').rstrip('/')
        api_key = self.config.get('api_key')
        model = self.config.get('model')
        if not base_url or not api_key or not model:
            raise BizException('LLM 配置不完整', error_code=ErrorCode.REQUEST_FAILED)

        response = requests.post(
            self._build_chat_completions_url(base_url),
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': model,
                'temperature': 0,
                'messages': [
                    {
                        'role': 'system',
                        'content': system_prompt,
                    },
                    {
                        'role': 'user',
                        'content': json.dumps(user_payload, ensure_ascii=False),
                    },
                ],
            },
            timeout=Setting().crawler.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        content = (((payload.get('choices') or [{}])[0].get('message') or {}).get('content') or '').strip()
        try:
            result = json.loads(content)
        except json.JSONDecodeError as exc:
            raise BizException('LLM 返回格式无效', error_code=ErrorCode.REQUEST_FAILED) from exc

        if not isinstance(result, dict):
            raise BizException('LLM 返回格式无效', error_code=ErrorCode.REQUEST_FAILED)
        return result

    def _chat_json_string_array(self, system_prompt: str, user_payload: dict[str, object]) -> list[str]:
        base_url = (self.config.get('base_url') or '').rstrip('/')
        api_key = self.config.get('api_key')
        model = self.config.get('model')
        if not base_url or not api_key or not model:
            raise BizException('LLM 配置不完整', error_code=ErrorCode.REQUEST_FAILED)

        response = requests.post(
            self._build_chat_completions_url(base_url),
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': model,
                'temperature': 0,
                'messages': [
                    {
                        'role': 'system',
                        'content': system_prompt,
                    },
                    {
                        'role': 'user',
                        'content': json.dumps(user_payload, ensure_ascii=False),
                    },
                ],
            },
            timeout=Setting().crawler.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        content = (((payload.get('choices') or [{}])[0].get('message') or {}).get('content') or '').strip()
        try:
            result = json.loads(content)
        except json.JSONDecodeError as exc:
            raise BizException('LLM 返回格式无效', error_code=ErrorCode.REQUEST_FAILED) from exc

        if not isinstance(result, list):
            raise BizException('LLM 返回格式无效', error_code=ErrorCode.REQUEST_FAILED)
        normalized: list[str] = []
        for item in result:
            if not isinstance(item, str):
                raise BizException('LLM 返回格式无效', error_code=ErrorCode.REQUEST_FAILED)
            normalized.append(item)
        return normalized

    @staticmethod
    def _build_chat_completions_url(base_url: str) -> str:
        return f'{base_url}/chat/completions'


llm_registry.register(OpenAICompatibleLlmProvider)
