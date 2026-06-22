import re

CODE_PREFIX = r'(?:\d{2,6}[A-Z]{2,8}|[A-Z]{2,8})'
CODE_SUFFIX = r'(?:[A-Z]?\d{2,5})'


NUM_PATTERNS: list[tuple[str, re.Pattern[str], float]] = [
    (
        'legacy_date_code',
        re.compile(r'(^.+\.\d{2,4}\.\d{1,2}\.\d{1,2})'),
        1.2,
    ),
    (
        'site_suffix_code',
        re.compile(r'(^[\w.]+-(\w+-\w+)(-\w+)*-(1080P|FHD))'),
        0.7,
    ),
    (
        'standard_code',
        re.compile(rf'(?<![A-Z0-9])({CODE_PREFIX}-{CODE_SUFFIX})(?:-(?:C|CH|U|UC))?(?![A-Z0-9])'),
        1.0,
    ),
    (
        'compact_suffix_code',
        re.compile(rf'(?<![A-Z0-9])({CODE_PREFIX}-{CODE_SUFFIX})(?:C|CH)(?![A-Z0-9])'),
        0.95,
    ),
    (
        'numeric_code',
        re.compile(r'(?<!\d)(\d{6}-\d{2,4})(?!\d)'),
        0.9,
    ),
]

ZH_SUFFIX_SCORES = {
    'C': 0.9,
    'CH': 0.9,
    'UC': 0.7,
}

UNCENSORED_SUFFIX_SCORES = {
    'U': 1.0,
    'UC': 1.0,
}

ZH_KEYWORD_SCORES = {
    '中文字幕': 1.0,
    '字幕': 1.0,
    '中字': 0.9,
    '中文': 0.6,
    'SUBTITLE': 0.8,
    'SUB': 0.7,
    'CHS': 0.7,
}

UNCENSORED_KEYWORD_SCORES = {
    'UNCENSORED': 1.0,
    '无码': 1.0,
    '無碼': 1.0,
    '破解': 0.4,
}

SUFFIX_RE = re.compile(rf'(?<![A-Z0-9])(?:{CODE_PREFIX}-{CODE_SUFFIX}|\d{{6}}-\d{{2,4}})-(UC|CH|C|U)(?![A-Z0-9])')
COMPACT_SUFFIX_RE = re.compile(rf'(?<![A-Z0-9])(?:{CODE_PREFIX}-{CODE_SUFFIX})(UC|CH|C|U)(?![A-Z0-9])')

ZH_THRESHOLD = 0.9
UNCENSORED_THRESHOLD = 0.9
