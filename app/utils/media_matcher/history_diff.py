import argparse
import csv
import sqlite3
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path

from app.utils.media_matcher import parse_path

IGNORED_HISTORY_IDS = {
    # Extremely noisy names are allowed to fall back to manual user adjustment.
    266,
}


@dataclass(slots=True)
class HistoryDiffRow:
    id: int
    source_path: str
    old_num: str | None
    new_num: str | None
    old_is_zh: bool
    new_is_zh: bool
    old_is_uncensored: bool
    new_is_uncensored: bool
    diff_fields: str


def compare_history(db_path: Path) -> tuple[dict[str, int], list[HistoryDiffRow]]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        select id, num, is_zh, is_uncensored, source_path
        from history
        order by id
        """
    ).fetchall()
    conn.close()

    diffs: list[HistoryDiffRow] = []
    counters: Counter[str] = Counter()
    counters['total'] = len(rows)

    for row in rows:
        if row['id'] in IGNORED_HISTORY_IDS:
            counters['ignored'] += 1
            continue

        result = parse_path(row['source_path'])

        old_num = row['num'] or None
        new_num = result.num.value
        old_is_zh = bool(row['is_zh'])
        new_is_zh = result.is_zh.value
        old_is_uncensored = bool(row['is_uncensored'])
        new_is_uncensored = result.is_uncensored.value

        changed_fields: list[str] = []
        if old_num != new_num:
            counters['num_diff'] += 1
            changed_fields.append('num')
        if old_is_zh != new_is_zh:
            counters['is_zh_diff'] += 1
            changed_fields.append('is_zh')
        if old_is_uncensored != new_is_uncensored:
            counters['is_uncensored_diff'] += 1
            changed_fields.append('is_uncensored')

        if changed_fields:
            diff_key = '+'.join(changed_fields)
            counters[f'diff_type:{diff_key}'] += 1
            diffs.append(
                HistoryDiffRow(
                    id=row['id'],
                    source_path=row['source_path'],
                    old_num=old_num,
                    new_num=new_num,
                    old_is_zh=old_is_zh,
                    new_is_zh=new_is_zh,
                    old_is_uncensored=old_is_uncensored,
                    new_is_uncensored=new_is_uncensored,
                    diff_fields=diff_key,
                )
            )

    counters['diff_total'] = len(diffs)
    return dict(counters), diffs


def write_diff_csv(path: Path, diffs: list[HistoryDiffRow]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                'id',
                'diff_fields',
                'old_num',
                'new_num',
                'old_is_zh',
                'new_is_zh',
                'old_is_uncensored',
                'new_is_uncensored',
                'source_path',
            ],
        )
        writer.writeheader()
        for diff in diffs:
            writer.writerow(asdict(diff))


def write_summary(path: Path, summary: dict[str, int], diffs: list[HistoryDiffRow]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    diff_type_counts = sorted(
        ((key.removeprefix('diff_type:'), value) for key, value in summary.items() if key.startswith('diff_type:')),
        key=lambda item: (-item[1], item[0]),
    )

    lines = [
        f"total={summary.get('total', 0)}",
        f"ignored={summary.get('ignored', 0)}",
        f"diff_total={summary.get('diff_total', 0)}",
        f"num_diff={summary.get('num_diff', 0)}",
        f"is_zh_diff={summary.get('is_zh_diff', 0)}",
        f"is_uncensored_diff={summary.get('is_uncensored_diff', 0)}",
        "",
        "[diff_types]",
    ]

    for diff_type, count in diff_type_counts:
        lines.append(f"{diff_type}={count}")

    lines.append("")
    lines.append("[sample_rows]")
    for diff in diffs[:20]:
        lines.append(
            f"{diff.id}\t{diff.diff_fields}\told=({diff.old_num},{int(diff.old_is_zh)},{int(diff.old_is_uncensored)})"
            f"\tnew=({diff.new_num},{int(diff.new_is_zh)},{int(diff.new_is_uncensored)})\t{diff.source_path}"
        )

    path.write_text('\n'.join(lines), encoding='utf-8')


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parents[3]
    default_db = root / 'config' / 'app.db'
    default_csv = root / 'config' / 'cache' / 'history_rule_diff.csv'
    default_summary = root / 'config' / 'cache' / 'history_rule_diff.summary.txt'

    parser = argparse.ArgumentParser(description='Compare legacy history rows against current media matcher rules.')
    parser.add_argument('--db', type=Path, default=default_db)
    parser.add_argument('--csv', type=Path, default=default_csv)
    parser.add_argument('--summary', type=Path, default=default_summary)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    summary, diffs = compare_history(args.db)
    write_diff_csv(args.csv, diffs)
    write_summary(args.summary, summary, diffs)

    print(f"total={summary.get('total', 0)}")
    print(f"ignored={summary.get('ignored', 0)}")
    print(f"diff_total={summary.get('diff_total', 0)}")
    print(f"num_diff={summary.get('num_diff', 0)}")
    print(f"is_zh_diff={summary.get('is_zh_diff', 0)}")
    print(f"is_uncensored_diff={summary.get('is_uncensored_diff', 0)}")
    print(f"csv={args.csv}")
    print(f"summary={args.summary}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
