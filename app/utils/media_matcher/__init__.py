from app.utils.media_matcher.normalize import split_path_texts
from app.utils.media_matcher.scorers import detect_flags, parse_texts
from app.utils.media_matcher.types import Evidence, FlagResult, MatchResult, ParseResult


def parse_path(path: str) -> ParseResult:
    return parse_texts(split_path_texts(path))


def detect_flags_with_tag_priority(
    texts: list[tuple[str, str]] | None = None,
    tags: list[str] | None = None,
) -> tuple[FlagResult, FlagResult]:
    tag_zh, tag_uncensored = detect_flags(texts=[], tags=tags)
    text_zh, text_uncensored = detect_flags(texts=texts, tags=[])

    # Spider tags only provide positive signals. A tag hit forces True for that field;
    # otherwise the field falls back to filename/title parsing. Fields stay independent.
    zh_result = tag_zh if tag_zh.value else text_zh
    uncensored_result = tag_uncensored if tag_uncensored.value else text_uncensored
    return zh_result, uncensored_result


__all__ = [
    'Evidence',
    'FlagResult',
    'MatchResult',
    'ParseResult',
    'detect_flags',
    'detect_flags_with_tag_priority',
    'parse_path',
]
