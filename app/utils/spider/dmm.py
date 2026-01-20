import re
from math import floor
from urllib.parse import urljoin

from app.schema import VideoDetail, VideoActor, VideoPreviewItem, VideoPreview
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


class DmmSpider(Spider):
    name = 'DMM'
    origin_host = "https://www.dmm.co.jp"
    api_url = "https://api.video.dmm.co.jp/graphql"

    def get_info(self, num: str, url: str = None, include_downloads=False, include_previews=False,
                 include_comments=False):
        url, code = self.get_real_page(num)
        response = self.session.get(url)
        if response.status_code == 404:
            raise SpiderException('未找到番号')

        meta = VideoDetail()

        response = self.session.post(self.api_url, json={
            "operationName": "ContentPageData",
            "variables": {"id": code, "isAmateur": False, "isAnime": False, "isAv": True, "isCinema": False,
                          "isLoggedIn": False, "isSP": False},
            "query": "query ContentPageData($id: ID!, $isLoggedIn: Boolean!, $isAmateur: Boolean!, $isAnime: Boolean!, $isAv: Boolean!, $isCinema: Boolean!, $isSP: Boolean!, $shouldFetchRelatedTags: Boolean = false) {\n  ppvContent(id: $id) {\n    ...ContentData\n    __typename\n  }\n  reviewSummary(contentId: $id) {\n    ...ReviewSummary\n    __typename\n  }\n  ...basketCountFragment @include(if: $isSP)\n}\nfragment ContentData on PPVContent {\n  id\n  floor\n  title\n  isExclusiveDelivery\n  releaseStatus\n  description\n  notices\n  isNoIndex\n  isAllowForeign\n  announcements {\n    body\n    __typename\n  }\n  featureArticles {\n    link {\n      url\n      text\n      __typename\n    }\n    __typename\n  }\n  packageImage {\n    largeUrl\n    mediumUrl\n    __typename\n  }\n  sampleImages {\n    number\n    imageUrl\n    largeImageUrl\n    __typename\n  }\n  products {\n    ...ProductData\n    __typename\n  }\n  mostPopularContentImage {\n    ... on ContentSampleImage {\n      __typename\n      largeImageUrl\n      imageUrl\n    }\n    ... on PackageImage {\n      __typename\n      largeUrl\n      mediumUrl\n    }\n    __typename\n  }\n  pricing {\n    lowestEffectivePriceInclusiveTax\n    lowestRegularPriceInclusiveTax\n    sale {\n      name\n      id\n      endAt\n      __typename\n    }\n    pointRewardCampaign {\n      name\n      id\n      endAt\n      promotionId\n      rate\n      __typename\n    }\n    __typename\n  }\n  weeklyRanking: ranking(term: Weekly)\n  monthlyRanking: ranking(term: Monthly)\n  wishlistCount\n  sample2DMovie {\n    highestMovieUrl\n    hlsMovieUrl\n    __typename\n  }\n  sampleVRMovie {\n    highestMovieUrl\n    __typename\n  }\n  ...AmateurAdditionalContentData @include(if: $isAmateur)\n  ...AnimeAdditionalContentData @include(if: $isAnime)\n  ...AvAdditionalContentData @include(if: $isAv)\n  ...CinemaAdditionalContentData @include(if: $isCinema)\n  __typename\n}\nfragment ProductData on PPVProduct {\n  id\n  priority\n  deliveryUnit {\n    id\n    priority\n    streamMaxQualityGroup\n    downloadMaxQualityGroup\n    __typename\n  }\n  pricing {\n    regularPriceInclusiveTax\n    effectivePriceInclusiveTax\n    __typename\n  }\n  expireDays\n  utilizationStatus @include(if: $isLoggedIn)\n  licenseType\n  shopName\n  couponDiscount {\n    coupon {\n      name\n      expirationPolicy {\n        ... on CouponExpirationAt {\n          expirationAt\n          __typename\n        }\n        ... on CouponExpirationDay {\n          expirationDays\n          __typename\n        }\n        __typename\n      }\n      expirationAt\n      minPayment\n      destinationUrl\n      __typename\n    }\n    discountedPriceInclusiveTax\n    __typename\n  }\n  __typename\n}\nfragment AmateurAdditionalContentData on PPVContent {\n  deliveryStartDate\n  duration\n  amateurActress {\n    id\n    name\n    imageUrl\n    age\n    waist\n    bust\n    bustCup\n    height\n    hip\n    relatedContents {\n      id\n      title\n      __typename\n    }\n    __typename\n  }\n  maker {\n    id\n    name\n    __typename\n  }\n  label {\n    id\n    name\n    __typename\n  }\n  genres {\n    id\n    name\n    __typename\n  }\n  makerContentId\n  playableInfo {\n    ...PlayableInfo\n    __typename\n  }\n  __typename\n}\nfragment PlayableInfo on PlayableInfo {\n  playableDevices {\n    deviceDeliveryUnits {\n      id\n      deviceDeliveryQualities {\n        isDownloadable\n        isStreamable\n        __typename\n      }\n      __typename\n    }\n    device\n    name\n    priority\n    isSupported\n    __typename\n  }\n  deviceGroups {\n    id\n    devices {\n      deviceDeliveryUnits {\n        id\n        deviceDeliveryQualities {\n          isStreamable\n          isDownloadable\n          __typename\n        }\n        __typename\n      }\n      isSupported\n      __typename\n    }\n    __typename\n  }\n  vrViewingType\n  __typename\n}\nfragment AnimeAdditionalContentData on PPVContent {\n  deliveryStartDate\n  duration\n  series {\n    id\n    name\n    __typename\n  }\n  maker {\n    id\n    name\n    __typename\n  }\n  label {\n    id\n    name\n    __typename\n  }\n  genres {\n    id\n    name\n    __typename\n  }\n  makerContentId\n  playableInfo {\n    ...PlayableInfo\n    __typename\n  }\n  __typename\n}\nfragment AvAdditionalContentData on PPVContent {\n  deliveryStartDate\n  makerReleasedAt\n  duration\n  actresses {\n    id\n    name\n    nameRuby\n    imageUrl\n    isBookmarked @include(if: $isLoggedIn)\n    __typename\n  }\n  histrions {\n    id\n    name\n    __typename\n  }\n  directors {\n    id\n    name\n    __typename\n  }\n  series {\n    id\n    name\n    __typename\n  }\n  maker {\n    id\n    name\n    __typename\n  }\n  label {\n    id\n    name\n    __typename\n  }\n  genres {\n    id\n    name\n    __typename\n  }\n  contentType\n  relatedWords @skip(if: $shouldFetchRelatedTags)\n  relatedTags(limit: 16) @include(if: $shouldFetchRelatedTags) {\n    ... on ContentTagGroup {\n      tags {\n        id\n        name\n        __typename\n      }\n      __typename\n    }\n    ... on ContentTag {\n      id\n      name\n      __typename\n    }\n    __typename\n  }\n  makerContentId\n  playableInfo {\n    ...PlayableInfo\n    __typename\n  }\n  __typename\n}\nfragment CinemaAdditionalContentData on PPVContent {\n  deliveryStartDate\n  duration\n  actresses {\n    id\n    name\n    nameRuby\n    imageUrl\n    __typename\n  }\n  histrions {\n    id\n    name\n    __typename\n  }\n  directors {\n    id\n    name\n    __typename\n  }\n  authors {\n    id\n    name\n    __typename\n  }\n  series {\n    id\n    name\n    __typename\n  }\n  maker {\n    id\n    name\n    __typename\n  }\n  label {\n    id\n    name\n    __typename\n  }\n  genres {\n    id\n    name\n    __typename\n  }\n  makerContentId\n  playableInfo {\n    ...PlayableInfo\n    __typename\n  }\n  __typename\n}\nfragment ReviewSummary on ReviewSummary {\n  average\n  total\n  withCommentTotal\n  distributions {\n    total\n    withCommentTotal\n    rating\n    __typename\n  }\n  __typename\n}\nfragment basketCountFragment on Query {\n  legacyBasket @skip(if: $isLoggedIn) {\n    total\n    __typename\n  }\n  basketCount: user @include(if: $isLoggedIn) {\n    ... on Member {\n      ppvBasketItemCount\n      __typename\n    }\n    __typename\n  }\n  __typename\n}"
        }).json()

        content = response.get("data").get("ppvContent")
        review = response.get("data").get("reviewSummary")

        meta.num = content.get("makerContentId")
        meta.title = content["title"]
        if content.get("description"):
            meta.outline = content["description"].replace("<br>", "\n")
        if review:
            meta.rating = str(review["average"])
        if content.get('makerReleasedAt'):
            meta.premiered = content['makerReleasedAt'].split("T")[0]
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
            meta.series = content.get('series').get('name')
        meta.cover = content['packageImage']['largeUrl']

        actors = []
        for actor in content['actresses']:
            actors.append(
                VideoActor(name=actor['name'], thumb=actor['imageUrl'])
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
        return [VideoPreview(website=self.name, items=result)]
