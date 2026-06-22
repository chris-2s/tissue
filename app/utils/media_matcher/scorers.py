from collections import defaultdict

from app.utils.media_matcher.normalize import normalize_text
from app.utils.media_matcher.patterns import (
    COMPACT_SUFFIX_RE,
    NUM_PATTERNS,
    SUFFIX_RE,
    UNCENSORED_KEYWORD_SCORES,
    UNCENSORED_SUFFIX_SCORES,
    UNCENSORED_THRESHOLD,
    ZH_KEYWORD_SCORES,
    ZH_SUFFIX_SCORES,
    ZH_THRESHOLD,
)
from app.utils.media_matcher.types import Evidence, FlagResult, MatchResult, ParseResult

SOURCE_SCORE_BONUS = {
    'basename': 0.3,
    'basename_chunk': 0.2,
    'parent': 0.25,
}

SOURCE_PRIORITY = {
    'parent': 3,
    'basename': 2,
    'basename_chunk': 1,
    'path': 0,
    'path_chunk': 0,
}


def match_num(candidates: list[tuple[str, str]]) -> MatchResult:
    best = MatchResult(value=None)
    for source, raw_text in candidates:
        if not raw_text:
            continue
        text = normalize_text(raw_text)
        for key, pattern, base_score in NUM_PATTERNS:
            for matched in pattern.finditer(text):
                value = _normalize_num_match(key, matched)
                score = _score_num_match(source, key, value, text, base_score)
                evidence = Evidence(source=source, key=key, value=value, score=score)
                if _is_better_num_candidate(best, score, value, source):
                    best = MatchResult(value=value, score=score, evidences=[evidence])
    return best


def detect_flags(texts: list[tuple[str, str]] | None = None, tags: list[str] | None = None) -> tuple[FlagResult, FlagResult]:
    texts = texts or []
    tags = tags or []

    zh_evidences = _collect_keyword_evidences(texts, tags, ZH_KEYWORD_SCORES, ZH_SUFFIX_SCORES)
    uncensored_evidences = _collect_keyword_evidences(
        texts,
        tags,
        UNCENSORED_KEYWORD_SCORES,
        UNCENSORED_SUFFIX_SCORES,
    )

    zh_score = sum(e.score for e in zh_evidences)
    uncensored_score = sum(e.score for e in uncensored_evidences)

    return (
        FlagResult(value=zh_score >= ZH_THRESHOLD, score=zh_score, evidences=zh_evidences),
        FlagResult(value=uncensored_score >= UNCENSORED_THRESHOLD, score=uncensored_score, evidences=uncensored_evidences),
    )


def parse_texts(texts: list[tuple[str, str]]) -> ParseResult:
    num_result = match_num(texts)
    zh_result, uncensored_result = detect_flags(texts=texts)
    return ParseResult(num=num_result, is_zh=zh_result, is_uncensored=uncensored_result)


def _normalize_num_match(key: str, matched) -> str:
    if key == 'site_suffix_code':
        return normalize_text(matched.group(2))
    return normalize_text(matched.group(1))


def _score_num_match(source: str, key: str, value: str, text: str, base_score: float) -> float:
    score = base_score

    score += SOURCE_SCORE_BONUS.get(source, 0.0)

    if text.startswith(value):
        score += 0.2

    if f'{value}-' in text:
        score += 0.1

    if key == 'site_suffix_code' and any(flag in text for flag in ('1080P', 'FHD')):
        score += 0.1

    return score


def _is_better_num_candidate(best: MatchResult, score: float, value: str, source: str) -> bool:
    if score > best.score:
        return True
    if score < best.score:
        return False
    if best.value is None:
        return True

    current_priority = SOURCE_PRIORITY.get(source, 0)
    best_priority = SOURCE_PRIORITY.get(best.evidences[0].source, 0) if best.evidences else 0
    if current_priority > best_priority:
        return True
    if current_priority < best_priority:
        return False

    return len(value) < len(best.value)


def _collect_keyword_evidences(
    texts: list[tuple[str, str]],
    tags: list[str],
    keyword_scores: dict[str, float],
    suffix_scores: dict[str, float],
) -> list[Evidence]:
    grouped: dict[tuple[str, str, str], Evidence] = {}

    for source, raw_text in texts:
        if not raw_text:
            continue
        text = normalize_text(raw_text)
        for keyword, score in keyword_scores.items():
            if keyword in text:
                evidence = Evidence(source=source, key='keyword', value=keyword, score=score)
                grouped[(source, 'keyword', keyword)] = evidence

        suffix_hits: defaultdict[str, float] = defaultdict(float)
        for suffix in SUFFIX_RE.findall(text):
            if suffix in suffix_scores:
                suffix_hits[suffix] = max(suffix_hits[suffix], suffix_scores[suffix])
        for suffix in COMPACT_SUFFIX_RE.findall(text):
            if suffix in suffix_scores:
                suffix_hits[suffix] = max(suffix_hits[suffix], suffix_scores[suffix])

        for suffix, score in suffix_hits.items():
            evidence = Evidence(source=source, key='suffix', value=suffix, score=score)
            grouped[(source, 'suffix', suffix)] = evidence

    for tag in tags:
        if not tag:
            continue
        normalized_tag = normalize_text(tag)
        if normalized_tag in keyword_scores:
            evidence = Evidence(source='tag', key='tag', value=normalized_tag, score=keyword_scores[normalized_tag])
            grouped[('tag', 'tag', normalized_tag)] = evidence

    return list(grouped.values())
