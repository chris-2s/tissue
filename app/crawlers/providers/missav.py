import re
from datetime import datetime
from typing import TypedDict
from urllib.parse import urljoin

from lxml import etree

from app.crawlers import SpiderException
from app.crawlers.base import Spider
from app.schema import VideoDetail, VideoDownload
from app.utils.media_matcher import detect_flags_with_tag_priority


class MissavLocaleConfig(TypedDict):
    url_prefix: str
    hd_tags: tuple[str, ...]
    zh_tags: tuple[str, ...]
    title_xpath: str
    outline_xpath: str
    runtime_xpath: str
    premiered_xpath: str
    director_xpath: str
    studio_xpath: str
    publisher_xpath: str
    series_xpath: str
    tags_xpath: str
    cover_xpath: str


MISSAV_LOCALES: dict[str, MissavLocaleConfig] = {
    'ja-JP': {
        'url_prefix': '/ja',
        'hd_tags': ('HD', '高画質', '高清'),
        'zh_tags': ('SUB', '中国語字幕', '中文字幕'),
        'title_xpath': "//meta[@property='og:title']/@content",
        'outline_xpath': "//meta[@property='og:description']/@content",
        'runtime_xpath': "//meta[@property='og:video:duration']/@content",
        'premiered_xpath': "//div[span[normalize-space()='配信開始日:']]/time[1]",
        'director_xpath': "//div[span[normalize-space()='監督:']]/a[1]",
        'studio_xpath': "//div[span[normalize-space()='メーカー:']]/a[1]",
        'publisher_xpath': "//div[span[normalize-space()='レーベル:']]/a[1]",
        'series_xpath': "//div[span[normalize-space()='シリーズ:']]/a[1]",
        'tags_xpath': "//div[span[normalize-space()='ジャンル:']]/a",
        'cover_xpath': "//meta[@property='og:image']/@content",
    },
    'zh-CN': {
        'url_prefix': '/cn',
        'hd_tags': ('HD', '高清'),
        'zh_tags': ('SUB', '中文字幕', '中字'),
        'title_xpath': "//meta[@property='og:title']/@content",
        'outline_xpath': "//meta[@property='og:description']/@content",
        'runtime_xpath': "//meta[@property='og:video:duration']/@content",
        'premiered_xpath': "//div[span[normalize-space()='发行日期:']]/time[1]",
        'director_xpath': "//div[span[normalize-space()='导演:']]/a[1]",
        'studio_xpath': "//div[span[normalize-space()='发行商:']]/a[1]",
        'publisher_xpath': "//div[span[normalize-space()='标籤:']]/a[1]",
        'series_xpath': "//div[span[normalize-space()='系列:']]/a[1]",
        'tags_xpath': "//div[span[normalize-space()='类型:']]/a",
        'cover_xpath': "//meta[@property='og:image']/@content",
    },
    'zh-TW': {
        'url_prefix': '',
        'hd_tags': ('HD', '高畫質', '高清'),
        'zh_tags': ('SUB', '中文字幕', '中字'),
        'title_xpath': "//meta[@property='og:title']/@content",
        'outline_xpath': "//meta[@property='og:description']/@content",
        'runtime_xpath': "//meta[@property='og:video:duration']/@content",
        'premiered_xpath': "//div[span[normalize-space()='發行日期:']]/time[1]",
        'director_xpath': "//div[span[normalize-space()='導演:']]/a[1]",
        'studio_xpath': "//div[span[normalize-space()='發行商:']]/a[1]",
        'publisher_xpath': "//div[span[normalize-space()='標籤:']]/a[1]",
        'series_xpath': "//div[span[normalize-space()='系列:']]/a[1]",
        'tags_xpath': "//div[span[normalize-space()='類型:']]/a",
        'cover_xpath': "//meta[@property='og:image']/@content",
    },
    'en-US': {
        'url_prefix': '/en',
        'hd_tags': ('HD', 'High Definition'),
        'zh_tags': ('SUB', 'Chinese Subtitle', 'Chinese Subtitles'),
        'title_xpath': "//meta[@property='og:title']/@content",
        'outline_xpath': "//meta[@property='og:description']/@content",
        'runtime_xpath': "//meta[@property='og:video:duration']/@content",
        'premiered_xpath': "//div[span[normalize-space()='Release date:']]/time[1]",
        'director_xpath': "//div[span[normalize-space()='Director:']]/a[1]",
        'studio_xpath': "//div[span[normalize-space()='Maker:']]/a[1]",
        'publisher_xpath': "//div[span[normalize-space()='Label:']]/a[1]",
        'series_xpath': "//div[span[normalize-space()='Series:']]/a[1]",
        'tags_xpath': "//div[span[normalize-space()='Genre:']]/a",
        'cover_xpath': "//meta[@property='og:image']/@content",
    },
}


