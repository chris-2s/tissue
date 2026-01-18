import os.path
import random
import re
from datetime import datetime

from lxml import etree
from urllib.parse import urljoin

from app.exception import BizException
from app.schema import VideoDetail, VideoActor, VideoDownload, VideoPreviewItem, VideoPreview, VideoSiteActor
from app.schema.home import SiteVideo
from app.schema.r import Page
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


class JavBusSpider(Spider):
    name = 'JavBus'
    origin_host = "https://www.javbus.com/"
    downloadable = True

    def get_info(self, num: str, url: str = None, include_downloads=False, include_previews=False,
                 include_comments=False):

        url = url if url else urljoin(self.host, num)
        response = self.session.get(url, allow_redirects=False)

        html = etree.HTML(response.text)

        meta = VideoDetail()
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
            meta.site_actors = [VideoSiteActor(website=self.name, items=actors)]

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

        return [VideoPreview(website=self.name, items=result)]

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

            download = VideoDownload()
            download.website = self.name
            download.url = url
            download.name = parts[0].text.strip()
            download.magnet = parts[0].get('href')

            title = parts[0].text.strip()
            if '无码' in title or '破解' in title or 'uncensored' in title:
                download.is_uncensored = True

            for tag in parts[1:]:
                if tag.text == '高清':
                    download.is_hd = True
                if tag.text == '字幕':
                    download.is_zh = True

            size_element = item.xpath("./td[2]/a")[0]
            download.size = size_element.text.strip()

            publish_date_element = item.xpath("./td[3]/a")[0]
            download.publish_date = datetime.strptime(publish_date_element.text.strip(), "%Y-%m-%d").date()

            result.append(download)
        return result

    def get_actor(self, code: str, page: int):
        url = urljoin(self.host, f'/star/{code}/{page}')
        response = self.session.get(url, allow_redirects=False, headers={'Cookie': 'existmag=all'})
        html = etree.HTML(response.text)

        total_elements = html.xpath("//a[@id='resultshowall']/text()")
        if not total_elements:
            raise BizException("未找到该演员")

        pages = Page()
        pages.page = page
        pages.limit = 30

        for element in total_elements:
            element = element.replace(r'\xa0', '').replace(' ', '')
            '全部影片48'
            total_matched = re.search('全部影片(\d+)', element)
            if total_matched:
                pages.total = int(total_matched.group(1))

        result = []
        videos = html.xpath(r"//div[@id='waterfall']//a[@class='movie-box']")

        for video in videos:
            site_video = SiteVideo()

            conver_element = video.xpath('./div[@class="photo-frame"]/img')[0]
            cover = conver_element.get('src')
            cover_code = cover.split("/")[-1].split(".")
            site_video.cover = urljoin(self.host, f'/pics/cover/{cover_code[0]}_b.{cover_code[1]}')
            site_video.title = conver_element.get('title')

            info_element = video.xpath('./div[@class="photo-info"]/span')[0]
            site_video.num = info_element.xpath('./date')[0].text
            site_video.publish_date = datetime.strptime(info_element.xpath('./date')[1].text,
                                                        "%Y-%m-%d").date()

            tag_str = info_element.xpath('./div[@class="item-tag"]/button/text()')
            if tag_str:
                site_video.isZh = "字幕" in tag_str

            site_video.url = video.get('href')

            result.append(site_video)
        pages.data = result

        return pages
