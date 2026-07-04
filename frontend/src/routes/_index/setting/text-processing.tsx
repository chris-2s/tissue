import {Form, Input, message, Select} from "antd";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

import * as api from "../../../apis/setting";
import SettingPage from "./-components/page.tsx";
import SettingSection from "./-components/section.tsx";


export const Route = createFileRoute('/_index/setting/text-processing')({
    component: SettingTextProcessing,
})

function SettingTextProcessing() {
    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])
    const actorTranslator = Form.useWatch(['text_processing', 'actor_translator'], form)

    const {loading} = useRequest(
        () => api.readSettings(['translate', 'llm', 'text_processing']),
        {
            onSuccess: (res) => {
                form.setFieldsValue({
                    translate: {
                        type: 'deepl',
                        providers: {
                            deepl: {
                                base_url: '',
                                api_key: '',
                            },
                        },
                    },
                    llm: {
                        type: 'openai_compatible',
                        providers: {
                            openai_compatible: {
                                base_url: '',
                                api_key: '',
                                model: '',
                            },
                        },
                    },
                    text_processing: {
                        metadata_translator: 'off',
                        actor_translator: 'off',
                        actor_translation_mode: 'translated',
                    },
                    ...res,
                })
            },
        }
    )

    const {run, loading: saving} = useRequest(api.saveSettings, {
        manual: true,
        onSuccess: () => {
            message.success(t('common:feedback.settingsSaved'))
        },
    })

    function onFinish(data: any) {
        run({
            translate: data.translate,
            llm: data.llm,
            text_processing: data.text_processing,
        })
    }

    return (
        <SettingPage
            form={form}
            loading={loading}
            onFinish={onFinish}
            saving={saving}
            submitLabel={t('common:actions.submit')}
            title={t('setting:tabs.textProcessing')}
        >
            <SettingSection title={t('setting:textProcessing.translateTitle')}>
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.translateType')} name={['translate', 'type']}>
                        <Select>
                            <Select.Option value={'deepl'}>DeepL</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.translateBaseUrl')} name={['translate', 'providers', 'deepl', 'base_url']}>
                        <Input placeholder={'https://api-free.deepl.com'}/>
                    </Form.Item>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.translateApiKey')} name={['translate', 'providers', 'deepl', 'api_key']}>
                        <Input.Password autoComplete={'new-password'}/>
                    </Form.Item>
                </div>
            </SettingSection>

            <SettingSection title={t('setting:textProcessing.llmTitle')}>
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.llmType')} name={['llm', 'type']}>
                        <Select>
                            <Select.Option value={'openai_compatible'}>OpenAI Compatible</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.llmBaseUrl')} name={['llm', 'providers', 'openai_compatible', 'base_url']}>
                        <Input placeholder={'https://api.openai.com/v1'}/>
                    </Form.Item>
                    <Form.Item label={t('setting:textProcessing.llmApiKey')} name={['llm', 'providers', 'openai_compatible', 'api_key']}>
                        <Input.Password autoComplete={'new-password'}/>
                    </Form.Item>
                    <Form.Item label={t('setting:textProcessing.llmModel')} name={['llm', 'providers', 'openai_compatible', 'model']}>
                        <Input placeholder={'gpt-4.1-mini'}/>
                    </Form.Item>
                </div>
            </SettingSection>

            <SettingSection divider={false} title={t('setting:textProcessing.translationStrategyTitle')}>
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.metadataTranslator')} name={['text_processing', 'metadata_translator']}>
                        <Select>
                            <Select.Option value={'off'}>{t('setting:textProcessing.handler.off')}</Select.Option>
                            <Select.Option value={'translate'}>{t('setting:textProcessing.handler.translate')}</Select.Option>
                            <Select.Option value={'llm'}>{t('setting:textProcessing.handler.llm')}</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label={t('setting:textProcessing.actorTranslator')} name={['text_processing', 'actor_translator']}>
                        <Select>
                            <Select.Option value={'off'}>{t('setting:textProcessing.handler.off')}</Select.Option>
                            <Select.Option value={'translate'}>{t('setting:textProcessing.handler.translate')}</Select.Option>
                            <Select.Option value={'llm'}>{t('setting:textProcessing.handler.llm')}</Select.Option>
                        </Select>
                    </Form.Item>
                    {actorTranslator && actorTranslator !== 'off' ? (
                        <Form.Item label={t('setting:textProcessing.actorTranslationMode')} name={['text_processing', 'actor_translation_mode']}>
                            <Select>
                                <Select.Option value={'translated'}>{t('setting:textProcessing.actorTranslationModeOptions.translated')}</Select.Option>
                                <Select.Option value={'translated_with_original'}>{t('setting:textProcessing.actorTranslationModeOptions.translatedWithOriginal')}</Select.Option>
                            </Select>
                        </Form.Item>
                    ) : null}
                </div>
            </SettingSection>
        </SettingPage>
    )
}
