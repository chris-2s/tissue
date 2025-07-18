/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteRouteImport } from './routes/_index/route'
import { Route as LoginIndexRouteImport } from './routes/login/index'
import { Route as IndexIndexRouteImport } from './routes/_index/index'
import { Route as IndexSettingRouteRouteImport } from './routes/_index/setting/route'
import { Route as IndexVideoIndexRouteImport } from './routes/_index/video/index'
import { Route as IndexUserIndexRouteImport } from './routes/_index/user/index'
import { Route as IndexSubscribeIndexRouteImport } from './routes/_index/subscribe/index'
import { Route as IndexSettingIndexRouteImport } from './routes/_index/setting/index'
import { Route as IndexSearchIndexRouteImport } from './routes/_index/search/index'
import { Route as IndexScheduleIndexRouteImport } from './routes/_index/schedule/index'
import { Route as IndexMenuIndexRouteImport } from './routes/_index/menu/index'
import { Route as IndexHomeIndexRouteImport } from './routes/_index/home/index'
import { Route as IndexHistoryIndexRouteImport } from './routes/_index/history/index'
import { Route as IndexFileIndexRouteImport } from './routes/_index/file/index'
import { Route as IndexDownloadIndexRouteImport } from './routes/_index/download/index'
import { Route as IndexAboutIndexRouteImport } from './routes/_index/about/index'
import { Route as IndexSettingNotifyRouteImport } from './routes/_index/setting/notify'
import { Route as IndexSettingFileRouteImport } from './routes/_index/setting/file'
import { Route as IndexSettingDownloadRouteImport } from './routes/_index/setting/download'
import { Route as IndexSettingAppRouteImport } from './routes/_index/setting/app'
import { Route as IndexHomeDetailRouteImport } from './routes/_index/home/detail'

