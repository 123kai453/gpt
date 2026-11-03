# PHASE 1.1 — PREMIUM VISUAL REDESIGN 实施报告

日期：2026-11-03（Asia/Shanghai）。本次已实际修改工程、运行测试并交付七组前后对比，停留PHASE 1.1；未进入PHASE 2，未提交/推送或覆盖远端main。

## 1. 工程保护与版本边界

项目仍位于 `/workspace/fitness-os-2.0`，没有重新创建业务工程。当前本地main尚无HEAD、文件未提交；检查了实际工作目录、Git状态、此前交付文件与测试。原PHASE 1交付克隆的暂存树未改变；源码备份及逐文件hash位于 `/workspace/fitness-os-backups/phase1-before-visual/`。保留七张原截图。

17份原始文档SHA-256全通过；工作需求未删减。首页与43模块路由、主题、PWA、真实空状态均保留。旧gpt工作区干净；未执行reset、clean、force-push或main写入。原PHASE 1待确认分支仍是旧版快照，本次新视觉尚未纳入它；后续推送需单独准备新视觉版本。

## 2. 已完成的视觉修改

- 全新人物Hero：原创匿名女性运动员，半身近景、冷色轮廓光，桌面人物右置约半幅，中文标题与留白位于左侧；人物不与主要文案争抢空间。
- 手机独立构图：另设753×941及390×487裁图，完整面部在上，标题和CTA在下。安装入口移到顶栏，避免遮挡“查看训练”。
- 固定中文主标语“突破极限，持续进化。”、英文“PUSH BEYOND. EVOLVE EVERY DAY.”，刷新不随机变化。辅助文案“记录训练，理解身体，持续进步。”，仅在少量区域使用其他口号。
- 黑/石墨/冷白底色，电光蓝为主要交互色，少量荧光绿用于Hero按钮；保留浅色模式，Hero在浅色外框内保留摄影所需的暗色对比。
- 11类运动分别使用独立场景：力量、游泳、跑步、跑步机、单车、徒步、椭圆机、划船机、跳绳、登山机、其他（瑜伽）。没有用同一张照片替代所有运动。
- 共享EditorialImage、SportCard、SectionVisual；升级运动/力量/游泳/营养/AI/身体/设备/社区/个人偏好等页面。AI、身体和设备的空间球体/轨道是装饰，不是实测图表或已连接状态。
- 统一字号、边距、卡片、按钮、图标与品牌波形标识，更新Manifest/离线外壳的配色；没有制造假训练、心率、卡路里、AI结果或设备数据。

## 3. 图片文件、来源与权利记录

本地目录：public/images/hero、sports、training、swimming、nutrition。共30个WebP变体，总计1,036,722字节（约1.04 MB）；不是首屏必须全部下载。桌面Hero50,680字节、主手机Hero54,664字节；手机另有更小变体。无运行时外部图片URL。

图片来源均为本对话内置图像生成：1张人物主视觉、3张四场景底稿，另对单车底稿做1次去除伪文字的清理。每个运动场景导出独立文件并提供480px变体。它们是原创虚构人物/食物，不是真实职业运动员摄影或代言；未使用明星照片、Nike/Adidas广告及商标。参考女性运动员原图没有出现在本次可读取附件中，依据用户文字说明设计构图，没有声称看过未提供原图。

免费图库及许可页访问受当前网络403限制，未使用无法核实许可的第三方实拍。没有购买图库会员、图像API额度或开通第三方图像服务；应用和脚本没有接入收费图像生成API或使用用户图像Key。本会话内置工具本身的订阅/计量信息不可从环境读取，不把整个平台称为零费用。生成素材不保证所有地区排他版权，也不伪造授权证明。

每张文件的来源底稿ID、使用位置、尺寸、格式、大小和hash：见 `VISUAL_ASSETS.md` 与 `VISUAL_ASSETS.json`。原创应用图标另记在brand_assets，不计入30张摄影变体。

图片交付：native picture/srcset独立手机构图，首屏eager/high优先级，下方lazy，固定尺寸框架，WebP压缩。图片失败可读回退；修复了SSR图片在React接管前已失败而丢失onError的情况，新增DOM状态协调，故障注入后导航仍可用。

## 4. 动效实现与降级

- Hero指针视差约±6px/±4px，滚动最多32px，spring平滑；不逐帧更新React state。
- 标题分两层进入约700ms，错开110ms；英文与辅助文案后进入。
- 6个低对比环境粒子、16秒慢光效，不使用视频/WebGL或快速闪烁。
- 运动卡片hover上移5px、图片放大1.045、柔和边缘光；active按压反馈，所有按钮为真实导航。
- 页面进入5px/220ms；选中导航共享layoutId过渡。未绘制假数据图表。
- 手机停用视差、滚动位移、粒子与循环节点，只保留克制的进入效果；prefers-reduced-motion关闭环境循环与变形。

完整规范：`MOTION_DESIGN.md`。

## 5. 实际测试与问题修复

