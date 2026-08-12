import pytest

from app.exception import BizException
from app.integrations.llms.providers.gemini import GeminiLlmProvider
from app.integrations.llms.providers.openai_compatible import OpenAICompatibleLlmProvider
from app.integrations.llms.providers.openai_responses import OpenAIResponsesLlmProvider
from app.integrations.llms.types import LlmRequest, LlmTool


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self.payload


def test_chat_completions_rejects_required_web_search():
    provider = OpenAICompatibleLlmProvider({})
    with pytest.raises(BizException):
        provider._request_json(LlmRequest('prompt', {}, frozenset({LlmTool.WEB_SEARCH})))


def test_openai_responses_sends_and_verifies_web_search(monkeypatch):
    captured = {}

    def fake_post(url, **kwargs):
        captured['url'] = url
        captured.update(kwargs)
        return FakeResponse({
            'output': [
                {'type': 'web_search_call'},
                {'type': 'message', 'content': [{'type': 'output_text', 'text': '{"items": []}'}]},
            ],
        })

    monkeypatch.setattr('app.integrations.llms.providers.openai_responses.requests.post', fake_post)
    provider = OpenAIResponsesLlmProvider({
        'base_url': 'https://api.openai.com/v1', 'api_key': 'secret', 'model': 'model-id',
    })
    text = provider._request_text(LlmRequest('prompt', {'actors': []}, frozenset({LlmTool.WEB_SEARCH})))

    assert text == '{"items": []}'
    assert captured['url'] == 'https://api.openai.com/v1/responses'
    assert captured['json']['tools'] == [{'type': 'web_search'}]
    assert captured['json']['tool_choice'] == 'required'
    assert captured['json']['store'] is False


def test_openai_responses_rejects_missing_search_call(monkeypatch):
    monkeypatch.setattr(
        'app.integrations.llms.providers.openai_responses.requests.post',
        lambda *args, **kwargs: FakeResponse({'output_text': '{}', 'output': []}),
    )
    provider = OpenAIResponsesLlmProvider({
        'base_url': 'https://api.openai.com/v1', 'api_key': 'secret', 'model': 'model-id',
    })
    with pytest.raises(BizException):
        provider._request_text(LlmRequest('prompt', {}, frozenset({LlmTool.WEB_SEARCH})))


def test_gemini_interactions_sends_and_verifies_google_search(monkeypatch):
    captured = {}

    def fake_post(url, **kwargs):
        captured['url'] = url
        captured.update(kwargs)
        return FakeResponse({
            'steps': [
                {'type': 'google_search_call'},
                {'type': 'model_output', 'content': [{'type': 'text', 'text': '{"items": []}'}]},
            ],
        })

    monkeypatch.setattr('app.integrations.llms.providers.gemini.requests.post', fake_post)
    provider = GeminiLlmProvider({
        'base_url': 'https://generativelanguage.googleapis.com/v1beta/interactions',
        'api_key': 'secret',
        'model': 'gemini-model',
    })
    text = provider._request_text(LlmRequest('prompt', {'actors': []}, frozenset({LlmTool.WEB_SEARCH})))

    assert text == '{"items": []}'
    assert captured['url'] == 'https://generativelanguage.googleapis.com/v1beta/interactions'
    assert captured['headers']['x-goog-api-key'] == 'secret'
    assert captured['json']['tools'] == [{'type': 'google_search'}]


def test_regular_requests_do_not_enable_search(monkeypatch):
    captured = {}

    def fake_post(url, **kwargs):
        captured.update(kwargs)
        return FakeResponse({'output_text': '{}', 'output': []})

    monkeypatch.setattr('app.integrations.llms.providers.openai_responses.requests.post', fake_post)
    provider = OpenAIResponsesLlmProvider({
        'base_url': 'https://api.openai.com/v1', 'api_key': 'secret', 'model': 'model-id',
    })
    assert provider._request_text(LlmRequest('prompt', {})) == '{}'
    assert 'tools' not in captured['json']
    assert 'tool_choice' not in captured['json']
