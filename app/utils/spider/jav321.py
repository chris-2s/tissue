from urllib.parse import urljoin

import requests
from lxml import etree

from app.schema import VideoDetail
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


class Jav321Spider(Spider):
    host = "https://www.jav321.com/"
    name = 'Jav321'

    def get_info(self):
        response = self.session.post(urljoin(self.host, '/search'), data={'sn': self.num})
        html = etree.HTML(response.text)

        no = html.xpath("//small")
        if not no or no[0].text.strip() != self.num.lower():
            raise SpiderException('未找到匹配影片')

        meta = VideoDetail()
        meta.num = self.num

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
