import os

from fastapi import Depends
from requests import Session

from app import schema, utils
from app.db import get_db
from app.schema import Setting
from app.service.base import BaseService


def get_file_service(db: Session = Depends(get_db)):
    return FileService(db=db)


class FileService(BaseService):

    def get_files(self):
        setting = Setting()
        result = []
        for root, _, files in os.walk(setting.file.path):
            for file in files:
                path = os.path.join(root, file)
                _, ext_name = os.path.splitext(path)
                size = os.stat(path).st_size

                if ext_name in setting.app.video_format.split(',') and size > (
                        setting.app.video_size_minimum * 1024 * 1024):
                    result.append(schema.File(name=file, path=root, size=utils.convert_size(size)))
        return result
