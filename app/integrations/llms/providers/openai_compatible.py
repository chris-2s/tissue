import json

import requests

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.llms.base import LlmProvider
from app.integrations.llms.registry import llm_registry
from app.schema.actor import Actor
from app.schema.setting import ActorNameDisplay, Setting
from app.schema.video import VideoDetail


class OpenAICompatibleLlmProvider(LlmProvider):
    key = 'openai_compatible'
    label = 'OpenAI Compatible'

    metadata_fields = ('title', 'outline', 'tags')
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
        'Translate only the provided performer name fields, keep the same keys and array structure, and do not add biography, age, nationality, role description, or explanation. '
        'Do not invent aliases. Preserve stage-name conventions and output concise catalog-friendly names. '
        'Return only a JSON array. Each element must be an object with the same keys as the corresponding input actor. Keep alias as an array when present.'
    )

    def translate_metadata(self, video: VideoDetail, target_language: str) -> VideoDetail:
        payload: dict[str, object] = {}
        for field in self.metadata_fields:
            value = getattr(video, field)
            if isinstance(value, str) and value.strip():
                payload[field] = value
                continue
            if field == 'tags':
                tags = [tag for tag in (value or []) if isinstance(tag, str) and tag.strip()]
                if tags:
                    payload[field] = tags
        if not payload:
            return video

        translated_payload = self._chat_json(
            system_prompt=self.metadata_system_prompt,
            user_payload={
                'target_language': target_language,
                'metadata': payload,
            },
        )
        translated = video.model_copy(deep=True)
        for field in self.metadata_fields:
            value = translated_payload.get(field)
            if isinstance(value, str):
                setattr(translated, field, value)
                continue
            if field == 'tags' and isinstance(value, list):
                translated.tags = [item for item in value if isinstance(item, str)]
        return translated

    def translate_actors(
        self,
        actors: list[Actor],
        target_language: str,
        display_mode: ActorNameDisplay,
    ) -> list[Actor]:
        if not actors:
            return []

        payload_actors: list[dict[str, object] | None] = []
        for actor in actors:
            payload: dict[str, object] = {}
            if actor.name and actor.name.strip():
                payload['name'] = actor.name
            if actor.alias:
                aliases = [alias for alias in actor.alias if alias and alias.strip()]
                if aliases:
                    payload['alias'] = aliases
            payload_actors.append(payload or None)

        translatable_payload = [payload for payload in payload_actors if payload]
        if not translatable_payload:
            return actors

        translated_payloads = self._chat_json_array(
            system_prompt=self.actor_system_prompt,
            user_payload={
                'target_language': target_language,
                'actors': translatable_payload,
            },
        )
        if len(translated_payloads) != len(translatable_payload):
            raise BizException('LLM 返回结果数量不匹配', error_code=ErrorCode.REQUEST_FAILED)

        translated_actors: list[Actor] = []
        translated_index = 0
        for actor, payload in zip(actors, payload_actors):
            if not payload:
                translated_actors.append(actor)
                continue

            translated_payload = translated_payloads[translated_index]
            translated_index += 1
            translated = actor.model_copy(deep=True)
            translated_name = translated_payload.get('name')
            if isinstance(translated_name, str) and actor.name:
                translated.name = self._format_name(actor.name, translated_name, display_mode)
            translated_alias = translated_payload.get('alias')
            if isinstance(translated_alias, list):
                translated.alias = [item for item in translated_alias if isinstance(item, str)]
            translated_actors.append(translated)
        return translated_actors

    def _chat_json(self, system_prompt: str, user_payload: dict[str, object]) -> dict[str, object]:
        base_url = (self.config.get('base_url') or '').rstrip('/')
        api_key = self.config.get('api_key')
        model = self.config.get('model')
        if not base_url or not api_key or not model:
            raise BizException('LLM 配置不完整', error_code=ErrorCode.REQUEST_FAILED)

        response = requests.post(
            f'{base_url}/chat/completions',
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

    def _chat_json_array(self, system_prompt: str, user_payload: dict[str, object]) -> list[dict[str, object]]:
        base_url = (self.config.get('base_url') or '').rstrip('/')
        api_key = self.config.get('api_key')
        model = self.config.get('model')
        if not base_url or not api_key or not model:
            raise BizException('LLM 配置不完整', error_code=ErrorCode.REQUEST_FAILED)

        response = requests.post(
            f'{base_url}/chat/completions',
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
        normalized: list[dict[str, object]] = []
        for item in result:
            if not isinstance(item, dict):
                raise BizException('LLM 返回格式无效', error_code=ErrorCode.REQUEST_FAILED)
            normalized.append(item)
        return normalized

    @staticmethod
    def _format_name(source_text: str, translated_text: str, display_mode: ActorNameDisplay) -> str:
        if display_mode == ActorNameDisplay.ORIGINAL:
            return source_text
        if display_mode == ActorNameDisplay.TRANSLATED:
            return translated_text
        if translated_text == source_text:
            return source_text
        return f'{translated_text}({source_text})'


llm_registry.register(OpenAICompatibleLlmProvider)
