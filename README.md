# 北交大课程平台青春版

[![Vue3](https://img.shields.io/badge/Vue3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

基于官方接口重构的课程平台，适配移动端，聚合常用功能。

**在线地址：** [course.bjtu.top](https://course.bjtu.top/)（建议校园内网/ IPv6 访问）

## 功能特性

### 移动端适配 + 功能聚合

手机保存本站即可随时查看，今日课表、待交作业一目了然。

- 汇总所有科目待完成的作业，支持快捷查看和提交
- 截止倒计时
- 按课程分类筛选作业

### 作业提交增强

针对原平台多附件需逐个上传的痛点：

- 支持拖拽上传、多文件批量上传
- 覆盖提交（需老师开启权限）
- 过期补交（需老师开启权限）

![手机端作业提交界面，展示拖拽上传和倒计时功能](./docs/手机端UI.webp)

### 自动登录与会话保持

本地安全存储账号信息，打开网站自动登录，免去先登录 MIS 再跳转的步骤。会话过期可一键刷新。

### 资源浏览增强

原平台每次只能预览一个课件，切换不便。本功能将教案等资源集中放置，支持快速切换浏览。

提供 PDF.js 高阶特性：文档大纲、高亮标注、文字搜索、全屏放映等。

![资源浏览界面，展示课件切换和 PDF 阅读功能](./docs/资源浏览.webp)

### 课程回放

原平台视频回放功能简陋，且移动端体验不佳。本平台提供了更友好的回放体验。

![课程回放界面，展示视频播放器和课程列表](./docs/回放页.webp)

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。

> 本项目为教学研究项目，请勿恶意攻击官方服务器。开发者不对滥用行为负责。

## 致谢

感谢 上条当咩 提供的子域名、证书和服务器支持。
