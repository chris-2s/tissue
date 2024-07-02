import os.path
import traceback

from app.schema import VideoDetail, VideoActor, VideoList
import xml.etree.ElementTree as ET

from app.utils.logger import logger


def get_nfo_path_by_video(path: str):
    file_path, ext_name = os.path.splitext(path)
    return file_path + ".nfo"


def get_basic(video: str, include_actor: bool = False):
    path = get_nfo_path_by_video(video)
    if not os.path.exists(path):
        return None

    try:
        tree = ET.parse(path)
        root = tree.getroot()
        title = root.find('title')
        cover = root.find('cover')
        extra = root.find('extra')
        is_zh = (extra.get('is_zh') == '1') if extra is not None else False
        is_uncensored = (extra.get('is_uncensored') == '1') if extra is not None else False

        video_actors = []
        if include_actor:
            actors = root.findall('actor')
            for actor in actors:
                video_actor = VideoActor()
                video_actor.name = actor.find('name').text
                thumb_element = actor.find('thumb')
                if thumb_element:
                    video_actor.thumb = thumb_element.text
                video_actors.append(video_actor)

        nfo = VideoList(path=video, title=title.text, cover=cover.text, is_zh=is_zh, is_uncensored=is_uncensored,
                        actors=video_actors)
        return nfo
    except Exception as e:
        logger.error(f'{video} NFO文件读取失败')
        traceback.print_exc()
        return None


def get_full(path: str):
    if not os.path.exists(path):
        return None

    tree = ET.parse(path)
    root = tree.getroot()

    nfo = VideoDetail(path=path)
    for element in root:
        match element.tag:
            case 'actor':
                actor = VideoActor()
                actor_name = element.find('name')
                if actor_name is not None:
                    actor.name = actor_name.text

                actor_thumb = element.find('thumb')
                if actor_thumb is not None:
                    actor.thumb = actor_thumb.text

                nfo.actors.append(actor)
            case 'tag':
                if element.text.startswith('系列:'):
                    nfo.series = element.text[3:]
                elif element.text.startswith('發行:'):
                    nfo.publisher = (element.text[3:])
                elif ':' not in element.text:
                    nfo.tags.append(element.text)
            case 'website':
                nfo.website.append(element.text)
            case 'plot':
                if not nfo.outline: nfo.outline = element.text
            case 'extra':
                nfo.is_zh = element.attrib.get('is_zh') == '1'
                nfo.is_uncensored = element.attrib.get('is_uncensored') == '1'
            case _:
                if hasattr(nfo, element.tag):
                    setattr(nfo, element.tag, element.text)
    return nfo


def save(path: str, detail: VideoDetail):
    root = ET.Element('Root')
    tree = ET.ElementTree(root)

    if detail.title:
        title = ET.Element('title')
        title.text = detail.title
        root.append(title)

    if detail.num:
        num = ET.Element('num')
        num.text = detail.num
        root.append(num)

    if detail.rating:
        rating = ET.Element('rating')
        rating.text = detail.rating
        root.append(rating)

    if detail.premiered:
        premiered = ET.Element('premiered')
        premiered.text = detail.premiered
        root.append(premiered)

        release = ET.Element('release')
        release.text = detail.premiered
        root.append(release)

        year = ET.Element('year')
        year.text = detail.premiered.split("-")[0]
        root.append(year)

    if detail.outline:
        outline = ET.Element('outline')
        outline.text = detail.outline
        root.append(outline)

        plot = ET.Element('plot')
        plot.text = detail.outline
        root.append(plot)

    if detail.runtime:
        runtime = ET.Element('runtime')
        runtime.text = detail.runtime
        root.append(runtime)

    if detail.director:
        director = ET.Element('director')
        director.text = detail.director
        root.append(director)

    if detail.actors:
        for actor in detail.actors:
            actor_element = ET.Element('actor')
            name = ET.Element('name')
            name.text = actor.name
            actor_element.append(name)
            if actor.thumb:
                thumb = ET.Element('thumb')
                thumb.text = actor.thumb
                actor_element.append(thumb)
            root.append(actor_element)

    if detail.studio:
        studio = ET.Element('studio')
        studio.text = detail.studio
        root.append(studio)

        studio_tag = ET.Element('tag')
        studio_tag.text = '製作:' + detail.studio
        root.append(studio_tag)

    if detail.publisher:
        publisher_tag = ET.Element('tag')
        publisher_tag.text = '發行:' + detail.publisher
        root.append(publisher_tag)

    if detail.tags:
        for tag in detail.tags:
            tag_element = ET.Element('tag')
            tag_element.text = tag
            root.append(tag_element)

            genre_element = ET.Element('genre')
            genre_element.text = tag
            root.append(genre_element)

    if detail.series:
        tag_element = ET.Element('tag')
        tag_element.text = detail.series
        root.append(tag_element)

        genre_element = ET.Element('genre')
        genre_element.text = detail.series
        root.append(genre_element)

    if detail.cover:
        cover = ET.Element('cover')
        cover.text = detail.cover
        root.append(cover)

        _, ext_name = os.path.splitext(detail.cover)

        save_path, _ = os.path.splitext(path)

        poster = ET.Element('poster')
        poster.text = f'{save_path}-poster{ext_name}'
        root.append(poster)

        thumb = ET.Element('thumb')
        thumb.text = f'{save_path}-thumb{ext_name}'
        root.append(thumb)

        fanart = ET.Element('fanart')
        fanart.text = f'{save_path}-fanart{ext_name}'
        root.append(fanart)

    if detail.website:
        for website in detail.website:
            website_element = ET.Element('website')
            website_element.text = website
            root.append(website_element)

    extra = ET.Element('extra')
    if detail.is_zh:
        extra.set('is_zh', '1')
    if detail.is_uncensored:
        extra.set('is_uncensored', '1')
    root.append(extra)

    lock = ET.Element('lockdata')
    lock.text = 'true'
    root.append(lock)

    tree.write(path, encoding='utf-8', xml_declaration=True)
