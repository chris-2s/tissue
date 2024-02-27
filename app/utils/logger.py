import inspect
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Dict, Any

import click

# 日志级别颜色
level_name_colors = {
    logging.DEBUG: lambda level_name: click.style(str(level_name), fg="cyan"),
    logging.INFO: lambda level_name: click.style(str(level_name), fg="green"),
    logging.WARNING: lambda level_name: click.style(str(level_name), fg="yellow"),
    logging.ERROR: lambda level_name: click.style(str(level_name), fg="red"),
    logging.CRITICAL: lambda level_name: click.style(
        str(level_name), fg="bright_red"
    ),
}


class CustomFormatter(logging.Formatter):
    def format(self, record):
        seperator = " " * (8 - len(record.levelname))
        record.leveltext = level_name_colors[record.levelno](record.levelname + ":") + seperator
        return super().format(record)


class LoggerManager:

    def __init__(self):
        log_path = Path(f'{Path(__file__).cwd()}/config/app.log')

        self.logger = logging.getLogger(log_path.stem)
        self.logger.setLevel(logging.INFO)

        # 终端日志
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_formatter = CustomFormatter(f"%(leveltext)s%(message)s")
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)

        file_handler = RotatingFileHandler(filename=log_path,
                                           mode='w',
                                           maxBytes=5 * 1024 * 1024,
                                           backupCount=3,
                                           encoding='utf-8')
        file_handler.setLevel(logging.INFO)
        console_formatter = CustomFormatter(f"【%(levelname)s】%(asctime)s - %(message)s")
        file_handler.setFormatter(console_formatter)
        self.logger.addHandler(file_handler)

    def log(self, method: str, msg: str, *args, **kwargs):
        caller_name = self.__get_caller()
        method = getattr(self.logger, method)
        method(f"{caller_name} - {msg}", *args, **kwargs)

    @staticmethod
    def __get_caller():
        caller_name = None
        for i in inspect.stack()[3:]:
            filepath = Path(i.filename)
            parts = filepath.parts
            if not caller_name:
                if parts[-1] == "__init__.py":
                    caller_name = parts[-2]
                else:
                    caller_name = parts[-1]
            if "app" in parts:
                if "main.py" in parts:
                    break
            elif len(parts) != 1:
                break
        if caller_name and caller_name.endswith('.py'):
            caller_name = caller_name[:-3]
        return caller_name or "loger"

    def info(self, msg: str, *args, **kwargs):
        self.log("info", msg, *args, **kwargs)

    def debug(self, msg: str, *args, **kwargs):
        self.log("debug", msg, *args, **kwargs)

    def warning(self, msg: str, *args, **kwargs):
        self.log("warning", msg, *args, **kwargs)

    def warn(self, msg: str, *args, **kwargs):
        self.log("warning", msg, *args, **kwargs)

    def error(self, msg: str, *args, **kwargs):
        self.log("error", msg, *args, **kwargs)

    def critical(self, msg: str, *args, **kwargs):
        self.log("critical", msg, *args, **kwargs)


# 初始化公共日志
logger = LoggerManager()