class MissavSpider(Spider):
    key = 'missav'
    name = 'MissAV'
    origin_host = "https://missav.ws"
    downloadable = True
    supports_ranking = True
    supports_downloads = True
    supports_previews = True
    supported_languages = ('ja-JP', 'zh-CN', 'zh-TW', 'en-US')

    @property
    def locale_config(self) -> MissavLocaleConfig:
        return MISSAV_LOCALES[self.language]

    def _build_url(self, path: str) -> str:
        return urljoin(self.host, self.locale_config['url_prefix']) + path

    @staticmethod
    def _original_name(name: str) -> str:
        alias = re.search(r'[（(]([^()（）]+)[）)]\s*$', name)
        return alias.group(1).strip() if alias else name

    def get_info(self, num: str, url: str | None = None, include_downloads: bool = False,
                 include_previews: bool = False, include_comments=False):
        url = url or self._build_url(f"/{num}")
        response = self.session.get(url, _use_flaresolverr_response=True)
        if not response.ok:
            raise SpiderException('未找到番号')

        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))

        meta = VideoDetail(source=self.source_ref())
        meta.num = num
        config = self.locale_config

        title = self._first_text(html, config['title_xpath'])
        if title:
            meta.title = title

        outline = self._first_text(html, config['outline_xpath'])
        if outline:
            meta.outline = outline

        runtime = self._first_text(html, config['runtime_xpath'])
        if runtime and runtime.isdigit():
            meta.runtime = str(int(runtime) // 60)

        premiered = self._first_text(html, config['premiered_xpath'])
        if premiered:
            meta.premiered = premiered

        director = self._first_text(html, config['director_xpath'])
        if director:
            meta.director = self._original_name(director)

        studio = self._first_text(html, config['studio_xpath'])
        if studio:
            meta.studio = self._original_name(studio)

        publisher = self._first_text(html, config['publisher_xpath'])
        if publisher:
            meta.publisher = self._original_name(publisher)

        series = self._first_text(html, config['series_xpath'])
        if series:
            meta.series = self._original_name(series)

        tags = []
        for element in html.xpath(config['tags_xpath']):
            text = element.text.strip() if element.text else None
            if text:
                tags.append(self._original_name(text))
        if tags:
            meta.tags = tags

        cover = self._first_text(html, config['cover_xpath'])
        if cover:
            meta.cover = urljoin(self.host, cover)

        meta.website.append(url)

        if include_downloads:
            meta.downloads = self.get_downloads(url, html)

        return meta

    def get_downloads(self, url: str, html) -> list[VideoDownload]:
        downloads = []
        rows = html.xpath("//a[starts-with(@href, 'magnet:')]/ancestor::tr[1]")
        for row in rows:
            magnet_element = self._first_element(row, ".//a[starts-with(@href, 'magnet:')][1]")
            if magnet_element is None:
                continue

            name = magnet_element.text.strip() if magnet_element.text else None
            magnet = magnet_element.get('href')
            if not name or not magnet:
                continue

            tags = []
            for element in row.xpath('./td[1]/span'):
                tag = element.text.strip() if element.text else None
                if tag:
                    tags.append(tag)

            zh_result, uncensored_result = detect_flags_with_tag_priority(
                texts=[('download_name', name)],
                tags=[],
            )
            normalized_tags = {tag.casefold() for tag in tags}
            is_hd = any(tag.casefold() in normalized_tags for tag in self.locale_config['hd_tags'])
            is_zh = (
                    any(tag.casefold() in normalized_tags for tag in self.locale_config['zh_tags'])
                    or zh_result.value
            )

            download = VideoDownload(
                source=self.source_ref(),
                url=url,
                name=name,
                magnet=magnet,
                is_hd=is_hd,
                is_zh=is_zh,
                is_uncensored=uncensored_result.value,
            )

            size = self._first_text(row, './td[2]')
            if size:
                download.size = size.strip()

            publish_date = self._first_text(row, './td[3]')
            if publish_date:
                try:
                    download.publish_date = datetime.strptime(publish_date.strip(), '%Y-%m-%d').date()
                except ValueError:
                    pass

            downloads.append(download)

        return downloads