const IndexRouteRoute = IndexRouteRouteImport.update({
  id: '/_index',
  getParentRoute: () => rootRouteImport,
} as any)
const LoginIndexRoute = LoginIndexRouteImport.update({
  id: '/login/',
  path: '/login/',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexIndexRoute = IndexIndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexSettingRouteRoute = IndexSettingRouteRouteImport.update({
  id: '/setting',
  path: '/setting',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexVideoIndexRoute = IndexVideoIndexRouteImport.update({
  id: '/video/',
  path: '/video/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexUserIndexRoute = IndexUserIndexRouteImport.update({
  id: '/user/',
  path: '/user/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexSubscribeIndexRoute = IndexSubscribeIndexRouteImport.update({
  id: '/subscribe/',
  path: '/subscribe/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexSettingIndexRoute = IndexSettingIndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => IndexSettingRouteRoute,
} as any)
const IndexSearchIndexRoute = IndexSearchIndexRouteImport.update({
  id: '/search/',
  path: '/search/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexScheduleIndexRoute = IndexScheduleIndexRouteImport.update({
  id: '/schedule/',
  path: '/schedule/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexMenuIndexRoute = IndexMenuIndexRouteImport.update({
  id: '/menu/',
  path: '/menu/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexHomeIndexRoute = IndexHomeIndexRouteImport.update({
  id: '/home/',
  path: '/home/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexHistoryIndexRoute = IndexHistoryIndexRouteImport.update({
  id: '/history/',
  path: '/history/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexFileIndexRoute = IndexFileIndexRouteImport.update({
  id: '/file/',
  path: '/file/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexDownloadIndexRoute = IndexDownloadIndexRouteImport.update({
  id: '/download/',
  path: '/download/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexAboutIndexRoute = IndexAboutIndexRouteImport.update({
  id: '/about/',
  path: '/about/',
  getParentRoute: () => IndexRouteRoute,
} as any)
const IndexSettingNotifyRoute = IndexSettingNotifyRouteImport.update({
  id: '/notify',
  path: '/notify',
  getParentRoute: () => IndexSettingRouteRoute,
} as any)
const IndexSettingFileRoute = IndexSettingFileRouteImport.update({
  id: '/file',
  path: '/file',
  getParentRoute: () => IndexSettingRouteRoute,
} as any)
const IndexSettingDownloadRoute = IndexSettingDownloadRouteImport.update({
  id: '/download',
  path: '/download',
  getParentRoute: () => IndexSettingRouteRoute,
} as any)
const IndexSettingAppRoute = IndexSettingAppRouteImport.update({
  id: '/app',
  path: '/app',
  getParentRoute: () => IndexSettingRouteRoute,
} as any)
const IndexHomeDetailRoute = IndexHomeDetailRouteImport.update({
  id: '/home/detail',
  path: '/home/detail',
  getParentRoute: () => IndexRouteRoute,
} as any)

export interface FileRoutesByFullPath {
  '/setting': typeof IndexSettingRouteRouteWithChildren
  '/': typeof IndexIndexRoute
  '/login': typeof LoginIndexRoute
  '/home/detail': typeof IndexHomeDetailRoute
  '/setting/app': typeof IndexSettingAppRoute
  '/setting/download': typeof IndexSettingDownloadRoute
  '/setting/file': typeof IndexSettingFileRoute
  '/setting/notify': typeof IndexSettingNotifyRoute
  '/about': typeof IndexAboutIndexRoute
  '/download': typeof IndexDownloadIndexRoute
  '/file': typeof IndexFileIndexRoute
  '/history': typeof IndexHistoryIndexRoute
  '/home': typeof IndexHomeIndexRoute
  '/menu': typeof IndexMenuIndexRoute
  '/schedule': typeof IndexScheduleIndexRoute
  '/search': typeof IndexSearchIndexRoute
  '/setting/': typeof IndexSettingIndexRoute
  '/subscribe': typeof IndexSubscribeIndexRoute
  '/user': typeof IndexUserIndexRoute
  '/video': typeof IndexVideoIndexRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexIndexRoute
  '/login': typeof LoginIndexRoute
  '/home/detail': typeof IndexHomeDetailRoute
  '/setting/app': typeof IndexSettingAppRoute
  '/setting/download': typeof IndexSettingDownloadRoute
  '/setting/file': typeof IndexSettingFileRoute
  '/setting/notify': typeof IndexSettingNotifyRoute
  '/about': typeof IndexAboutIndexRoute
  '/download': typeof IndexDownloadIndexRoute
  '/file': typeof IndexFileIndexRoute
  '/history': typeof IndexHistoryIndexRoute
  '/home': typeof IndexHomeIndexRoute
  '/menu': typeof IndexMenuIndexRoute
  '/schedule': typeof IndexScheduleIndexRoute
  '/search': typeof IndexSearchIndexRoute
  '/setting': typeof IndexSettingIndexRoute
  '/subscribe': typeof IndexSubscribeIndexRoute
  '/user': typeof IndexUserIndexRoute
  '/video': typeof IndexVideoIndexRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/_index': typeof IndexRouteRouteWithChildren
  '/_index/setting': typeof IndexSettingRouteRouteWithChildren
  '/_index/': typeof IndexIndexRoute
  '/login/': typeof LoginIndexRoute
  '/_index/home/detail': typeof IndexHomeDetailRoute
  '/_index/setting/app': typeof IndexSettingAppRoute
  '/_index/setting/download': typeof IndexSettingDownloadRoute
  '/_index/setting/file': typeof IndexSettingFileRoute
  '/_index/setting/notify': typeof IndexSettingNotifyRoute
  '/_index/about/': typeof IndexAboutIndexRoute
  '/_index/download/': typeof IndexDownloadIndexRoute
  '/_index/file/': typeof IndexFileIndexRoute
  '/_index/history/': typeof IndexHistoryIndexRoute
  '/_index/home/': typeof IndexHomeIndexRoute
  '/_index/menu/': typeof IndexMenuIndexRoute
  '/_index/schedule/': typeof IndexScheduleIndexRoute
  '/_index/search/': typeof IndexSearchIndexRoute
  '/_index/setting/': typeof IndexSettingIndexRoute
  '/_index/subscribe/': typeof IndexSubscribeIndexRoute
  '/_index/user/': typeof IndexUserIndexRoute
  '/_index/video/': typeof IndexVideoIndexRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/setting'
    | '/'
    | '/login'
    | '/home/detail'
    | '/setting/app'
    | '/setting/download'
    | '/setting/file'
    | '/setting/notify'
    | '/about'
    | '/download'
    | '/file'
    | '/history'
    | '/home'
    | '/menu'
    | '/schedule'
    | '/search'
    | '/setting/'
    | '/subscribe'
    | '/user'
    | '/video'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/login'
    | '/home/detail'
    | '/setting/app'
    | '/setting/download'
    | '/setting/file'
    | '/setting/notify'
    | '/about'
    | '/download'
    | '/file'
    | '/history'
    | '/home'
    | '/menu'
    | '/schedule'
    | '/search'
    | '/setting'
    | '/subscribe'
    | '/user'
    | '/video'
  id:
    | '__root__'
    | '/_index'
    | '/_index/setting'
    | '/_index/'
    | '/login/'
    | '/_index/home/detail'
    | '/_index/setting/app'
    | '/_index/setting/download'
    | '/_index/setting/file'
    | '/_index/setting/notify'
    | '/_index/about/'
    | '/_index/download/'
    | '/_index/file/'
    | '/_index/history/'
    | '/_index/home/'
    | '/_index/menu/'
    | '/_index/schedule/'
    | '/_index/search/'
    | '/_index/setting/'
    | '/_index/subscribe/'
    | '/_index/user/'
    | '/_index/video/'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRouteRoute: typeof IndexRouteRouteWithChildren
  LoginIndexRoute: typeof LoginIndexRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_index': {
      id: '/_index'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof IndexRouteRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/login/': {
      id: '/login/'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_index/': {
      id: '/_index/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/setting': {
      id: '/_index/setting'
      path: '/setting'
      fullPath: '/setting'
      preLoaderRoute: typeof IndexSettingRouteRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/video/': {
      id: '/_index/video/'
      path: '/video'
      fullPath: '/video'
      preLoaderRoute: typeof IndexVideoIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/user/': {
      id: '/_index/user/'
      path: '/user'
      fullPath: '/user'
      preLoaderRoute: typeof IndexUserIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/subscribe/': {
      id: '/_index/subscribe/'
      path: '/subscribe'
      fullPath: '/subscribe'
      preLoaderRoute: typeof IndexSubscribeIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/setting/': {
      id: '/_index/setting/'
      path: '/'
      fullPath: '/setting/'
      preLoaderRoute: typeof IndexSettingIndexRouteImport
      parentRoute: typeof IndexSettingRouteRoute
    }
    '/_index/search/': {
      id: '/_index/search/'
      path: '/search'
      fullPath: '/search'
      preLoaderRoute: typeof IndexSearchIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/schedule/': {
      id: '/_index/schedule/'
      path: '/schedule'
      fullPath: '/schedule'
      preLoaderRoute: typeof IndexScheduleIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/menu/': {
      id: '/_index/menu/'
      path: '/menu'
      fullPath: '/menu'
      preLoaderRoute: typeof IndexMenuIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/home/': {
      id: '/_index/home/'
      path: '/home'
      fullPath: '/home'
      preLoaderRoute: typeof IndexHomeIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/history/': {
      id: '/_index/history/'
      path: '/history'
      fullPath: '/history'
      preLoaderRoute: typeof IndexHistoryIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/file/': {
      id: '/_index/file/'
      path: '/file'
      fullPath: '/file'
      preLoaderRoute: typeof IndexFileIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/download/': {
      id: '/_index/download/'
      path: '/download'
      fullPath: '/download'
      preLoaderRoute: typeof IndexDownloadIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/about/': {
      id: '/_index/about/'
      path: '/about'
      fullPath: '/about'
      preLoaderRoute: typeof IndexAboutIndexRouteImport
      parentRoute: typeof IndexRouteRoute
    }
    '/_index/setting/notify': {
      id: '/_index/setting/notify'
      path: '/notify'
      fullPath: '/setting/notify'
      preLoaderRoute: typeof IndexSettingNotifyRouteImport
      parentRoute: typeof IndexSettingRouteRoute
    }
    '/_index/setting/file': {
      id: '/_index/setting/file'
      path: '/file'
      fullPath: '/setting/file'
      preLoaderRoute: typeof IndexSettingFileRouteImport
      parentRoute: typeof IndexSettingRouteRoute
    }
    '/_index/setting/download': {
      id: '/_index/setting/download'
      path: '/download'
      fullPath: '/setting/download'
      preLoaderRoute: typeof IndexSettingDownloadRouteImport
      parentRoute: typeof IndexSettingRouteRoute
    }
    '/_index/setting/app': {
      id: '/_index/setting/app'
      path: '/app'
      fullPath: '/setting/app'
      preLoaderRoute: typeof IndexSettingAppRouteImport
      parentRoute: typeof IndexSettingRouteRoute
    }
    '/_index/home/detail': {
      id: '/_index/home/detail'
      path: '/home/detail'
      fullPath: '/home/detail'
      preLoaderRoute: typeof IndexHomeDetailRouteImport
      parentRoute: typeof IndexRouteRoute
    }
  }
}

interface IndexSettingRouteRouteChildren {
  IndexSettingAppRoute: typeof IndexSettingAppRoute
  IndexSettingDownloadRoute: typeof IndexSettingDownloadRoute
  IndexSettingFileRoute: typeof IndexSettingFileRoute
  IndexSettingNotifyRoute: typeof IndexSettingNotifyRoute
  IndexSettingIndexRoute: typeof IndexSettingIndexRoute
}

const IndexSettingRouteRouteChildren: IndexSettingRouteRouteChildren = {
  IndexSettingAppRoute: IndexSettingAppRoute,
  IndexSettingDownloadRoute: IndexSettingDownloadRoute,
  IndexSettingFileRoute: IndexSettingFileRoute,
  IndexSettingNotifyRoute: IndexSettingNotifyRoute,
  IndexSettingIndexRoute: IndexSettingIndexRoute,
}

const IndexSettingRouteRouteWithChildren =
  IndexSettingRouteRoute._addFileChildren(IndexSettingRouteRouteChildren)

interface IndexRouteRouteChildren {
  IndexSettingRouteRoute: typeof IndexSettingRouteRouteWithChildren
  IndexIndexRoute: typeof IndexIndexRoute
  IndexHomeDetailRoute: typeof IndexHomeDetailRoute
  IndexAboutIndexRoute: typeof IndexAboutIndexRoute
  IndexDownloadIndexRoute: typeof IndexDownloadIndexRoute
  IndexFileIndexRoute: typeof IndexFileIndexRoute
  IndexHistoryIndexRoute: typeof IndexHistoryIndexRoute
  IndexHomeIndexRoute: typeof IndexHomeIndexRoute
  IndexMenuIndexRoute: typeof IndexMenuIndexRoute
  IndexScheduleIndexRoute: typeof IndexScheduleIndexRoute
  IndexSearchIndexRoute: typeof IndexSearchIndexRoute
  IndexSubscribeIndexRoute: typeof IndexSubscribeIndexRoute
  IndexUserIndexRoute: typeof IndexUserIndexRoute
  IndexVideoIndexRoute: typeof IndexVideoIndexRoute
}

const IndexRouteRouteChildren: IndexRouteRouteChildren = {
  IndexSettingRouteRoute: IndexSettingRouteRouteWithChildren,
  IndexIndexRoute: IndexIndexRoute,
  IndexHomeDetailRoute: IndexHomeDetailRoute,
  IndexAboutIndexRoute: IndexAboutIndexRoute,
  IndexDownloadIndexRoute: IndexDownloadIndexRoute,
  IndexFileIndexRoute: IndexFileIndexRoute,
  IndexHistoryIndexRoute: IndexHistoryIndexRoute,
  IndexHomeIndexRoute: IndexHomeIndexRoute,
  IndexMenuIndexRoute: IndexMenuIndexRoute,
  IndexScheduleIndexRoute: IndexScheduleIndexRoute,
  IndexSearchIndexRoute: IndexSearchIndexRoute,
  IndexSubscribeIndexRoute: IndexSubscribeIndexRoute,
  IndexUserIndexRoute: IndexUserIndexRoute,
  IndexVideoIndexRoute: IndexVideoIndexRoute,
}

const IndexRouteRouteWithChildren = IndexRouteRoute._addFileChildren(
  IndexRouteRouteChildren,
)

const rootRouteChildren: RootRouteChildren = {
  IndexRouteRoute: IndexRouteRouteWithChildren,
  LoginIndexRoute: LoginIndexRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
