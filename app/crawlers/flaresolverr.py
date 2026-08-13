from threading import Lock
from typing import Any

import requests

from app.schema.setting import Setting


FLARESOLVERR_SESSION_ID = 'tissue-default'
_solver_lock = Lock()

FlareSolverrResult = tuple[list[dict], str]
FlareSolverrResponseResult = tuple[list[dict], str, str, str, int, dict[str, str]]


def _api_url(base_url: str) -> str:
    normalized = base_url.strip().rstrip('/')
    return normalized if normalized.endswith('/v1') else f'{normalized}/v1'


def solve(
    url: str,
    cookies: list[dict[str, Any]],
    *,
    return_response: bool = False,
) -> FlareSolverrResult | FlareSolverrResponseResult:
    setting = Setting().crawler
    if not setting.flaresolverr_url:
        raise RuntimeError('FlareSolverr URL is not configured')

    timeout = int(setting.timeout)
    payload = {
        'cmd': 'request.get',
        'url': url,
        'session': FLARESOLVERR_SESSION_ID,
        'cookies': [
            {'name': str(cookie['name']), 'value': str(cookie.get('value', ''))}
            for cookie in cookies
            if cookie.get('name')
        ],
        'maxTimeout': timeout * 1000,
        'returnOnlyCookies': not return_response,
    }

    with _solver_lock:
        response = requests.post(
            _api_url(setting.flaresolverr_url),
            json=payload,
            timeout=timeout + 5,
        )
        response.raise_for_status()
        result = response.json()

    if result.get('status') != 'ok':
        raise RuntimeError(result.get('message') or 'FlareSolverr failed to solve the challenge')

    solution = result.get('solution') or {}
    solved_cookies = solution.get('cookies')
    user_agent = solution.get('userAgent')
    if not isinstance(solved_cookies, list) or not solved_cookies or not user_agent:
        raise RuntimeError('FlareSolverr returned an incomplete solution')

    if return_response:
        html = solution.get('response')
        response_url = solution.get('url') or url
        status_code = solution.get('status', 200)
        headers = solution.get('headers') or {}
        if not isinstance(html, str):
            raise RuntimeError('FlareSolverr returned no response HTML')
        if not isinstance(headers, dict):
            headers = {}
        try:
            status_code = int(status_code)
        except (TypeError, ValueError):
            status_code = 200
        return (
            solved_cookies,
            str(user_agent),
            html,
            str(response_url),
            status_code,
            {str(key): str(value) for key, value in headers.items()},
        )

    return solved_cookies, str(user_agent)
