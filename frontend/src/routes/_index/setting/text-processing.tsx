import {Button, Form, Input, message, Select, Switch, Table, Typography} from "antd";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

import * as api from "../../../apis/setting";
import SettingPage from "./-components/page.tsx";
import SettingSection from "./-components/section.tsx";


const LLM_DEFAULT_URLS = {
    openai_compatible: 'https://api.openai.com/v1',
    openai_responses: 'https://api.openai.com/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/interactions',
} as const


export const Route = createFileRoute('/_index/setting/text-processing')({
    component: SettingTextProcessing,
})

function SettingTextProcessing() {
    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])
    const translatorType = Form.useWatch(['translate', 'type'], form)
    const actorTranslator = Form.useWatch(['text_processing', 'actor_translator'], form)
    const metadataTranslator = Form.useWatch(['text_processing', 'metadata_translator'], form)
    const llmType = Form.useWatch(['llm', 'type'], form) || 'openai_compatible'
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
                            deeplx: {
                                url: '',
                            },
                        },
                    },
                    text_processing: {
                        metadata_translator: 'off',
                        actor_translator: 'off',
                        actor_translation_mode: 'translated',
                        metadata_title_enabled: true,
                        metadata_outline_enabled: true,
                        metadata_tags_enabled: false,
                        metadata_series_enabled: false,
                        custom_translations: [],
                    },
                    ...res,
                    llm: {
                        type: res.llm?.type || 'openai_compatible',
                        providers: Object.fromEntries(
                            Object.entries(LLM_DEFAULT_URLS).map(([provider, defaultUrl]) => {
                                const saved = res.llm?.providers?.[provider] || {}
                                return [provider, {
                                    ...saved,
                                    base_url: saved.base_url?.trim() || defaultUrl,
                                }]
                            })
                        ),
                    },
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

    function onLlmTypeChange(nextType: keyof typeof LLM_DEFAULT_URLS) {
        const currentConfig = form.getFieldValue(['llm', 'providers', llmType]) || {}
        const nextConfig = form.getFieldValue(['llm', 'providers', nextType]) || {}
        form.setFieldValue(['llm', 'providers', nextType], {
            ...nextConfig,
            base_url: nextConfig.base_url?.trim() || LLM_DEFAULT_URLS[nextType],
            api_key: currentConfig.api_key || nextConfig.api_key,
            model: currentConfig.model || nextConfig.model,
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
                            <Select.Option value={'deeplx'}>DeepLX</Select.Option>
                        </Select>
                    </Form.Item>
                    {translatorType === 'deeplx' ? (
                        <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.translateEndpointUrl')} name={['translate', 'providers', 'deeplx', 'url']}>
                            <Input placeholder={'https://example.com/translate'}/>
                        </Form.Item>
                    ) : (
                        <>
                            <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.translateBaseUrl')} name={['translate', 'providers', 'deepl', 'base_url']}>
                                <Input placeholder={'https://api-free.deepl.com'}/>
                            </Form.Item>
                            <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.translateApiKey')} name={['translate', 'providers', 'deepl', 'api_key']}>
                                <Input.Password autoComplete={'new-password'}/>
                            </Form.Item>
                        </>
                    )}
                </div>
            </SettingSection>

            <SettingSection title={t('setting:textProcessing.llmTitle')}>
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.llmType')} name={['llm', 'type']}>
                        <Select onChange={onLlmTypeChange}>
                            <Select.Option value={'openai_compatible'}>OpenAI Chat Completions</Select.Option>
                            <Select.Option value={'openai_responses'}>OpenAI Responses</Select.Option>
                            <Select.Option value={'gemini'}>Google Gemini</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        className={'lg:col-span-2'}
                        label={t('setting:textProcessing.llmBaseUrl')}
                        name={['llm', 'providers', llmType, 'base_url']}
                    >
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('setting:textProcessing.llmApiKey')} name={['llm', 'providers', llmType, 'api_key']}>
                        <Input.Password autoComplete={'new-password'}/>
                    </Form.Item>
                    <Form.Item label={t('setting:textProcessing.llmModel')} name={['llm', 'providers', llmType, 'model']}>
                        <Input placeholder={llmType === 'gemini' ? 'gemini-3.5-flash' : 'gpt-4.1-mini'}/>
                    </Form.Item>
                </div>
            </SettingSection>

            <SettingSection divider={false} title={t('setting:textProcessing.translationStrategyTitle')}>
                <div className={'space-y-6'}>
                    <div>
                        <div className={'mb-3'}>
                            <Typography.Title level={5} className={'!mb-0.5'}>
                                {t('setting:textProcessing.metadataTranslationTitle')}
                            </Typography.Title>
                            <Typography.Paragraph className={'!mb-0'}>
                                {t('setting:textProcessing.metadataTranslationDescription')}
                            </Typography.Paragraph>
                        </div>
                        <div className={'grid gap-4 lg:grid-cols-2'}>
                            <Form.Item className={'lg:col-span-2'} label={t('setting:textProcessing.metadataTranslator')} name={['text_processing', 'metadata_translator']}>
                                <Select>
                                    <Select.Option value={'off'}>{t('setting:textProcessing.handler.off')}</Select.Option>
                                    <Select.Option value={'translate'}>{t('setting:textProcessing.handler.translate')}</Select.Option>
                                    <Select.Option value={'llm'}>{t('setting:textProcessing.handler.llm')}</Select.Option>
                                </Select>
                            </Form.Item>
                            <div className={'lg:col-span-2'}>
                                <div className={'mb-2 text-sm text-[var(--ant-color-text-description)]'}>
                                    {t('setting:textProcessing.metadataFields')}
                                </div>
                                <div className={'flex flex-wrap gap-x-6 gap-y-3'}>
                                    <label className={'flex items-center gap-2 text-sm'}>
                                        <Form.Item className={'!mb-0'} name={['text_processing', 'metadata_title_enabled']} valuePropName={'checked'}>
                                            <Switch disabled={metadataTranslator === 'off'}/>
                                        </Form.Item>
                                        <span>{t('setting:textProcessing.metadataTitleEnabled')}</span>
                                    </label>
                                    <label className={'flex items-center gap-2 text-sm'}>
                                        <Form.Item className={'!mb-0'} name={['text_processing', 'metadata_outline_enabled']} valuePropName={'checked'}>
                                            <Switch disabled={metadataTranslator === 'off'}/>
                                        </Form.Item>
                                        <span>{t('setting:textProcessing.metadataOutlineEnabled')}</span>
                                    </label>
                                    <label className={'flex items-center gap-2 text-sm'}>
                                        <Form.Item className={'!mb-0'} name={['text_processing', 'metadata_tags_enabled']} valuePropName={'checked'}>
                                            <Switch disabled={metadataTranslator === 'off'}/>
                                        </Form.Item>
                                        <span>{t('setting:textProcessing.metadataTagsEnabled')}</span>
                                    </label>
                                    <label className={'flex items-center gap-2 text-sm'}>
                                        <Form.Item className={'!mb-0'} name={['text_processing', 'metadata_series_enabled']} valuePropName={'checked'}>
                                            <Switch disabled={metadataTranslator === 'off'}/>
                                        </Form.Item>
                                        <span>{t('setting:textProcessing.metadataSeriesEnabled')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className={'mb-3'}>
                            <Typography.Title level={5} className={'!mb-0.5'}>
                                {t('setting:textProcessing.actorTranslationTitle')}
                            </Typography.Title>
                            <Typography.Paragraph className={'!mb-0'}>
                                {t('setting:textProcessing.actorTranslationDescription')}
                            </Typography.Paragraph>
                        </div>
                        <div className={'grid gap-4 lg:grid-cols-2'}>
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
                    </div>

                    <div>
                        <div className={'mb-3'}>
                            <Typography.Title level={5} className={'!mb-0.5'}>
                                {t('setting:textProcessing.customTranslationsTitle')}
                            </Typography.Title>
                            <Typography.Paragraph className={'!mb-0'}>
                                {t('setting:textProcessing.customTranslationsDescription')}
                            </Typography.Paragraph>
                        </div>
                        <Form.List name={['text_processing', 'custom_translations']}>
                            {(fields, {add, remove}) => {
                                const dataSource = fields.map((field) => ({
                                    key: field.key,
                                    field,
                                }))

                                return (
                                    <>
                                        <div className={'mb-3 flex items-center justify-between gap-3'}>
                                            <Typography.Text type={'secondary'}>
                                                {t('setting:textProcessing.customTranslationsHint')}
                                            </Typography.Text>
                                            <Button onClick={() => add({source: '', target: ''})}>
                                                {t('setting:textProcessing.customTranslationsAdd')}
                                            </Button>
                                        </div>
                                        <Table
                                            size={'small'}
                                            pagination={false}
                                            scroll={{x: 640}}
                                            dataSource={dataSource}
                                            columns={[
                                                {
                                                    title: t('setting:textProcessing.customTranslationsSource'),
                                                    dataIndex: 'source',
                                                    width: '42%',
                                                    render: (_, record: any) => (
                                                        <Form.Item
                                                            className={'!mb-0'}
                                                            name={[record.field.name, 'source']}
                                                            rules={[{required: true, message: t('setting:textProcessing.customTranslationsSourceRequired')}]}
                                                        >
                                                            <Input/>
                                                        </Form.Item>
                                                    ),
                                                },
                                                {
                                                    title: t('setting:textProcessing.customTranslationsTarget'),
                                                    dataIndex: 'target',
                                                    width: '42%',
                                                    render: (_, record: any) => (
                                                        <Form.Item
                                                            className={'!mb-0'}
                                                            name={[record.field.name, 'target']}
                                                            rules={[{required: true, message: t('setting:textProcessing.customTranslationsTargetRequired')}]}
                                                        >
                                                            <Input/>
                                                        </Form.Item>
                                                    ),
                                                },
                                                {
                                                    title: t('setting:textProcessing.customTranslationsActions'),
                                                    dataIndex: 'actions',
                                                    width: '16%',
                                                    render: (_, record: any) => (
                                                        <Button danger type={'link'} onClick={() => remove(record.field.name)}>
                                                            {t('setting:textProcessing.customTranslationsRemove')}
                                                        </Button>
                                                    ),
                                                },
                                            ]}
                                        />
                                    </>
                                )
                            }}
                        </Form.List>
                    </div>
                </div>
            </SettingSection>
        </SettingPage>
    )
}
