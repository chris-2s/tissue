import Logo from "../../../assets/logo.png";
import {Card, Space, Tag} from "antd";
import {useResponsive} from "ahooks";
import {useSelector} from "react-redux";
import {RootState} from "../../../models";
import {DockerOutlined, GithubOutlined} from "@ant-design/icons";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

export const Route = createFileRoute('/_index/about/')({
    component: About
})

function About() {

    const {t} = useTranslation(['about'])
    const responsive = useResponsive()
    const {versions} = useSelector((state: RootState) => state.auth)


    return (
        <Card>
            <div className="flex flex-col justify-center items-center">
                <img className={'h-20'} src={Logo} alt=""/>
                <div>
                    <span>{t('about:currentVersion', {version: versions?.current ?? '-'})}</span>
                    {versions?.hasNew && (
                        <Tag className={'ml-2'} color={'red'}>{t('about:newVersion', {version: versions?.latest})}</Tag>
                    )}
                </div>
                <Space size={"large"} className={'text-4xl mt-4'}>
                    <div className={'cursor-pointer'} onClick={() => window.open('https://github.com/chris-2s/tissue')}>
                        <GithubOutlined/></div>
                    <div className={'cursor-pointer'}
                         onClick={() => window.open('https://hub.docker.com/r/chris2s/tissue')}><DockerOutlined/></div>
                </Space>
                {responsive.md ? (
                    <Space align={"center"} wrap={true} className={'mt-4'}>
                        <img src="https://img.shields.io/github/license/chris-2s/tissue" alt=""/>
                        <img src="https://img.shields.io/docker/v/chris2s/tissue/latest" alt=""/>
                        <img src="https://img.shields.io/docker/image-size/chris2s/tissue/latest" alt=""/>
                        <img src="https://img.shields.io/github/actions/workflow/status/chris-2s/tissue/build.yml"
                             alt=""/>
                    </Space>
                ) : (
                    <>
                        <Space align={"center"} wrap={true} className={'mt-4'}>
                            <img src="https://img.shields.io/github/license/chris-2s/tissue" alt=""/>
                            <img src="https://img.shields.io/docker/v/chris2s/tissue" alt=""/>
                        </Space>
                        <Space align={"center"} wrap={true} className={'mt-2'}>
                            <img src="https://img.shields.io/docker/image-size/chris2s/tissue" alt=""/>
                            <img src="https://img.shields.io/github/actions/workflow/status/chris-2s/tissue/build.yml"
                                 alt=""/>
                        </Space>
                    </>
                )}
                <div className={'text-center mt-4'}>
                    {t('about:description')}
                </div>
                <div className={'text-center mt-4'}>
                    {t('about:copyright')}
                </div>
                <div className={'text-center mt-4'}>
                    {t('about:disclaimer')}
                </div>
            </div>
        </Card>
    )
}
