from app.i18n import get_default_locale, normalize_locale, translate
from app.integrations.llms import llm_manager
from app.integrations.translators import translator_manager
from app.schema.setting import ActorTranslationMode, Setting, TextProcessingHandler
from app.schema.video import VideoActor, VideoDetail
from app.utils.logger import logger


class TextProcessingService:
    metadata_fields = ('title', 'outline', 'tags')

    def process_scraped_video(self, video: VideoDetail, target_language: str | None = None) -> VideoDetail:
        locale = normalize_locale(target_language or get_default_locale())
        setting = Setting().text_processing

        processed = video
        try:
            processed = self.process_metadata(processed, setting.metadata_translator, locale)
        except Exception as exc:
            logger.warning(
                translate(
                    'log.text_processing.metadata_failed',
                    {'error': str(exc)},
                )
            )

        try:
            processed = self.process_actors(processed, setting.actor_translator, setting.actor_translation_mode, locale)
        except Exception as exc:
            logger.warning(
                translate(
                    'log.text_processing.actors_failed',
                    {'error': str(exc)},
                )
            )

        return processed

    def process_metadata(
        self,
        video: VideoDetail,
        handler: TextProcessingHandler,
        target_language: str,
    ) -> VideoDetail:
        if handler == TextProcessingHandler.OFF:
            return video

        payload = self._extract_metadata_payload(video)
        if not payload:
            return video

        logger.debug(
            translate(
                'log.text_processing.metadata_started',
                {
                    'handler': handler.value,
                    'language': target_language,
                    'field_count': len(payload),
                    'tag_count': len(payload.get('tags') or []) if isinstance(payload.get('tags'), list) else 0,
                },
            )
        )

        if handler == TextProcessingHandler.TRANSLATE:
            translated_payload = self._translate_metadata_payload(payload, target_language)
        else:
            translated_payload = llm_manager.get_active().translate_metadata_fields(payload, target_language)

        translated_video = self._apply_metadata_payload(video, translated_payload)
        logger.debug(
            translate(
                'log.text_processing.metadata_succeeded',
                {
                    'handler': handler.value,
                    'language': target_language,
                    'fields': ','.join(sorted(translated_payload.keys())),
                    'tag_count': len(translated_payload.get('tags') or []) if isinstance(translated_payload.get('tags'), list) else 0,
                },
            )
        )
        return translated_video

    def process_actors(
        self,
        video: VideoDetail,
        handler: TextProcessingHandler,
        mode: ActorTranslationMode,
        target_language: str,
    ) -> VideoDetail:
        if handler == TextProcessingHandler.OFF or not video.actors:
            return video

        original_names = [actor.name.strip() for actor in video.actors if actor.name and actor.name.strip()]
        if not original_names:
            return video

        logger.debug(
            translate(
                'log.text_processing.actors_started',
                {
                    'handler': handler.value,
                    'language': target_language,
                    'mode': mode.value,
                    'count': len(original_names),
                },
            )
        )

        if handler == TextProcessingHandler.TRANSLATE:
            translated_names = translator_manager.get_active().translate_texts(original_names, target_language)
        else:
            translated_names = llm_manager.get_active().translate_actor_names(original_names, target_language)

        if len(translated_names) != len(original_names):
            raise ValueError('translated actor count mismatch')

        translated_index = 0
        actors: list[VideoActor] = []
        for actor in video.actors:
            copied_actor = actor.model_copy(deep=True)
            source_name = (actor.name or '').strip()
            if source_name:
                translated_name = translated_names[translated_index].strip()
                translated_index += 1
                copied_actor.name = self._format_actor_name(source_name, translated_name, mode)
            actors.append(copied_actor)

        translated_video = video.model_copy(deep=True)
        translated_video.actors = actors
        logger.debug(
            translate(
                'log.text_processing.actors_succeeded',
                {
                    'handler': handler.value,
                    'language': target_language,
                    'mode': mode.value,
                    'count': len(translated_names),
                },
            )
        )
        return translated_video

    def _extract_metadata_payload(self, video: VideoDetail) -> dict[str, object]:
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
        return payload

    def _translate_metadata_payload(self, payload: dict[str, object], target_language: str) -> dict[str, object]:
        texts: list[str] = []
        field_map: list[tuple[str, str]] = []

        for field in self.metadata_fields:
            value = payload.get(field)
            if isinstance(value, str):
                texts.append(value)
                field_map.append((field, 'str'))
                continue
            if field == 'tags' and isinstance(value, list):
                for tag in value:
                    if isinstance(tag, str) and tag.strip():
                        texts.append(tag)
                        field_map.append((field, 'tag'))

        if not texts:
            return payload

        translated_texts = translator_manager.get_active().translate_texts(texts, target_language)
        if len(translated_texts) != len(field_map):
            raise ValueError('translated metadata count mismatch')

        translated_payload: dict[str, object] = {}
        translated_tags: list[str] = []
        for (field, value_type), translated_text in zip(field_map, translated_texts):
            if value_type == 'str':
                translated_payload[field] = translated_text
            else:
                translated_tags.append(translated_text)

        if translated_tags:
            translated_payload['tags'] = translated_tags
        return translated_payload

    @staticmethod
    def _apply_metadata_payload(video: VideoDetail, payload: dict[str, object]) -> VideoDetail:
        translated_video = video.model_copy(deep=True)

        title = payload.get('title')
        if isinstance(title, str) and title.strip():
            translated_video.title = title

        outline = payload.get('outline')
        if isinstance(outline, str) and outline.strip():
            translated_video.outline = outline

        tags = payload.get('tags')
        if isinstance(tags, list):
            normalized_tags = [item for item in tags if isinstance(item, str) and item.strip()]
            if normalized_tags:
                translated_video.tags = normalized_tags

        return translated_video

    @staticmethod
    def _format_actor_name(
        source_name: str,
        translated_name: str,
        mode: ActorTranslationMode,
    ) -> str:
        if not translated_name or translated_name == source_name:
            return source_name
        if mode == ActorTranslationMode.TRANSLATED:
            return translated_name
        return f'{translated_name}({source_name})'


text_processing_service = TextProcessingService()
