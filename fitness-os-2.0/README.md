# FITNESS OS 2.0

当前工作副本：**PHASE 1.1 Premium Visual Redesign**。[视觉报告](docs/PHASE1_1_VISUAL_REPORT.md) · [素材来源](docs/VISUAL_ASSETS.md) · [动效规范](docs/MOTION_DESIGN.md)。保留43模块、PWA与全部原始需求；本分支是用户授权保存的完整PHASE 1.1交付版本。

交付分支：`delivery/fitness-os-phase1-1`。入口：[七组前后截图](delivery/phase1-1/SCREENSHOTS.md) · [Windows/手机运行](docs/WINDOWS_LOCAL_RUN.md) · [发布说明](delivery/phase1-1/PUBLISH_NOTES.md)。main和原有报告保留不变。

响应式运动与营养产品的 PHASE 1 工程：原创 Dashboard、完整模块入口、深浅主题和基础 PWA。业务数据、认证、云同步和真实设备尚未接入。

## 开发环境

- 工作目录：`/workspace/fitness-os-2.0`。
- Node.js 24（本次环境24.19.0），pnpm 11.25.0；版本固定于 `.node-version` 和 `package.json`。
- GitHub仓库：`123kai453/gpt`；本子项目位于仓库的 `fitness-os-2.0/`。请clone `delivery/fitness-os-phase1-1`，而不是main；原Cloud副本未配置remote的记录属于历史状态。
- 原 `/workspace/gpt` 项目不作为本项目代码目录，不修改其文件或分支。不需要创建 worktree。

## 安装与启动

在项目根目录执行：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

开发服务器监听3000端口；通过当前Cloud支持的端口访问方式使用。本文不把本机回环地址当作用户可访问的公开预览链接。

生产模式在同一目录运行：

```sh
pnpm build
pnpm start
```

本阶段没有正式生产部署。构建显式使用Next.js webpack模式，构建worker限制为2，避免在云环境过量并行。尚未验证的其他构建器不作为当前验收依据。

## 检查命令

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:docs
pnpm build
pnpm test:e2e
```

E2E使用生产构建，运行前先执行 `pnpm build`。Playwright可启动生产服务器；若已由本项目启动3000端口则复用。默认使用当前机器的 `/usr/bin/chromium`（存在时），也可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指向已安装的兼容浏览器。无浏览器时需先通过受支持方式准备Playwright Chromium。测试生成的截图、trace和HTML报告位于被Git忽略的测试输出目录。

pnpm需要能访问依赖存储；若Cloud沙箱提示其SQLite store无写权限，应使用平台批准的执行权限，而不是修改系统权限或关闭依赖/TLS验证。

## 当前能力与边界

- Dashboard使用真实空状态，没有编造训练、心率、体重、热量或AI分析。
- 产品导航覆盖运动、营养、AI、数据、设备、导入、社区和管理模块；后续业务页面显示所属PHASE及尚未开放的状态。
- 默认深色，浅色可选；主题保存在当前浏览器，不是账户云同步。
- PWA在生产模式和安全上下文启用。开发模式不注册离线缓存。
- Service Worker只缓存公开静态资源和通用离线外壳，不缓存页面、健康数据或鉴权API。
- 离线刷新显示通用外壳，不等于已实现离线业务记录。更新由用户确认后激活。
- 安装入口按浏览器实际能力显示；iPhone Safari、真实安装和原生设备仍需真机验证。
- 无需填写API Key即可运行PHASE 1。没有数据库迁移、收费API、真实设备、GPS或复杂3D实现。

## 文档与路线

正式采用 PHASE 0–10。原17份文件未经修改的档案位于 `documentation-originals/`，原始hash见 `DOCUMENT_MANIFEST.json`。`docs/`是允许更新的工作副本；需求不因本阶段缩减。

- [原始文档索引](docs/INDEX.md)
- [正式项目决策](docs/PROJECT_DECISIONS.md)
- [PHASE 1.1交付时实施记录](delivery/phase1-1/PHASE1_IMPLEMENTATION_REPORT.md)
- [逐项功能状态](FEATURES.md)
- [状态摘要](FEATURES_STATUS.md)
- [测试报告](TEST_REPORT.md)
- [变更记录](CHANGELOG.md)
- [PHASE 0报告](PHASE_0_TECHNICAL_REPORT.md)
- [需求覆盖表](REQUIREMENTS_COVERAGE.md)

完成PHASE 1后停止，等待用户验收；不自动开始PHASE 2。

## 更新发布约定

每次交付新版前更新 `public/sw.js` 的 `VERSION`，随后重新build和验证。Service Worker字节不变时，浏览器不会仅因为应用代码变化就触发等待更新提示。新版本等待用户确认，避免未经同意刷新当前页面。

当前Cloud工具未提供可验证的公网预览/端口发布入口；3000监听与内部HTTP检查通过不代表用户浏览器已经能直接访问。没有生产部署或临时公网隧道。

本分支包含PHASE 1.1完整源码、30个本地摄影变体及21张前/后/对比图。推送GitHub是源码版本保存，不是网站部署；当前没有已验证的公网预览。历史报告中的“未推送”描述为验收时点记录，以本说明及PUBLISH_NOTES为准。
