from urllib.parse import urljoin
from lxml import etree

from app.schema import VideoDetail, VideoPreviewItem, VideoPreview
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


class Jav321Spider(Spider):
    name = 'Jav321'
    origin_host = "https://www.jav321.com/"
    downloadable = False

    def get_info(self, num: str, url: str = None, include_downloads=False, include_previews=False,
                 include_comments=False):
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

        if include_previews:
            meta.previews = self.get_previews(html)

        return meta

    def get_previews(self, html: etree.HTML):
        result = []
        video_element = html.xpath("//video[@id='vjs_sample_player']")
        if video_element:
            video = video_element[0]
            source = video.xpath("./source/@src")[0]
            preview = VideoPreviewItem(type='video', thumb=video.get('poster'), url=source)
            result.append(preview)
        return [VideoPreview(website=self.name, items=result)] if result else None
