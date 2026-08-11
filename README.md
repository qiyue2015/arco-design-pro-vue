<div align="center">
  <h1>Arco Design Pro</h1>
</div>

<div align="center">

An out-of-the-box solution to quickly build enterprise-level applications based on [Arco Design](https://arco.design/).

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/arco-design/arco-design-pro/blob/main/LICENSE)

</div>

<div align="center">

English | [简体中文](./README.zh-CN.md)

</div>

![f769c408-adf4-4a85-b4a5-cc0d7e7f29ef](https://user-images.githubusercontent.com/19399269/148364725-b7a36383-04a9-4d67-87a4-91e970d0d083.gif)

## ✨ Features

- **TypeScript** - The code is completely written in TypeScript.
- **Vue3** - Look to the future and embrace Vue3.
- **Pinia** - It's trendy and delicious.
- **Arco Design** - Powered by [ArcoDesign Vue](https://github.com/arco-design/arco-design-vue) component library.
- **Templates** - 16+ page templates, covering tables, lists, forms, dashboard, visualization and other scenes.
- **Themes** - Based on the rich theme market of [DesignLab](https://arco.design/themes), make your projects ever-changing.
- **Dark Theme** - Switch to dark theme with one click.
- **Mock** - Built-in API simulation scheme, code as comments, more simulation of the online environment.
- **I18n** - Built-in internationalized multi-language solution.
- **Config** - Flexible configuration of page color, layout, etc.

## 🌈 Usage

```bash
$ npm i arco-cli@latest pnpm -g

$ arco init my-project
```

## Environment configuration

The source template only declares environment variables in `arco-design-pro-vite/.env.example`; it does not distribute development or production settings. Generated projects may commit their own `.env.development`, `.env.production`, or `.env.staging` files. Developer- and machine-specific overrides belong in `.env.*.local`, which is ignored by the existing `*.local` rule.

| File or source           | Owner                             | Commit   |
| ------------------------ | --------------------------------- | -------- |
| `.env.example`           | Source template                   | Yes      |
| `.env.development`       | Downstream project                | Optional |
| `.env.production`        | Downstream project                | Optional |
| `.env.staging`           | Downstream project when needed    | Optional |
| `.env.*.local`           | Developer or deployment host      | No       |
| GitHub Actions Variables | Downstream deployment environment | No       |

Vite does not load `.env.example` automatically. Every `VITE_*` variable is included in browser assets and must not contain server-side secrets. `VITE_API_BASE_URL` falls back to `/api` when unset. `VITE_QQ_MAP_KEY` is a browser credential, so each deployment must use its own domain restrictions, minimum API permissions, quotas, and alerts. Process environment variables supplied by Actions override public defaults in a downstream `.env.production` file.

## 🔗 Link

- [Arco Design Pro](https://pro.arco.design)
- [Preview](https://vue-pro.arco.design)

## 💎 Changelog

- [Chinese Version](https://github.com/arco-design/arco-design-pro-vue/blob/main/docs/changelog.zh-CN.md)

- [English Version](https://github.com/arco-design/arco-design-pro-vue/blob/main/docs/changelog.md)

## LICENSE

[MIT](./LICENSE) © [ArcoDesign](https://arco.design)
