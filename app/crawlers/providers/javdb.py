import base64
import re
import time
from datetime import datetime
from random import randint
from typing import Any
from urllib.parse import urljoin

from lxml import etree

from app.exception import BizException
from app.schema import VideoDetail, VideoActor, VideoDownload, VideoPreviewItem, VideoPreview, VideoCommentItem, \
    VideoComment, VideoSiteActor
from app.schema.actor import Actor, ActorPage
from app.schema.home import SiteVideo
from app.schema.r import Page
from app.utils.cookies import (
    apply_cookie_header_to_jar,
    cookiejar_to_cookies,
    cookies_to_cookiecloud_items,
    to_cookie_header,
)
from app.utils.media_matcher import detect_flags_with_tag_priority
from app.crawlers.base import Session, Spider
from app.crawlers.exceptions import SpiderException


class JavDBSpider(Spider):
    key = 'javdb'
    name = 'JavDB'
    origin_host = "https://javdb.com"
    downloadable = True
    supports_ranking = True
    supports_actor = True
    supports_login = True
    supports_downloads = True
    supports_previews = True
    supports_comments = True
    avatar_host = 'https://c0.jdbstatic.com/avatars/'
    cookie_check_path = '/rankings/movies?p=daily&t=uncensored'

    def check_cookie_validity(self, cookie_header: str | None) -> bool:
        if not cookie_header:
            return True

        response = None
        try:
            self.session.cookies.clear()
            apply_cookie_header_to_jar(cookie_header, self.session.cookies)
            response = self.session.get(urljoin(self.host, self.cookie_check_path), allow_redirects=True)
            return '/login' not in str(response.url)
        except Exception:
            return True
        finally:
            if response is not None:
                response.close()
            self.session.cookies.clear()

    def get_login_page(self) -> dict[str, Any]:
        """获取登录页信息"""
        session = self.session
        login_url = urljoin(self.host, "/login")

        response = session.get(login_url)
        html = etree.HTML(response.content)

        token = html.xpath("//form[@action='/user_sessions']/input[@name='authenticity_token']/@value")
        authenticity_token = token[0] if token else ""

        captcha_img = html.xpath("//img[@class='rucaptcha-image']/@src")
        captcha_base64 = ""
        if captcha_img:
            img_response = session.get(urljoin(self.host, captcha_img[0]))
            if img_response.ok:
                captcha_base64 = base64.b64encode(img_response.content).decode()

        cookie_str = to_cookie_header(cookiejar_to_cookies(session.cookies))

        return {
            "cookies": cookie_str,
            "authenticity_token": authenticity_token,
            "captcha": captcha_base64
        }

    def submit_login(self, cookies: str, authenticity_token: str,
                     username: str, password: str, captcha: str) -> list[dict]:
        """提交登录，返回详细 cookie 数组"""
        session = Session()
        session.headers = self.session.headers.copy()

        apply_cookie_header_to_jar(cookies, session.cookies)

        login_url = urljoin(self.host, "/user_sessions")

        data = {
            "authenticity_token": authenticity_token,
            "email": username,
            "password": password,
            "_rucaptcha": captcha,
            "remember": "1",
            "commit": "登入"
        }

        response = session.post(login_url, data=data, allow_redirects=False)

        if response.status_code == 302 and '/login' not in response.headers["Location"]:
            return cookies_to_cookiecloud_items(cookiejar_to_cookies(session.cookies))

        raise BizException("登录失败，请检查账号密码和验证码")

    def get_info(self, num: str, url: str | None = None, include_downloads=False, include_previews=False,
                 include_comments=False):

        searched = False

        if url is None:
            candidates = self.search_video(num)
            matched = next((item for item in candidates if (item.num or '').lower() == num.lower()), None)
            selected = matched or (candidates[0] if candidates else None)
            url = selected.url if selected else None
            searched = True

        if not url:
            raise SpiderException('未找到番号')
        else:
            if searched:
                time.sleep(randint(1, 3))

        meta = VideoDetail(source=self.source_ref())
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
                actor = VideoActor(name=actor_element.text, code=actor_code)
                actor_avatar = urljoin(self.avatar_host, f'{actor_code[0:2].lower()}/{actor_code}.jpg')
                if self._validate_actor_avatar(actor_avatar, head_validate=True):
                    actor.thumb = actor_avatar
                actors.append(actor)
            meta.actors = actors
            meta.site_actors = [VideoSiteActor(source=self.source_ref(), items=actors)]

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

        if include_downloads:
            meta.downloads = self.get_downloads(url, html)

        if include_previews:
            meta.previews = self.get_previews(html)

        if include_comments:
            meta.comments = self.get_comments(url)

        return meta

    def search_video(self, num: str):
        url = urljoin(self.host, f"/search?q={num}&f=all")
        response = self.session.get(url)

        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))
        return self._get_video(html)

    def get_previews(self, html: etree.HTML):
        result = []

        videos = html.xpath("//div[contains(@class,'preview-images')]/a[@class='preview-video-container']")
        for video in videos:
            thumb = video.xpath('./img')[0]
            video = html.xpath(f"//video[@id='{video.get('href')[1:]}']/source")
            if video:
                preview = VideoPreviewItem(type='video', thumb=thumb.get('src'), url=video[0].get('src'))
                result.append(preview)

        images = html.xpath("//div[contains(@class,'preview-images')]/a[@class='tile-item']")
        for image in images:
            thumb = image.xpath('./img')[0]
            preview = VideoPreviewItem(type='image', thumb=thumb.get('src'), url=image.get('href'))
            result.append(preview)

        return [VideoPreview(source=self.source_ref(), items=result)]

    def get_comments(self, url: str):
        result = []

        code = url.split('/')[-1]
        response = self.session.get(f'{self.host}/v/{code}/reviews/lastest')
        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))

        items = html.xpath("//dt[@class='review-item']")
        for item in items:
            comment = VideoCommentItem(id=item.get('id'))

            comment.name = ''.join(
                [node.replace(r'\xa0', '').strip() for node in item.xpath('./div[@class="review-title"]/text()')])
            comment.score = len(item.xpath('.//i[@class="icon-star"]'))

            publish_date = item.xpath(".//span[@class='time']")
            if publish_date:
                comment.publish_date = datetime.strptime(publish_date[0].text.strip(), "%Y-%m-%d").date()

            comment.likes = int(item.xpath('.//span[@class="likes-count"]')[0].text)

            content_list = []
            contents = item.xpath('./div[@class="content"]/p')
            for content in contents:
                content_list.append(''.join([text for text in content.itertext()]))
            comment.content = '\n\n'.join(content_list)

            result.append(comment)

        return [VideoComment(source=self.source_ref(), items=result)]

    def get_downloads(self, url: str, html: etree.HTML):
        result = []
        table = html.xpath("//div[@id='magnets-content']/div")
        for item in table:
            download = VideoDownload(source=self.source_ref())

            parts = item.xpath("./div[1]/a")[0]
            download.url = url
            download.name = parts[0].text.strip()
            download.magnet = parts.get('href')

            size = parts.xpath("./span[2]")
            if size:
                download.size = size[0].text.split(',')[0].strip()

            tags = []
            for tag in parts.xpath('./div[@class="tags"]/span'):
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

            publish_date = item.xpath(".//span[@class='time']")
            if publish_date:
                download.publish_date = datetime.strptime(publish_date[0].text.strip(), "%Y-%m-%d").date()

            result.append(download)
        return result

    def _get_video(self, html: etree.HTML):
        result = []

        videos = html.xpath('//div[contains(@class, "movie-list")]/div[@class="item"]/a')
        for video in videos:
            ranking = SiteVideo()
            ranking.cover = video.xpath('./div[contains(@class, "cover")]/img')[0].get('src')
            ranking.title = video.get('title')
            ranking.num = video.xpath('./div[@class="video-title"]/strong')[0].text

            publish_date_str = video.xpath('./div[@class="meta"]')[0].text.strip()
            if publish_date_str and publish_date_str != 'N/A':
                ranking.publish_date = datetime.strptime(publish_date_str, "%Y-%m-%d").date()

            rank_str = video.xpath('./div[@class="score"]/span/text()')[0].strip()
            rank_matched = re.match('(.+?)分, 由(.+?)人評價', rank_str)
            ranking.rank = float(rank_matched.group(1))
            ranking.rank_count = int(rank_matched.group(2))

            ranking.url = urljoin(self.host, video.get('href'))

            tag_str = video.xpath('./div[contains(@class, "tags")]/span/text()')
            if tag_str:
                ranking.isZh = ('中字' in tag_str[0])

            ranking.source = self.source_ref()
            result.append(ranking)
        return result

    def get_ranking(self, video_type: str, cycle: str):
        url = urljoin(self.host, f'/rankings/movies?p={cycle}&t={video_type}')
        response = self.session.get(url)
        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))

        return self._get_video(html)

    def get_actor_page(self, code: str, page: int):
        url = urljoin(self.host, f'/actors/{code}')
        response = self.session.get(url, params={'page': page})
        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))

        section_element = html.xpath('//div[contains(@class, "section-columns")]')
        if not section_element:
            raise BizException("未找到该演员")

        pages = Page()
        pages.page = page
        pages.limit = 40

        actor = Actor(code=code, source=self.source_ref())

        section = section_element[0]

        name_elements = section.xpath('.//span[@class="actor-section-name"]')[0]
        alias = name_elements.text.split(', ')

        meta_elements = section.xpath('.//span[@class="section-meta"]')
        for element in meta_elements:
            total_matched = re.match(r'(\d+) 部影片', element.text)
            if total_matched:
                pages.total = int(total_matched.group(1))
            if ', ' in element.text:
                alias.extend(element.text.split(', '))

        actor.name = alias[0]
        actor.alias = alias[1:]

        avatar_element = section.xpath('.//div[contains(@class, "actor-avatar")]/div/span')
        if avatar_element:
            avatar_matched = re.match(r'background-image: url\((.+?)\)', avatar_element[0].get('style'))
            if avatar_matched:
                actor.thumb = avatar_matched.group(1)

        pages.data = self._get_video(html)

        return ActorPage(actor=actor, page=pages)

    def search_actor(self, name: str):
        url = urljoin(self.host, f'/search?q={name}&f=actor')
        response = self.session.get(url)
        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))
        actors_element = html.xpath('//div[@id="actors"]/div/a')

        actors = []
        for actor_element in actors_element:
            actor_names = [name.strip() for name in actor_element.get('title').split(',')]
            actor_avatar = actor_element.xpath('.//img/@src')[0]
            actor_code = actor_element.get('href').split('/')[-1]
            actor = Actor(source=self.source_ref())
            actor.code = actor_code
            actor.name = actor_names[0] if actor_names else None
            if self._validate_actor_avatar(actor_avatar):
                actor.thumb = actor_avatar
            actor.alias = list(filter(lambda item: item != actor.name, actor_names))
            actors.append(actor)
        return actors

    def _validate_actor_avatar(self, avatar, head_validate=False):
        if not avatar or 'actor_unknow' in avatar:
            return False
        if head_validate:
            response = self.session.head(avatar)
            return response.ok
        else:
            return True
