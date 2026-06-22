import os.path
import re


MULTI_HYPHEN_RE = re.compile(r'-{2,}')
SPACE_AROUND_HYPHEN_RE = re.compile(r'\s*-\s*')
WHITESPACE_RE = re.compile(r'\s+')


def normalize_text(text: str) -> str:
    normalized = text.upper().strip()
    normalized = normalized.replace('_', '-')
    normalized = SPACE_AROUND_HYPHEN_RE.sub('-', normalized)
    normalized = WHITESPACE_RE.sub(' ', normalized)
    normalized = MULTI_HYPHEN_RE.sub('-', normalized)
    return normalized


def split_path_texts(path: str) -> list[tuple[str, str]]:
    basename = os.path.splitext(os.path.basename(path))[0]
    parent = os.path.basename(os.path.dirname(path))

    # Keep parsing inputs simple: prefer basename, but also inspect the parent
    # folder because download folders often preserve a cleaner code when the file
    # name itself is polluted by site prefixes or suffixes.
    items: list[tuple[str, str]] = []
    for source, value in (
        ('basename', basename),
        ('parent', parent),
        ('path', path),
    ):
        if not value:
            continue
        items.append((source, value))
        for chunk in value.split('@'):
            chunk = chunk.strip()
            if chunk and chunk != value:
                items.append((f'{source}_chunk', chunk))
    return items
