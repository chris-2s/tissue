import re
from math import floor
from urllib.parse import urljoin

from app.schema import VideoDetail, VideoActor, VideoPreviewItem, VideoPreview
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


DMM_CONTENT_PAGE_QUERY = """
query ContentPageData($id: ID!) {
  ppvContent(id: $id) {
    title
    description
    deliveryStartDate
    packageImage {
      largeUrl
      mediumUrl
    }
    sampleImages {
      imageUrl
      largeImageUrl
    }
    sample2DMovie {
      highestMovieUrl
    }
    makerContentId
    makerReleasedAt
    duration
    actresses {
      id
      name
      imageUrl
    }
    directors {
      name
    }
    series {
      name
    }
    maker {
      name
    }
    label {
      name
    }
    genres {
      name
    }
  }
  reviewSummary(contentId: $id) {
    average
  }
}
""".strip()


class DmmSpider(Spider):
    key = 'dmm'
    name = 'DMM'
    origin_host = "https://www.dmm.co.jp"
    api_url = "https://api.video.dmm.co.jp/graphql"
    supports_previews = True

    def get_info(self, num: str, url: str = None, include_downloads=False, include_previews=False,
                 include_comments=False):
        url, code = self.get_real_page(num)
        response = self.session.get(url)
        if response.status_code == 404:
            raise SpiderException('未找到番号')

        meta = VideoDetail(source=self.source_ref())

        response = self.session.post(self.api_url, json={
            "operationName": "ContentPageData",
            "variables": {"id": code},
            "query": DMM_CONTENT_PAGE_QUERY,
        }).json()

        data = response.get("data") or {}
        content = data.get("ppvContent")
        review = data.get("reviewSummary")
        if not content:
            raise SpiderException("DMM GraphQL 返回缺少内容数据")

        meta.num = content.get("makerContentId")
        meta.title = content["title"]
        if content.get("description"):
            meta.outline = content["description"].replace("<br>", "\n")
        if review:
            meta.rating = str(review["average"])
        if content.get('makerReleasedAt'):
            meta.premiered = content['makerReleasedAt'].split("T")[0]
        elif content.get('deliveryStartDate'):
            meta.premiered = content['deliveryStartDate'].split("T")[0]
        if content.get('duration'):
            meta.runtime = str(floor(content["duration"] / 60))
        if content.get('directors'):
            meta.director = content['directors'][0]['name']
        if content.get('maker'):
            meta.studio = content['maker']['name']
        if content.get('label'):
            meta.publisher = content['label']['name']
        if content.get('genres'):
            meta.tags = [genres['name'] for genres in content['genres']]
        if content.get('series'):
            meta.series = content['series']['name']
        package_image = content.get('packageImage') or {}
        if package_image:
            meta.cover = package_image.get('largeUrl') or package_image.get('mediumUrl')
            meta.thumb = package_image.get('mediumUrl') or package_image.get('largeUrl')

        actors = []
        for actor in content.get('actresses') or []:
            actors.append(
                VideoActor(code=actor.get('id'), name=actor.get('name'), thumb=actor.get('imageUrl'))
            )
        meta.actors = actors

        if include_previews:
            meta.previews = self.get_previews(content)

        meta.website.append(url)
        return meta

    def generate_url(self, num: str):
        parts = num.split("-")
        code = "{0}{1:0>5d}".format(parts[0], int(parts[1])).lower()
        return urljoin(self.host, f"/digital/videoa/-/detail/=/cid={code}/"), code

    def get_real_page(self, num: str):
        url, code = self.generate_url(num)
        response = self.session.get(url)

        results = re.findall(r'\"yesButtonLink\":\"(.+?)\"', response.text)
        if not results:
            raise Exception("找不到年龄确认按钮")
        return results[0], code

    def get_previews(self, content: dict):
        result = []

        images = content.get('sampleImages') or []
        for image in images:
            preview = VideoPreviewItem(type='image', thumb=image.get('imageUrl'), url=image.get('largeImageUrl'))
            result.append(preview)

        video = content.get('sample2DMovie')
        if video:
            thumb = content.get('packageImage').get('largeUrl')
            result.insert(
                0,
                VideoPreviewItem(type='video', thumb=thumb, url=video['highestMovieUrl'])
            )
        return [VideoPreview(source=self.source_ref(), items=result)]
