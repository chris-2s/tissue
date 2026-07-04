import {request} from "../utils/requests";

export type SettingSection =
    | 'library'
    | 'crawler'
    | 'file'
    | 'download'
    | 'notify'
    | 'translate'
    | 'llm'
    | 'text_processing'
    | 'cookiecloud';

export async function readSettings<T extends Partial<Record<SettingSection, any>>>(
    sections: SettingSection[] | ['*']
): Promise<T> {
    const response = await request.request({
        url: '/setting/read',
        method: 'post',
        data: {sections},
    });
    return response.data.data;
}

export function saveSettings(sections: Partial<Record<SettingSection, any>>) {
    return request.request({
        url: '/setting/save',
        method: 'post',
        data: {sections},
    });
}

export async function readSettingSection<T>(section: SettingSection): Promise<T> {
    const data = await readSettings<Record<SettingSection, T>>([section]);
    return data[section];
}

export function saveSettingSection(section: SettingSection, data: any) {
    return saveSettings({[section]: data});
}
