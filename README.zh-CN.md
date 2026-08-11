<div align="center">
  <h1>Arco Design Pro</h1>
</div>

<div align="center">

基于 [Arco Design](https://arco.design/) Vue 组件库的开箱即用的中后台前端解决方案。

Admin 中后台管理页面，创新的多架构方案。

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/arco-design/arco-design-pro/blob/main/LICENSE)

</div>


<div align="center">

[English](./README.md) | 简体中文

</div>

![f769c408-adf4-4a85-b4a5-cc0d7e7f29ef](https://user-images.githubusercontent.com/19399269/148364725-b7a36383-04a9-4d67-87a4-91e970d0d083.gif)

## ✨ Features

- **TypeScript**  -  代码完全使用 TypeScript 书写。
- **Vue3** - 面向未来，拥抱 Vue3。
- **Pinia** - 紧跟潮流，美味可口。
- **Arco Design**  -  由 [ArcoDesign Vue](https://github.com/arco-design/arco-design-vue) 组件库强力驱动。
- **Templates** - 16+ 页面模版，覆盖表格、列表、表单、工作台、可视化等场景。
- **Themes** - 基于「[风格配置平台](https://arco.design/themes)」丰富的主题市场，让你的项目千变万化。
- **Dark Theme**  -  一键丝滑切换暗黑风格。
- **Mock**  -  内置 api 模拟方案，代码即注释，更加仿真线上环境。
- **I18n** - 内置国际化多语言解决方案。
- **Config** - 灵活配置页面配色、布局等。


## 🌈 Usage

```bash
$ npm i arco-cli@latest yarn -g

$ arco init my-project
```

## 环境配置

母模板只通过 `arco-design-pro-vite/.env.example` 声明环境变量，不分发实际的开发或生产配置。生成后的项目可以自行提交 `.env.development`、`.env.production` 或 `.env.staging`；开发者和部署机器的私有覆盖应写入被 `*.local` 规则忽略的 `.env.*.local`。

| 文件或来源               | 所有者           | 是否提交 |
| ------------------------ | ---------------- | -------- |
| `.env.example`           | 母模板           | 是       |
| `.env.development`       | 下游项目         | 可提交   |
| `.env.production`        | 下游项目         | 可提交   |
| `.env.staging`           | 有需要的下游项目 | 可提交   |
| `.env.*.local`           | 开发者或部署机器 | 否       |
| GitHub Actions Variables | 对应下游部署环境 | 否       |

`.env.example` 不会被 Vite 自动加载。所有 `VITE_*` 变量都会进入浏览器产物，不得用于服务端密钥。`VITE_API_BASE_URL` 未设置时默认使用 `/api`；`VITE_QQ_MAP_KEY` 是浏览器端凭据，应由各部署项目分别配置域名白名单、最小接口权限、额度和告警。Actions 进程环境变量可覆盖下游 `.env.production` 中的公共默认值。

## 🔗 Link

- [Arco Design Pro 官网](https://pro.arco.design)
- [预览](https://vue-pro.arco.design)

## 💎 Changelog

- [中文版](https://github.com/arco-design/arco-design-pro-vue/blob/main/docs/changelog.zh-CN.md)

- [英文版](https://github.com/arco-design/arco-design-pro-vue/blob/main/docs/changelog.md)

## LICENSE

[MIT](./LICENSE) © [ArcoDesign](https://arco.design)
