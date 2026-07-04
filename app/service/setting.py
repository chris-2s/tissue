from app.integrations.downloaders.manager import downloader_manager
from app.integrations.llms import llm_manager
from app.integrations.notifications.manager import notification_manager
from app.integrations.translators import translator_manager
from app.scheduler import scheduler
from app.schema import Setting


class SettingService:
    @staticmethod
    def save_section(section: str, payload: dict) -> None:
        Setting.write_section(section, payload)
        latest_setting = Setting()
        SettingService.apply_side_effects({section}, latest_setting)

    @staticmethod
    def save_sections(payloads: dict[str, dict]) -> None:
        Setting.write_sections(payloads)
        latest_setting = Setting()
        SettingService.apply_side_effects(set(payloads.keys()), latest_setting)

    @staticmethod
    def apply_side_effects(updated_sections: set[str], latest_setting: Setting) -> None:
        if 'download' in updated_sections:
            if latest_setting.download.trans_auto:
                scheduler.add('scrape_download')
            else:
                scheduler.remove('scrape_download')

            if latest_setting.download.delete_auto:
                scheduler.add('delete_complete_download')
            else:
                scheduler.remove('delete_complete_download')

            downloader_manager.refresh()

        if 'notify' in updated_sections:
            notification_manager.refresh()

        if 'translate' in updated_sections:
            translator_manager.refresh()

        if 'llm' in updated_sections:
            llm_manager.refresh()

        if 'crawler' in updated_sections:
            scheduler.add('subscribe')

        if 'cookiecloud' in updated_sections:
            if latest_setting.cookiecloud.enabled:
                scheduler.add('cookiecloud_sync')
            else:
                scheduler.remove('cookiecloud_sync')
