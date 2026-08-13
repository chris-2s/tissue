from lxml import etree

from app.crawlers.base import Spider


def test_first_element_returns_first_xpath_result_or_none():
    html = etree.HTML('<div><span>first</span><span>second</span></div>')

    assert Spider._first_element(html, '//span').text == 'first'
    assert Spider._first_element(html, '//missing') is None


def test_first_text_returns_element_text_without_transforming_it():
    html = etree.HTML('<div><span> label </span></div>')

    assert Spider._first_text(html, '//span') == ' label '
    assert Spider._first_text(html, '//missing') is None


def test_first_text_supports_xpath_string_results():
    html = etree.HTML('<meta property="og:title" content="Example title">')

    assert Spider._first_text(html, '//meta/@content') == 'Example title'
