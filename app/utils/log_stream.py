import json
import re
from collections import deque
from pathlib import Path

LOG_LINE_RE = re.compile(
    r"^【(?P<level>[^】]+)】(?P<time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:,\d{3})?) - (?P<module>.+?) - (?P<content>.*)$"
)


def build_log_event(line: str) -> dict[str, str]:
    content = line.rstrip('\r\n')
    matched = LOG_LINE_RE.match(content)
    if not matched:
        return {
            "raw": content,
            "level": "INFO",
            "time": "",
            "module": "",
            "content": content,
        }
    return {
        "raw": content,
        "level": matched.group("level"),
        "time": matched.group("time"),
        "module": matched.group("module"),
        "content": matched.group("content"),
    }


def format_sse(data: dict[str, str]) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def read_last_lines(path: Path, limit: int) -> list[str]:
    with open(path, 'r', encoding='utf-8', errors='replace') as log_file:
        return list(deque(log_file, maxlen=limit))