| 检查 | 最终结果 |
| --- | --- |
| ESLint / TypeScript | 通过 |
| Vitest | 3文件，15/15通过；原12项保留，增加媒体完整性/来源/预算3项 |
| 生产构建 | 通过，46个生成页含框架内部页；业务入口仍首页+43模块 |
| Playwright | 最终完整13/13通过，无跳过/意外失败/重试掩盖 |
| 全路由与导航 | 实际打开44页、检查44独立导航目标，全部正常 |
| 常规控制台/资源 | pageerror/console.error 0，失败资源0 |
| 深浅主题/320与390布局 | 通过；桌面/手机截图已目视检查 |
| 图片 | 30文件浏览器解码通过，11运动源唯一，手机选择独立构图，失败回退通过 |
| 动效 | reduced-motion与手机关闭复杂动效通过；桌面记录帧间隔样本 |
| PWA | Manifest/图标、注册、公开静态缓存、离线回退、等待更新/确认刷新/旧缓存清理通过 |
| 文档与保护 | 原17文档hash、原PHASE 1暂存树、旧gpt状态均通过 |

首轮13项中12通过，图片故障回退失败；这是实际实现问题，已修复hydration前错误丢失，未削弱断言，重新执行完整13项通过。主标语断言按新文案更新；SW单元测试按实际VERSION计算缓存名，其他权限/隐私要求没有移除。

生产浏览器最后运行约1.1分钟。命令：pnpm lint、pnpm typecheck、pnpm test、pnpm check:docs、pnpm build、pnpm test:e2e。没有新增npm依赖，package.json和pnpm锁文件保持原样。

## 6. 性能实测与局限

当前Headless Chromium的1,513ms样本记录90帧，平均帧间隔16.81ms、P95为16.70ms。样本没有显示持续长帧，但不能据此保证所有电脑/手机60fps。没有视频、WebGL或大型3D运行时；30个图片变体总计约1MB，按srcset/懒加载选择，不整包预加载。

手机真机、iPhone Safari真实安装和完整生产Core Web Vitals尚未测。当前Cloud没有可验证的公网预览入口；截图来自实际内部生产实例，不编造外网地址。视觉试采集中发现并修正手机安装控件遮挡、照片裁切与首屏图片失败回退；最终自动化中未见新的控制台或资源错误。

## 7. 七组升级前后截图

对比页：`../delivery/phase1-1/index.html`；机器索引：`../delivery/phase1-1/SCREENSHOT_COMPARISONS.json`。对比图采用相同首屏范围；完整长图在before和after分别保留。手机是390px浏览器视口，不代表真机。

1. 首页桌面深色 — comparisons/01-comparison.png
2. 首页桌面浅色 — comparisons/02-comparison.png
3. 首页手机 — comparisons/03-comparison.png
4. 运动中心 — comparisons/04-comparison.png
5. 营养中心 — comparisons/05-comparison.png
6. AI私人教练 — comparisons/06-comparison.png
7. 设备中心 — comparisons/07-comparison.png

七组对比已在聊天直接展示，非设计稿冒充运行结果。

## 8. 主要文件与交付状态

新增：src/features/dashboard/premium-hero.tsx；src/features/visual/{sports-art,sport-card,section-visual}；src/components/media/editorial-image.tsx；src/app/premium.css；tests/unit/visual-assets.test.ts；tests/e2e/visual.spec.ts；30张WebP；素材、Motion与视觉报告文档；七组对比和验收证据。

修改：Dashboard、共享模块路由、AppShell、根布局、PWA控件、Manifest/图标/离线页/SW版本；原测试的标语和版本兼容断言；README、FEATURES、CHANGELOG、项目决策及实施报告。完整逐文件清单和hash差异见delivery/phase1-1/CHANGES.json与CHANGES.txt，不只列举主要文件。

旧的装饰SVG源码和全部已确认功能保留，没有删除原始文件来实现视觉替换。PHASE 1源码备份可恢复；当前新视觉未推GitHub，也未改既有待确认交付暂存。PHASE 0–10正式路线不变，1.1为PHASE 1视觉子阶段。

## 9. 尚未解决/未实施

- 实际Windows、手机硬件、Safari安装和持续性能仍待人工验证。
- 当前没有提供原参考图片文件，无法逐像素对照它；已依据文字要求完成原创构图。
- 生成素材不是明星肖像授权，未承诺排他版权；来源信息完整记录。
- 未接Supabase、认证/RLS、云同步、训练/营养业务、OCR、收费AI、GPS、真实设备或复杂3D生成。
- ESLint9上游deprecated维护风险仍沿用上一阶段，未为本次视觉升级扩张依赖范围。

完成后停留PHASE 1.1，等待用户视觉验收。没有自动推送、生产部署或开始PHASE 2。

## 10. 用户后续授权的GitHub版本保存

用户在视觉验收报告之后明确要求推送GitHub。本分支delivery/fitness-os-phase1-1为完整版本；此前“未推送”均指当时验收状态。此次只修正分发说明，应用/图片与受测版本一致；不更新main、不进行网站部署或PHASE 2。最新Windows和截图入口见本项目README与delivery/phase1-1/PUBLISH_NOTES.md。
