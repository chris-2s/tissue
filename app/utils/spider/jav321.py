from urllib.parse import urljoin

import requests
from lxml import etree

from app.schema import VideoDetail
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


class Jav321Spider(Spider):
    host = "https://www.jav321.com/"
    name = 'Jav321'
    downloadable = False

    def get_info(self, num: str, url: str = None, include_downloads=False):
        response = self.session.post(urljoin(self.host, '/search'), data={'sn': num})
        html = etree.HTML(response.text)

        no = html.xpath("//small")
        if not no or num.lower() not in no[0].text.lower().strip():
            raise SpiderException('未找到番号')

        meta = VideoDetail()
        meta.num = num

        outline_element = no[0].xpath("./../../..//div[@class='row']")
        if len(outline_element) > 0:
            outline = outline_element[-1].xpath("./div")[0]
            if outline.text:
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
