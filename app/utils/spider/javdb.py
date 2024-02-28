import re
from urllib.parse import urljoin
from lxml import etree

import requests

from app.schema import VideoDetail, VideoActor, SubscribeScrape
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


class JavdbSpider(Spider):
    host = "https://javdb.com"
    name = 'Javdb'
    avatar_host = 'https://c0.jdbstatic.com/avatars/'

    def get_info(self, num: str):

        url = self.search(num)
        if not url:
            raise SpiderException('未找到番号')

        meta = VideoDetail()
        meta.num = num

        response = self.session.get(url)
        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))

        title_element = html.xpath("//strong[@class='current-title']")
        if title_element:
            title = title_element[0].text.strip()
            meta.title = f'{num.upper()} {title}'

        premiered_element = html.xpath("//strong[text()='日期:']/../span")
        if premiered_element:
            meta.premiered = premiered_element[0].text

        runtime_element = html.xpath("//strong[text()='時長:']/../span")
        if runtime_element:
            runtime = runtime_element[0].text
            runtime = runtime.replace(" 分鍾", "")
            meta.runtime = runtime

        director_element = html.xpath("//strong[text()='導演:']/../span/a")
        if director_element:
            director = director_element[0].text
            meta.director = director

        studio_element = html.xpath("//strong[text()='片商:']/../span/a")
        if studio_element:
            studio = studio_element[0].text
            meta.studio = studio

        publisher_element = html.xpath("//strong[text()='發行:']/../span/a")
        if publisher_element:
            publisher = publisher_element[0].text
            meta.publisher = publisher

        series_element = html.xpath("//strong[text()='系列:']/../span/a")
        if series_element:
            series = series_element[0].text
            meta.series = series

        tag_elements = html.xpath("//a[contains(@href,'/tags?')]")
        if tag_elements:
            tags = [tag.text for tag in tag_elements]
            meta.tags = tags

        actor_elements = html.xpath("//strong[@class='symbol female']")
        if actor_elements:
            actors = []
            for element in actor_elements:
                actor_element = element.xpath('./preceding-sibling::a[1]')[0]
                actor_url = actor_element.get('href')
                actor_code = actor_url.split("/")[-1]
                actor_avatar = urljoin(self.avatar_host, f'{actor_code[0:2].lower()}/{actor_code}.jpg')
                actor = VideoActor(name=actor_element.text, thumb=actor_avatar)
                actors.append(actor)
            meta.actors = actors

        cover_element = html.xpath("//img[@class='video-cover']")
        if cover_element:
            meta.cover = cover_element[0].get("src")

        score_elements = html.xpath("//span[@class='score-stars']/../text()")
        if score_elements:
            score_text = str(score_elements[0])
            pattern_result = re.search(r"(\d+\.\d+)分", score_text)
            score = pattern_result.group(1)
            meta.rating = score

        meta.website.append(url)

        return meta

    def search(self, num: str):
        url = urljoin(self.host, f"/search?q={num}&f=all")
        response = self.session.get(url)

        html = etree.HTML(response.content)
        matched_elements = html.xpath(fr"//div[@class='video-title']/strong")
        for matched_element in matched_elements:
            if matched_element.text.lower() == num.lower():
                code = matched_element.xpath('./../..')[0].get('href')
                return urljoin(self.host, code)

    def get_video(self, url: str):
        response = self.session.get(url)
        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))

        result = []
        table = html.xpath("//div[@id='magnets-content']/div")
        for item in table:
            video = SubscribeScrape()

            parts = item.xpath("./div[1]/a")[0]
            video.website = self.name
            video.url = url
            video.name = parts[0].text.strip()
            video.magnet = parts.get('href')

            name = parts.xpath("./span[1]")
            if name:
                if '无码' in name[0].text or '破解' in name[0].text:
                    video.is_uncensored = True

            size = parts.xpath("./span[2]")
            if size:
                video.size = size[0].text.split(',')[0].strip()

            for tag in parts.xpath('./div[@class="tags"]/span'):
                if tag.text == '高清':
                    video.is_hd = True
                if tag.text == '字幕':
                    video.is_zh = True

            publish_date = item.xpath("./div[2]/span")
            if publish_date:
                video.publish_date = publish_date[0].text.strip()

            result.append(video)
        return result
