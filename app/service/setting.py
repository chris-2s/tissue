from app.integrations.downloaders.manager import downloader_manager
from app.integrations.notifications.manager import notification_manager
from app.scheduler import scheduler
from app.schema import Setting


class SettingService:
    @staticmethod
    def save_section(section: str, payload: dict) -> None:
        Setting.write_section(section, payload)
        latest_setting = Setting()

        if section == 'download':
            if latest_setting.download.trans_auto:
                scheduler.add('scrape_download')
            else:
                scheduler.remove('scrape_download')

            if latest_setting.download.delete_auto:
                scheduler.add('delete_complete_download')
            else:
                scheduler.remove('delete_complete_download')

            downloader_manager.refresh()

        if section == 'notify':
            notification_manager.refresh()

        if section == 'crawler':
            scheduler.add('subscribe')

        if section == 'cookiecloud':
            if latest_setting.cookiecloud.enabled:
                scheduler.add('cookiecloud_sync')
            else:
                scheduler.remove('cookiecloud_sync')
