from dataclasses import dataclass, field


@dataclass(slots=True)
class Evidence:
    source: str
    key: str
    value: str
    score: float


@dataclass(slots=True)
class MatchResult:
    value: str | None
    score: float = 0.0
    evidences: list[Evidence] = field(default_factory=list)


@dataclass(slots=True)
class FlagResult:
    value: bool
    score: float = 0.0
    evidences: list[Evidence] = field(default_factory=list)


@dataclass(slots=True)
class ParseResult:
    num: MatchResult
    is_zh: FlagResult
    is_uncensored: FlagResult
