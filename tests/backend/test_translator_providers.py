from types import SimpleNamespace

import pytest

from app.exception import BizException
from app.integrations.translators.providers import deepl as deepl_module
from app.integrations.translators.providers import deeplx as deeplx_module
from app.integrations.translators.providers.deepl import DeeplTranslatorProvider
from app.integrations.translators.providers.deeplx import DeepLXTranslatorProvider


class FakeResponse:
    def __init__(self, payload: dict):
        self.payload = payload

    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict:
        return self.payload


def test_deepl_sends_texts_as_one_json_request(monkeypatch):
    calls: list[tuple[str, dict]] = []

    def fake_post(url, **kwargs):
        calls.append((url, kwargs))
        return FakeResponse({
            'translations': [
                {'detected_source_language': 'JA', 'text': '标题'},
                {'detected_source_language': 'JA', 'text': '简介'},
            ]
        })

    monkeypatch.setattr(deepl_module.requests, 'post', fake_post)
    monkeypatch.setattr(deepl_module, 'Setting', lambda: SimpleNamespace(crawler=SimpleNamespace(timeout=12)))

    provider = DeeplTranslatorProvider({
        'base_url': 'https://api-free.deepl.com/',
        'api_key': 'secret',
    })

    assert provider.translate_texts(['タイトル', '紹介'], 'zh-CN') == ['标题', '简介']
    assert calls == [(
        'https://api-free.deepl.com/v2/translate',
        {
            'headers': {
                'Authorization': 'DeepL-Auth-Key secret',
                'Content-Type': 'application/json',
            },
            'json': {
                'source_lang': 'JA',
                'target_lang': 'ZH',
                'text': ['タイトル', '紹介'],
            },
            'timeout': 12,
        },
    )]


def test_deepl_rejects_mismatched_translation_count(monkeypatch):
    monkeypatch.setattr(
        deepl_module.requests,
        'post',
        lambda *args, **kwargs: FakeResponse({'translations': [{'text': '标题'}]}),
    )

    provider = DeeplTranslatorProvider({'api_key': 'secret'})

    with pytest.raises(BizException):
        provider.translate_texts(['タイトル', '紹介'], 'zh-CN')


def test_deeplx_translates_each_text_with_the_configured_full_url(monkeypatch):
    calls: list[tuple[str, dict]] = []
    responses = iter([
        FakeResponse({'code': 200, 'data': '标题'}),
        FakeResponse({'code': 200, 'data': '简介'}),
    ])

    def fake_post(url, **kwargs):
        calls.append((url, kwargs))
        return next(responses)

    monkeypatch.setattr(deeplx_module.requests, 'post', fake_post)
    monkeypatch.setattr(deeplx_module, 'Setting', lambda: SimpleNamespace(crawler=SimpleNamespace(timeout=15)))

    provider = DeepLXTranslatorProvider({'url': 'https://example.com/deepl'})

    assert provider.translate_texts(['タイトル', '紹介'], 'zh-TW') == ['标题', '简介']
    assert calls == [
        (
            'https://example.com/deepl',
            {
                'json': {
                    'text': 'タイトル',
                    'source_lang': 'JA',
                    'target_lang': 'ZH-HANT',
                },
                'timeout': 15,
            },
        ),
        (
            'https://example.com/deepl',
            {
                'json': {
                    'text': '紹介',
                    'source_lang': 'JA',
                    'target_lang': 'ZH-HANT',
                },
                'timeout': 15,
            },
        ),
    ]


@pytest.mark.parametrize('provider', [
    DeeplTranslatorProvider({'api_key': 'secret'}),
    DeepLXTranslatorProvider({'url': 'https://example.com/translate'}),
])
def test_translator_providers_skip_requests_for_empty_input(provider):
    assert provider.translate_texts([], 'zh-CN') == []


def test_deeplx_rejects_invalid_response(monkeypatch):
    monkeypatch.setattr(
        deeplx_module.requests,
        'post',
        lambda *args, **kwargs: FakeResponse({'code': 200}),
    )

    provider = DeepLXTranslatorProvider({'url': 'https://example.com/translate'})

    with pytest.raises(BizException):
        provider.translate_texts(['タイトル'], 'zh-CN')
