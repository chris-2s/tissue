from datetime import datetime
from typing import Any
from urllib.parse import urljoin, urlparse, parse_qs

from lxml import etree

from app.exception import BizException
from app.schema import VideoDetail, VideoDownload, VideoPreviewItem, VideoPreview
from app.schema.home import SiteVideo
from app.utils.cookies import (
    apply_cookie_header_to_jar,
    cookiejar_to_cookies,
    cookies_to_cookiecloud_items,
    to_cookie_header,
)
from app.utils.spider.spider import Session, Spider
from app.utils.spider.spider_exception import SpiderException


def _text(el) -> str:
    """Extract all text from an lxml etree element recursively."""
    return el.xpath('string()').strip()


class GayTorrentsSpider(Spider):
    key = 'gaytorrents'
    name = 'GayTorrents'
    origin_host = 'https://www.gay-torrents.net'
    supports_ranking = True
    supports_login = True
    supports_downloads = True
    supports_previews = True

    def _ensure_valid_cookies(self):
        if not self.session.cookies:
            return
        if not self._is_logged_in(self.session.cookies):
            self.session.cookies.clear()

    def get_login_page(self) -> dict[str, Any]:
        session = self.session
        login_url = urljoin(self.host, '/login.php')

        response = session.get(login_url)
        html = etree.HTML(response.content)

        token_els = html.xpath("//input[@name='securitytoken']/@value")
        authenticity_token = token_els[0] if token_els else ''

        cookie_str = to_cookie_header(cookiejar_to_cookies(session.cookies))

        return {
            'cookies': cookie_str,
            'authenticity_token': authenticity_token,
            'captcha': '',
        }

    def submit_login(self, cookies: str, authenticity_token: str,
                     username: str, password: str, captcha: str) -> list[dict]:
        session = Session()
        session.headers = self.session.headers.copy()

        apply_cookie_header_to_jar(cookies, session.cookies)

        login_url = urljoin(self.host, '/login.php')

        data = {
            'do': 'login',
            'vb_login_username': username,
            'vb_login_password': password,
            'securitytoken': authenticity_token,
            'cookieuser': '1',
        }

        session.post(login_url, data=data, allow_redirects=True)

        # vBulletin sets a *vbb_userid cookie on success (prefix varies per install, e.g. ENvbb_userid)
        if self._is_logged_in(session.cookies):
            return cookies_to_cookiecloud_items(cookiejar_to_cookies(session.cookies))

        raise BizException('登录失败，请检查账号密码')

    @staticmethod
    def _is_logged_in(cookie_jar) -> bool:
        """Check for a vBulletin userid cookie with non-zero value (prefix varies per install)."""
        for name in cookie_jar:
            if isinstance(name, str):
                value = cookie_jar.get(name)
            else:
                name, value = name.name, name.value
            if name.endswith('vbb_userid') and value not in ('0', '', None):
                return True
        return False

    def get_info(self, num: str, url: str | None = None, include_downloads=False,
                 include_previews=False, include_comments=False):
        if url is None:
            url = urljoin(self.host, f'/torrentdetails.php?torrentid={num}')

        response = self.session.get(url)
        if not response.ok:
            raise SpiderException('获取种子详情失败')

        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))

        title_el = html.xpath("//h2[@id='file_name']")
        if not title_el:
            raise SpiderException('未找到种子详情，请检查登录状态')

        meta = VideoDetail()
        meta.num = num
        meta.title = _text(title_el[0])

        # Parse dt/dd info pairs
        dt_els = html.xpath("//dl[contains(@class,'userinfo_extra')]/dt")
        dd_els = html.xpath("//dl[contains(@class,'userinfo_extra')]/dd")
        info = {_text(dt): dd for dt, dd in zip(dt_els, dd_els)}

        if 'Uploaded' in info:
            try:
                meta.premiered = datetime.strptime(
                    _text(info['Uploaded']), '%H:%M %d-%b-%Y'
                ).strftime('%Y-%m-%d')
            except ValueError:
                meta.premiered = _text(info['Uploaded'])

        # Tags
        tag_els = html.xpath("//dd[@id='taglist']/a")
        if tag_els:
            meta.tags = [_text(el) for el in tag_els if _text(el)]

        # Category as studio
        cat_el = html.xpath("//dd[@id='category']//img/@title")
        if cat_el:
            meta.studio = cat_el[0]

        # Description / outline
        desc_el = html.xpath("//div[@id='description']")
        if desc_el:
            meta.outline = _text(desc_el[0])

        # Cover = first full-size preview image
        img_links = html.xpath("//div[@id='displayimages']/a/@href")
        if img_links:
            meta.cover = img_links[0]

        meta.website.append(url)

        if include_previews:
            meta.previews = self._get_previews(html)

        if include_downloads:
            meta.downloads = self._get_downloads(html, url)

        return meta

    def _get_previews(self, html):
        items = []
        for a_el in html.xpath("//div[@id='displayimages']/a"):
            full_url = a_el.get('href')
            thumb_els = a_el.xpath('./img/@src')
            thumb = thumb_els[0] if thumb_els else full_url
            if full_url:
                items.append(VideoPreviewItem(type='image', thumb=thumb, url=full_url))
        if not items:
            return []
        return [VideoPreview(source=self.source_ref(), items=items)]

    def _get_downloads(self, html, page_url: str):
        token_els = html.xpath("//form[@name='torrentform']//input[@name='securitytoken']/@value")
        if not token_els:
            return []

        title_el = html.xpath("//h2[@id='file_name']")
        name = _text(title_el[0]) if title_el else 'Torrent'

        size_dd = html.xpath("//dl[contains(@class,'userinfo_extra')]/dt[text()='Size']"
                             "/following-sibling::dd[1]")
        size = _text(size_dd[0]) if size_dd else None

        download = VideoDownload(source=self.source_ref())
        download.url = page_url
        download.name = name
        download.size = size
        return [download]

    def download_torrent_file(self, torrent_id: str) -> bytes | None:
        """Download the raw .torrent file bytes using the authenticated session."""
        detail_url = urljoin(self.host, f'/torrentdetails.php?torrentid={torrent_id}')
        response = self.session.get(detail_url)
        if not response.ok:
            return None
        html = etree.HTML(response.content)
        tokens = html.xpath("//form[@name='torrentform']//input[@name='securitytoken']/@value")
        if not tokens:
            return None
        dl = self.session.post(urljoin(self.host, '/torrentdetails.php'), data={
            'do': 'download',
            'securitytoken': tokens[0],
            'torrentid': torrent_id,
            'download': 'as Torrent',
        })
        content_type = dl.headers.get('content-type', '')
        if dl.ok and ('torrent' in content_type or 'octet-stream' in content_type or dl.content[:1] == b'd'):
            return dl.content
        return None

    def get_ranking(self, video_type: str, cycle: str):
        # video_type is the category path e.g. "porn/Asian" or "nonporn/Drama"
        url = urljoin(self.host, f'/torrentslist.php?type={video_type}')
        response = self.session.get(url)
        if not response.ok:
            return []

        html = etree.HTML(response.content, parser=etree.HTMLParser(encoding='utf-8'))
        return self._parse_listing(html)

    def _parse_listing(self, html):
        result = []
        rows = html.xpath("//ul[contains(@class,'Torrent-List')]")
        for row in rows:
            name_li = row.xpath(".//li[contains(@class,'Torrent-List-Name')]/a[@href]")
            if not name_li:
                continue

            a = name_li[0]
            href = a.get('href', '')
            title = _text(a)
            if not href or not title:
                continue

            # Skip ad/promo entries
            if title.startswith('[FFL]'):
                continue

            torrent_url = urljoin(self.host, href)
            qs = parse_qs(urlparse(torrent_url).query)
            torrent_id = qs.get('torrentid', [href])[0]

            date_li = row.xpath(".//li[contains(@class,'Torrent-List-Date')]")
            publish_date = None
            if date_li:
                date_str = _text(date_li[0])
                try:
                    publish_date = datetime.strptime(date_str, '%H:%M %d-%b-%Y').date()
                except ValueError:
                    pass

            seeds_li = row.xpath(".//li[contains(@class,'Torrent-List-Seeds')]")
            rank = None
            if seeds_li:
                seeds_text = _text(seeds_li[0]).rstrip('|').strip()
                try:
                    rank = float(seeds_text)
                except ValueError:
                    pass

            # Grab the first thumbnail image in the row if present
            img_srcs = row.xpath(".//img/@src")
            cover = urljoin(self.host, img_srcs[0]) if img_srcs else None

            video = SiteVideo()
            video.num = torrent_id
            video.title = title
            video.url = torrent_url
            video.publish_date = publish_date
            video.rank = rank
            video.cover = cover
            result.append(video)

        return result
