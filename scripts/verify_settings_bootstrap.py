import json
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from configparser import ConfigParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PYTHON = ROOT / ".venv" / "bin" / "python"


def clone_repo(target: Path) -> None:
    ignore = shutil.ignore_patterns(".git", ".venv", "node_modules", "dist", "frontend/dist", "__pycache__", "*.pyc")
    shutil.copytree(ROOT, target, ignore=ignore)
    config_dir = target / "config"
    if config_dir.exists():
        shutil.rmtree(config_dir)
    config_dir.mkdir(parents=True, exist_ok=True)


def run_py(repo: Path, code: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(PYTHON), "-c", code],
        cwd=repo,
        text=True,
        capture_output=True,
        check=False,
    )


def init_db(repo: Path) -> None:
    result = run_py(repo, "from app.db.models import Base; from app.db import engine; Base.metadata.create_all(bind=engine)")
    if result.returncode != 0:
        raise RuntimeError(result.stderr)


def bootstrap_and_load(repo: Path) -> dict:
    code = (
        "from app.settings import settings_manager; "
        "settings_manager.bootstrap(); "
        "from app.schema import Setting; "
        "import json; "
        "print(json.dumps(Setting.read(), ensure_ascii=False))"
    )
    result = run_py(repo, code)
    if result.returncode != 0:
        raise RuntimeError(result.stderr)
    return json.loads(result.stdout.strip().splitlines()[-1])


def fetch_versions(repo: Path) -> dict[str, int]:
    db_path = repo / "config" / "app.db"
    conn = sqlite3.connect(db_path)
    rows = conn.execute("select namespace, version from settings").fetchall()
    conn.close()
    return {namespace: version for namespace, version in rows}


def verify_empty_db(base: Path) -> dict:
    repo = base / "empty"
    clone_repo(repo)
    init_db(repo)
    payload = bootstrap_and_load(repo)
    versions = fetch_versions(repo)
    return {
        "download_version": versions["download"],
        "notify_version": versions["notify"],
        "download_provider": payload["download"]["provider"],
        "notify_provider": payload["notify"]["provider"],
    }


def verify_ini_import(base: Path) -> dict:
    repo = base / "ini"
    clone_repo(repo)
    init_db(repo)
    parser = ConfigParser()
    parser["download"] = {
        "host": "http://127.0.0.1:8080",
        "username": "legacy-user",
        "password": "legacy-pass",
        "trans_mode": "move",
        "download_path": "/downloads-old",
        "mapping_path": "/mapped-old",
    }
    parser["notify"] = {
        "type": "webhook",
        "webhook_url": "https://example.com/hook",
    }
    config_path = repo / "config" / "app.conf"
    with config_path.open("w", encoding="utf-8") as file:
        parser.write(file)
    payload = bootstrap_and_load(repo)
    versions = fetch_versions(repo)
    return {
        "download_version": versions["download"],
        "notify_version": versions["notify"],
        "download_host": payload["download"]["providers"]["qbittorrent"]["host"],
        "notify_provider": payload["notify"]["provider"],
        "legacy_ini_deleted": not config_path.exists(),
    }


def verify_existing_v1(base: Path) -> dict:
    repo = base / "v1"
    clone_repo(repo)
    init_db(repo)
    db_path = repo / "config" / "app.db"
    conn = sqlite3.connect(db_path)
    conn.execute("delete from settings")
    conn.execute(
        "insert into settings(namespace, version, payload) values (?, ?, ?)",
        ("download", 1, json.dumps({"host": "http://v1-host:8080", "trans_mode": "copy"})),
    )
    conn.execute(
        "insert into settings(namespace, version, payload) values (?, ?, ?)",
        ("notify", 1, json.dumps({"type": "telegram", "telegram_token": "token"})),
    )
    conn.commit()
    conn.close()
    payload = bootstrap_and_load(repo)
    versions = fetch_versions(repo)
    return {
        "download_version": versions["download"],
        "notify_version": versions["notify"],
        "download_host": payload["download"]["providers"]["qbittorrent"]["host"],
        "notify_provider": payload["notify"]["provider"],
    }


def main() -> None:
    base = Path(tempfile.mkdtemp(prefix="tissue-settings-verify-", dir="/private/tmp"))
    results = {
        "empty_db": verify_empty_db(base),
        "ini_import": verify_ini_import(base),
        "existing_v1": verify_existing_v1(base),
    }
    print(json.dumps({"workspace": str(base), "results": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    sys.exit(main())
