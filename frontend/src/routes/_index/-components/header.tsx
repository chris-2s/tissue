import {Divider, Dropdown, Modal, theme} from "antd";

import {
    ArrowLeftOutlined,
    CodeOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
    LogoutOutlined,
    MenuOutlined,
    TranslationOutlined,
    UserOutlined
} from "@ant-design/icons";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../../models";
import {themes} from "../../../utils/constants";
import React, {useRef, useState} from "react";
import IconButton from "../../../components/IconButton";
import Log from "./log";
import Logo from "../../../assets/logo.png";
import {useResponsive} from "ahooks";
import PinView from "../../../components/PinView";
import {PinMode} from "../../../components/PinView/types.ts";
import {Link, useRouter} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";
import Styles from "./header.module.css";
import {normalizeLocale, type AppLocale} from "../../../i18n/locale";


const {useToken} = theme

interface Props {
    collapsible: boolean
    onCollapse: () => void
}

function Header(props: Props) {

    const responsive = useResponsive()
    const {history} = useRouter()
    const {t, i18n} = useTranslation(['auth', 'log', 'common'])

    const {token} = useToken()
    const isGoodBoy = useSelector((state: RootState) => state.app.goodBoy)
    const canBack = useSelector((state: RootState) => state.app?.canBack)
    const pin = useSelector((state: RootState) => state.app?.pin)
    const appDispatch = useDispatch<Dispatch>().app
    const {userInfo} = useSelector((state: RootState) => state.auth)
    const authDispatch = useDispatch<Dispatch>().auth
    const [logOpen, setLogOpen] = useState(false)
    const [pinVisible, setPinVisible] = useState(false)
    const [themeDropdownOpen, setThemeDropdownOpen] = useState(false)
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const suppressThemeReopenRef = useRef(false)
    const suppressUserReopenRef = useRef(false)

    const themeMode = useSelector((state: RootState) => state.app?.themeMode)
    const CurrentTheme = themes.find(i => i.name === themeMode) || themes[0]
    const locale = normalizeLocale(i18n.resolvedLanguage)

    function renderThemeIcon(item: typeof CurrentTheme, size: number) {
        if (item.svg) {
            return (
                <span
                    aria-hidden="true"
                    style={{display: 'inline-flex', width: size, height: size}}
                    dangerouslySetInnerHTML={{__html: item.svg}}
                />
            )
        }
        if (item.icon) {
            const Icon = item.icon
            return <Icon style={{fontSize: size}}/>
        }
        return null
    }

    function onGoodBoyChange() {
        appDispatch.setGoodBoy(!isGoodBoy)
    }

    const themeItems = themes.map(i => ({
        key: i.name,
        label: t(i.titleKey),
        icon: renderThemeIcon(i, 16)
    })) as any

    function onThemeClick(event: any) {
        suppressThemeReopenRef.current = true
        setThemeDropdownOpen(false)
        appDispatch.setThemeMode(event.key)
        window.setTimeout(() => {
            suppressThemeReopenRef.current = false
        }, 0)
    }

    const userItems = [
        ...[!responsive.lg && {
            key: 'pin',
            label: t('auth:userMenu.setPin'),
            icon: <LockOutlined/>
        }],
        {
            key: 'language',
            label: t('auth:userMenu.language'),
            icon: <TranslationOutlined/>,
            children: [
                {
                    key: 'zh-CN',
                    label: '中文',
                },
                {
                    key: 'zh-TW',
                    label: '繁體中文',
                },
                {
                    key: 'en-US',
                    label: 'English',
                },
                {
                    key: 'ja-JP',
                    label: '日本語',
                }
            ]
        },
        {
            key: 'log',
            label: t('auth:userMenu.log'),
            icon: <CodeOutlined/>
        },
        {
            key: 'logout',
            label: t('auth:userMenu.logout'),
            icon: <LogoutOutlined/>
        }
    ] as any

    function onUserClick(event: any) {
        suppressUserReopenRef.current = true
        setUserDropdownOpen(false)
        switch (event.key) {
            case 'pin':
                setPinVisible(true)
                break
            case 'zh-CN':
            case 'zh-TW':
            case 'en-US':
            case 'ja-JP':
                void i18n.changeLanguage(event.key as AppLocale)
                break
            case 'log':
                setLogOpen(true)
                break
            case 'logout':
                authDispatch.logout()
                break
        }
        window.setTimeout(() => {
            suppressUserReopenRef.current = false
        }, 0)
    }

    function handleThemeDropdownOpenChange(nextOpen: boolean) {
        if (nextOpen && suppressThemeReopenRef.current) {
            return
        }
        setThemeDropdownOpen(nextOpen)
    }

    function handleUserDropdownOpenChange(nextOpen: boolean) {
        if (nextOpen && suppressUserReopenRef.current) {
            return
        }
        setUserDropdownOpen(nextOpen)
    }

    function renderDropdown(menu: any) {
        return (
            <div style={{
                backgroundColor: token.colorBgElevated,
                borderRadius: token.borderRadiusLG,
                boxShadow: token.boxShadowSecondary,
            }}>
                <div className={'w-36 py-2.5 px-4'}>
                    <div className={'text-base'} style={{color: token.colorText}}>{userInfo.name}</div>
                    <div className={'text-xs'} style={{color: token.colorTextSecondary}}>{userInfo.username}</div>
                </div>
                <Divider style={{margin: 0}}/>
                {menu}
            </div>
        )
    }


    return (
        <div className={Styles.header}>
            <div className={Styles.leading} onClick={() => props.onCollapse?.()}>
                {props.collapsible && (
                    <IconButton size={responsive.md ? 'md' : 'lg'}>
                        <MenuOutlined style={{color: token.colorText, fontSize: token.sizeMD}}/>
                    </IconButton>
                )}
                {!props.collapsible && (
                    (canBack && !responsive.lg) ? (
                        <IconButton size={responsive.md ? 'md' : 'lg'} onClick={() => history.go(-1)}>
                            <ArrowLeftOutlined style={{fontSize: token.sizeLG}}/>
                        </IconButton>
                    ) : (
                        <Link to={'/'}
                              className={Styles.brandLink}>
                            <img
                                className={responsive.lg ? 'ml-4 mr-4 block h-12' : 'mr-1 block h-10'}
                                src={Logo}
                                alt=""
                            />
                        </Link>
                    )
                )}
            </div>
            <div className={Styles.actions}>
                <div
                    className={Styles.actionGroup}
                    style={{gap: responsive.md ? 10 : 8}}
                >
                    <IconButton
                        size={responsive.md ? 'md' : 'lg'}
                        selected={isGoodBoy}
                        onClick={() => onGoodBoyChange()}
                    >
                        {isGoodBoy ? (<EyeInvisibleOutlined style={{fontSize: token.sizeLG}}/>) : (
                            <EyeOutlined style={{fontSize: token.sizeLG}}/>)}
                    </IconButton>
                    <Dropdown
                        arrow
                        trigger={['click']}
                        open={themeDropdownOpen}
                        onOpenChange={handleThemeDropdownOpenChange}
                        menu={{items: themeItems, onClick: onThemeClick}}
                    >
                        <IconButton size={responsive.md ? 'md' : 'lg'} selected={themeDropdownOpen} pressable={false}>
                            {renderThemeIcon(CurrentTheme, token.sizeLG)}
                        </IconButton>
                    </Dropdown>
                    <Dropdown
                        arrow
                        trigger={['click']}
                        open={userDropdownOpen}
                        onOpenChange={handleUserDropdownOpenChange}
                        menu={{items: userItems, onClick: onUserClick, selectedKeys: [locale]}}
                        popupRender={renderDropdown}
                    >
                        <IconButton size={responsive.md ? 'md' : 'lg'} selected={userDropdownOpen || !!pin} pressable={false}>
                            <UserOutlined
                                style={{fontSize: token.sizeLG, color: pin ? token.colorPrimary : undefined}}/>
                        </IconButton>
                    </Dropdown>
                </div>
            </div>
            <Modal title={t('log:title')}
                   open={logOpen}
                   onCancel={() => setLogOpen(false)}
                   footer={null}
                   destroyOnHidden
                   width={responsive.lg ? 1000 : 'calc(100vw - 16px)'}
                   style={responsive.lg ? undefined : {
                       top: 'max(12px, env(safe-area-inset-top))',
                   }}
                   styles={{
                       body: {
                           display: 'flex',
                           flexDirection: 'column',
                           padding: responsive.lg ? 24 : 12,
                           height: responsive.lg
                               ? '80vh'
                               : 'calc(100dvh - max(12px, env(safe-area-inset-top)) - max(12px, env(safe-area-inset-bottom)) - 72px)',
                           paddingBottom: responsive.lg ? 24 : 'max(12px, env(safe-area-inset-bottom))',
                           overflow: 'hidden',
                       }
                   }}
                   centered={responsive.lg}
            >
                <Log/>
            </Modal>
            {pinVisible && (
                <PinView pin={pin} onClose={() => setPinVisible(false)} mode={PinMode.setting}/>
            )}
        </div>
    )
}

export default Header
