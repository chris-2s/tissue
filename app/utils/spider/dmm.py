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
            "query": "query ContentPageData($id:ID!,$isLoggedIn:Boolean!,$isAmateur:Boolean!,$isAnime:Boolean!,$isAv:Boolean!,$isCinema:Boolean!,$isSP:Boolean!){ppvContent(id:$id){...ContentData}reviewSummary(contentId:$id){...ReviewSummary}...basketCountFragment}fragment ContentData on PPVContent{id floor title isExclusiveDelivery releaseStatus description notices isNoIndex isAllowForeign announcements{body}featureArticles{link{url text}}packageImage{largeUrl mediumUrl}sampleImages{number imageUrl largeImageUrl}products{...ProductData}mostPopularContentImage{...on ContentSampleImage{largeImageUrl imageUrl}...on PackageImage{largeUrl mediumUrl}}priceSummary{lowestSalePrice lowestPrice campaign{title id endAt}}weeklyRanking:ranking(term:Weekly)monthlyRanking:ranking(term:Monthly)wishlistCount sample2DMovie{fileID highestMovieUrl}sampleVRMovie{highestMovieUrl}...AmateurAdditionalContentData @include(if:$isAmateur)...AnimeAdditionalContentData @include(if:$isAnime)...AvAdditionalContentData @include(if:$isAv)...CinemaAdditionalContentData @include(if:$isCinema)}fragment ProductData on PPVProduct{id priority deliveryUnit{id priority streamMaxQualityGroup downloadMaxQualityGroup}priceInclusiveTax sale{priceInclusiveTax}expireDays utilization @include(if:$isLoggedIn){isTVODRentalPlayable status}licenseType shopName availableCoupon{name expirationPolicy{...on ProductCouponExpirationAt{expirationAt}...on ProductCouponExpirationDay{expirationDays}}expirationAt discountedPrice minPayment destinationUrl}}fragment AmateurAdditionalContentData on PPVContent{deliveryStartDate duration amateurActress{id name imageUrl age waist bust bustCup height hip relatedContents{id title}}maker{id name}label{id name}genres{id name}makerContentId playableInfo{...PlayableInfo}}fragment PlayableInfo on PlayableInfo{playableDevices{deviceDeliveryUnits{id deviceDeliveryQualities{isDownloadable isStreamable}}device name priority}deviceGroups{id devices{deviceDeliveryUnits{deviceDeliveryQualities{isStreamable isDownloadable}}}}vrViewingType}fragment AnimeAdditionalContentData on PPVContent{deliveryStartDate duration series{id name}maker{id name}label{id name}genres{id name}makerContentId playableInfo{...PlayableInfo}}fragment AvAdditionalContentData on PPVContent{deliveryStartDate makerReleasedAt duration actresses{id name nameRuby imageUrl isBookmarked @include(if:$isLoggedIn)}histrions{id name}directors{id name}series{id name}maker{id name}label{id name}genres{id name}contentType relatedWords makerContentId playableInfo{...PlayableInfo}}fragment CinemaAdditionalContentData on PPVContent{deliveryStartDate duration actresses{id name nameRuby imageUrl}histrions{id name}directors{id name}authors{id name}series{id name}maker{id name}label{id name}genres{id name}makerContentId playableInfo{...PlayableInfo}}fragment ReviewSummary on ReviewSummary{average total withCommentTotal distributions{total withCommentTotal rating}}fragment basketCountFragment on Query{basketCount:legacyBasket @include(if:$isSP){total}}"
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
