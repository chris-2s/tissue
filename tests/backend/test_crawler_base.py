import gc
import weakref
from types import SimpleNamespace

from lxml import etree

from app.crawlers.base import Spider
from app.crawlers.providers.javdb import JavDBSpider
from app.schema.video import VideoDetail


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


def test_metadata_text_does_not_keep_the_source_html_node_alive():
    class TrackableElement(etree.ElementBase):
        pass

    parser = etree.HTMLParser()
    parser.set_element_class_lookup(etree.ElementDefaultClassLookup(element=TrackableElement))
    html = etree.HTML('<meta property="og:description" content="Example description">', parser)
    node = html.xpath('//meta')[0]
    node_ref = weakref.ref(node)
    video = VideoDetail()
    # Crawlers assign fields after constructing the model, without assignment validation.
    video.outline = Spider._first_text(html, '//meta/@content')

    del node, html
    gc.collect()

    assert video.outline == 'Example description'
    assert node_ref() is None


def test_actor_search_does_not_keep_the_avatar_html_node_alive(monkeypatch):
    class TrackableElement(etree.ElementBase):
        pass

    parser = etree.HTMLParser()
    parser.set_element_class_lookup(etree.ElementDefaultClassLookup(element=TrackableElement))
    parse_html = etree.HTML
    node_refs = []
    tracked_nodes = []

    def track_html(content, **kwargs):
        html = parse_html(content, parser)
        node = html.xpath('//img')[0]
        tracked_nodes.append(node)
        node_refs.append(weakref.ref(node))
        return html

    monkeypatch.setattr(etree, 'HTML', track_html)
    spider = JavDBSpider.__new__(JavDBSpider)
    spider.host = 'https://javdb.example'
    spider.site_id = 1
    spider.session = SimpleNamespace(get=lambda url: SimpleNamespace(content=(
        b'<div id="actors"><div><a title="Example Actor" href="/actors/actor-code">'
        b'<img src="https://images.example/avatar.jpg"></a></div></div>'
    )))

    actors = spider.search_actor('Example Actor')
    tracked_nodes.clear()
    gc.collect()

    assert actors[0].thumb == 'https://images.example/avatar.jpg'
    assert node_refs[0]() is None
