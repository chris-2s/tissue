import os.path
import random
import re
from datetime import datetime

from lxml import etree
from urllib.parse import urljoin

from app.exception import BizException
from app.schema import VideoDetail, VideoActor, VideoDownload, VideoPreviewItem, VideoPreview, VideoSiteActor
from app.schema.actor import Actor, ActorPage
from app.schema.home import SiteVideo
from app.schema.r import Page
from app.utils.media_matcher import detect_flags_with_tag_priority
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


class JavBusSpider(Spider):
    key = 'javbus'
    name = 'JavBus'
    origin_host = "https://www.javbus.com/"
    downloadable = True
    supports_actor = True
    supports_downloads = True
    supports_previews = True

    def get_info(self, num: str, url: str = None, include_downloads=False, include_previews=False,
                 include_comments=False):

        url = url if url else urljoin(self.host, num)
        response = self.session.get(url, allow_redirects=False)

        html = etree.HTML(response.text)

        meta = VideoDetail(source=self.source_ref())
        meta.num = num

        title_element = html.xpath("//h3")
        if title_element:
            title = title_element[0].text
            meta.title = title
        else:
            raise SpiderException('未找到番号')

        premiered_element = html.xpath("//span[text()='發行日期:']")
        if premiered_element:
            meta.premiered = premiered_element[0].tail.strip()

        runtime_element = html.xpath("//span[text()='長度:']")
        if runtime_element:
            runtime = runtime_element[0].tail.strip()
            runtime = runtime.replace("分鐘", "")
            meta.runtime = runtime

        director_element = html.xpath("//span[text()='導演:']/../a")
        if director_element:
            director = director_element[0].text
            meta.director = director

        studio_element = html.xpath("//span[text()='製作商:']/../a")
        if studio_element:
            studio = studio_element[0].text
            meta.studio = studio

        publisher_element = html.xpath("//span[text()='發行商:']/../a")
        if publisher_element:
            publisher = publisher_element[0].text
            meta.publisher = publisher

        series_element = html.xpath("//span[text()='系列:']/../a")
        if series_element:
            series = series_element[0].text
            meta.series = series

        tag_elements = html.xpath("//span[@class='genre']//a[contains(@href,'genre')]")
        if tag_elements:
            tags = [tag.text for tag in tag_elements]
            meta.tags = tags

        actor_elements = html.xpath("//span[@class='genre']//a[contains(@href,'star')]")
        if actor_elements:
            actors = []
            for element in actor_elements:
                actor_url = element.get('href')
                actor_code = actor_url.split("/")[-1]
                actor_avatar = urljoin(self.host, f'/pics/actress/{actor_code}_a.jpg')
                actor = VideoActor(name=element.text, thumb=actor_avatar, code=actor_code)
                actors.append(actor)
            meta.actors = actors
            meta.site_actors = [VideoSiteActor(source=self.source_ref(), items=actors)]

        cover_element = html.xpath("//a[@class='bigImage']")
        if cover_element:
            cover = cover_element[0].get("href")
            meta.cover = urljoin(self.host, cover)

        meta.website.append(url)

        if include_downloads:
            meta.downloads = self.get_downloads(url, response.text)

        if include_downloads:
            meta.previews = self.get_previews(html)

        return meta

    def get_previews(self, html: etree.HTML):
        result = []

        images = html.xpath("//a[@class='sample-box']")
        for image in images:
            thumb = image.xpath("./div/img")[0]
            preview = VideoPreviewItem(type='image', thumb=urljoin(self.host, thumb.get('src')), url=image.get('href'))
            result.append(preview)

        return [VideoPreview(source=self.source_ref(), items=result)]

    def get_downloads(self, url: str, response: str):
        params = {'lang': 'zh', 'floor': random.Random().randint(100, 1000)}

        gid = re.search(r'var gid = (\w+);', response)
        params['gid'] = gid.group(1)

        uc = re.search(r'var uc = (\w+);', response)
        params['uc'] = uc.group(1)

        img = re.search(r'var img = \'(.+)\';', response)
        params['img'] = img.group(1)

        response = self.session.get(urljoin(self.host, '/ajax/uncledatoolsbyajax.php'), params=params,
                                    allow_redirects=True, headers={'Referer': self.host})
        html = etree.HTML(f'<table>{response.text}</table>', parser=etree.HTMLParser(encoding='utf-8'))

        result = []
        table = html.xpath("//tr")
        for item in table:
            parts = item.xpath("./td[1]/a")
            if not parts:
                continue

            download = VideoDownload(source=self.source_ref())
            download.url = url
            download.name = parts[0].text.strip()
            download.magnet = parts[0].get('href')

            tags = []
            for tag in parts[1:]:
                if tag.text == '高清':
                    download.is_hd = True
                if tag.text:
                    tags.append(tag.text)

            zh_result, uncensored_result = detect_flags_with_tag_priority(
                texts=[('download_name', download.name)],
                tags=tags,
            )
            download.is_zh = zh_result.value
            download.is_uncensored = uncensored_result.value

            size_element = item.xpath("./td[2]/a")[0]
            download.size = size_element.text.strip()

            publish_date_element = item.xpath("./td[3]/a")[0]
            download.publish_date = datetime.strptime(publish_date_element.text.strip(), "%Y-%m-%d").date()

            result.append(download)
        return result

    def _parse_movie_total(self, html: etree.HTML):
        total_elements = html.xpath("//a[@id='resultshowall']/text()")
        if not total_elements:
            return None

        for element in total_elements:
            element = element.replace(r'\xa0', '').replace(' ', '')
            total_matched = re.search(r'全部影片(\d+)', element)
            if total_matched:
                return int(total_matched.group(1))
        return None

    def _parse_movie_boxes(self, html: etree.HTML):
        result = []
        videos = html.xpath(r"//div[@id='waterfall']//a[@class='movie-box']")

        for video in videos:
            site_video = SiteVideo()

            conver_element = video.xpath('./div[@class="photo-frame"]/img')[0]
            cover = conver_element.get('src')
            cover_code = cover.split("/")[-1].split(".")
            cover_prefix = cover.split("/")[1]
            site_video.cover = urljoin(self.host, f'/{cover_prefix}/cover/{cover_code[0]}_b.{cover_code[1]}')
            site_video.title = conver_element.get('title')

            info_element = video.xpath('./div[@class="photo-info"]/span')[0]
            site_video.num = info_element.xpath('./date')[0].text
            site_video.publish_date = datetime.strptime(info_element.xpath('./date')[1].text, "%Y-%m-%d").date()

            tag_str = info_element.xpath('./div[@class="item-tag"]/button/text()')
            zh_result, _ = detect_flags_with_tag_priority(
                texts=[('title', site_video.title), ('num', site_video.num)],
                tags=tag_str,
            )
            site_video.isZh = zh_result.value

            site_video.url = video.get('href')
            site_video.source = self.source_ref()
            result.append(site_video)

        return result

    def get_actor_page(self, code: str, page: int):
        url = urljoin(self.host, f'/star/{code}/{page}')
        response = self.session.get(url, allow_redirects=False, headers={'Cookie': 'existmag=all'})
        html = etree.HTML(response.text)

        total = self._parse_movie_total(html)
        if total is None:
            raise BizException("未找到该演员")

        pages = Page()
        pages.page = page
        pages.limit = 30
        pages.total = total
        pages.data = self._parse_movie_boxes(html)

        actor = Actor(code=code, source=self.source_ref())
        actor_name = html.xpath('//title/text()')
        if actor_name:
            actor.name = actor_name[0].split(' - ')[0].strip()

        if actor.name:
            actors = self._search_actor_results(actor.name)
            actor = next((item for item in actors if item.code == code), actor)

        if not actor.thumb:
            fallback_actors = self._parse_actor_elements(html.xpath('//a[contains(@class,"avatar-box")]'))
            fallback_actor = next((item for item in fallback_actors if item.code == code), None)
            if fallback_actor:
                actor = fallback_actor

        return ActorPage(actor=actor, page=pages)

    def search_actor(self, name: str):
        return self._search_actor_results(name)

    def _search_actor_results(self, name: str):
        url = urljoin(self.host, f'/searchstar/{name}')
        response = self.session.get(url, allow_redirects=False)
        html = etree.HTML(response.text)
        return self._parse_actor_elements(html.xpath('//a[contains(@class,"avatar-box")]'))

    def _parse_actor_elements(self, actors_element):
        actors = []
        for actor_element in actors_element:
            avatar_element = actor_element.xpath('./div/img')[0]
            actor_name = avatar_element.get('title')
            actor_src = avatar_element.get('src')
            actor_avatar = urljoin(self.host, actor_src)
            actor_code = actor_element.get('href').split('/')[-1]
            actor = Actor(source=self.source_ref())
            actor.code = actor_code
            actor.name = actor_name
            if actor_src and not 'nowprinting' in actor_src:
                actor.thumb = actor_avatar
            actors.append(actor)
        return actors

    def search_video(self, num: str):
        result = self.search_with_type('/search/', num)
        result.extend(self.search_with_type('/uncensored/search/', num))
        return result

    def search_with_type(self, path: str, num: str):
        url = urljoin(self.host, f'{path}{num}')
        response = self.session.get(url, allow_redirects=False, headers={'Cookie': 'existmag=all'})
        html = etree.HTML(response.text)
        return self._parse_movie_boxes(html)
