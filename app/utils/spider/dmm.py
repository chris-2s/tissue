import re
from urllib.parse import urljoin

import requests
from lxml import etree

from app.schema import VideoDetail
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


class DmmSpider(Spider):
    host = "https://www.dmm.co.jp"
    name = 'DMM'

    def get_info(self, num: str, url: str = None, include_downloads=False, include_previews=False):
        url = self.get_real_page(num)
        response = self.session.get(url)
        if response.status_code == 404:
            raise SpiderException('未找到番号')

        meta = VideoDetail()
        meta.num = num

        html = etree.HTML(response.text)
        outline_element = html.xpath("//div[@class='clear']/following-sibling::div[1]")
        if outline_element:
            outline = outline_element[0]
            meta.outline = outline.text.replace("\n", "")
            brs = outline.xpath('./br')
            if brs:
                extra_outline = "".join(map(lambda i: i.tail, brs))
                hr_index = extra_outline.find("----------------------")
                if hr_index != -1:
                    meta.outline += (extra_outline[0:hr_index])
                else:
                    meta.outline += extra_outline
        meta.website.append(response.url)
        return meta

    def generate_url(self, num: str):
        parts = num.split("-")
        url = "{0}{1:0>5d}".format(parts[0], int(parts[1]))
        return urljoin(self.host, f"/digital/videoa/-/detail/=/cid={url}/")

    def get_real_page(self, num: str):
        url = self.generate_url(num)
        response = self.session.get(url)

        results = re.findall(r'\"yesButtonLink\":\"(.+?)\"', response.text)
        if not results:
            raise Exception("找不到年龄确认按钮")
        return results[0]
