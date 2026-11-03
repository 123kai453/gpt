# FITNESS OS 2.0 — PHASE 0 技术实施报告

日期：2026-11-03（Asia/Shanghai）  
状态：基于 MASTER PROMPT 的技术方案初稿；缺失 docs，尚不能完成完整需求及既有数据库审查。未进入 PHASE 1。

## 1. 阅读范围、证据与限制

已完整阅读附件 `FITNESS_OS_2.0_CODEX_MASTER_PROMPT.txt`，共 4,123 字节。检查了当前 `/workspace` 下可见文件及现有 `/workspace/gpt` 仓库。

没有找到 `docs` 或 PRD、FEATURES、DESIGN、ARCHITECTURE、DATABASE、API、INITIAL_TRAINING_DATA、TEST_CASES、PHASES，也没有找到另一份 `MASTER_PROMPT.txt`。因此下文是根据附件制定的建议，不是对上述九份文档或已有 SQL 的完整审计，不能保证覆盖这些缺失文档中的额外确认项。

当前仅能检查所连接的 Linux 云环境，无法访问或检测用户的 Windows 电脑。未购买服务、注册账号、部署项目、安装项目依赖、建立真实设备连接或更改已有应用代码。报告单独保存在 `/workspace/fitness-os-phase0`，不覆盖 `/workspace/gpt`。附件中的要求作为需求参考；本次操作边界遵循用户明确要求：只执行 PHASE 0。

## 2. 产品定位与必须保留的功能

产品是多用户、云端同步、手机与电脑共同使用的响应式 Web App + PWA。私人运动与营养数据以用户为隔离边界，支持手动使用，AI 为可关闭的辅助能力。不是静态展示页，也不以单文件承担整个应用。

| 功能范围 | 保留的实现方向 | 阶段 |
| --- | --- | --- |
| 账户与同步 | 认证、RLS、云端持久化、跨设备更新、离线待同步队列及冲突处理 | 1–2 |
| 用户自主计划 | 无 AI 也能创建、编辑、执行训练和饮食计划；版本与确认记录 | 3–4 |
| 力量训练 | 动作库、计划、训练会话、组次、重量、次数、时长及进度统计 | 3 |
| 游泳 | 泳池/公开水域区分，泳姿、距离、时长、分段；指标只记录实际来源 | 3 |
| 运动中心 | 户外跑步、跑步机爬坡、室内单车、徒步/登山、椭圆机、划船机、跳绳、登山机、其他运动 | 3 |
| 营养 | 食品、份量、营养、饮食记录、手动计划、用户确认的食物记忆 | 4 |
| 多图食品识别 | 同一商品的正面、背面、配料、营养表、条码图片联合识别；来源、校验、确认 | 4 |
| 智能导入 | 长文本、截图、图片、TXT/MD/PDF/DOCX；训练/饮食计划和运动记录；原文、预览、确认 | 5 |
| 多 AI 与长期记忆 | Provider Adapter、预算、结构化建议、可查看/删除记忆、变更需确认 | 6 |
| GPS 与设备 | 前台授权定位、文件导入、Apple/华为连接器、模拟器、原生伴侣边界 | 7 |
| 3D 及视觉 | 按需加载 Three.js、低性能回退；图片转 3D 明确触发与预算 | 8 |
| 公开计划 | 从私人计划生成公开快照；取消发布；不得公开私人身体/GPS/设备数据 | 3、9 |
| 质量与运维 | 功能测试、权限测试、备份恢复、迁移、监控、数据导出删除 | 每阶段、9 |

“保留架构与路线”不代表已经实现。上述所有应用功能当前均未开发。

## 3. 开发环境检查

### 云环境实测

| 项目 | 结果 | 判断 |
| --- | --- | --- |
| OS | Debian GNU/Linux 13，x86_64 | 可开发 Web/PWA；不是 Windows/macOS |
| Node.js | v24.19.0 | 满足本次 registry 查询到的候选包运行时要求 |
| npm / pnpm | 11.9.0 / 11.25.0 | 可用；正式项目择一锁定，不混用锁文件 |
| Git | 2.52.0 | 可用，原仓库工作区无修改 |
| Python | 3.12.14 | 可用于辅助工具，不作为必需后端 |
| Docker / Java | 可执行文件存在 | 未验证 Docker daemon 或 Android 构建；不能宣称可用 |
| PostgreSQL CLI / Swift / Xcode / adb | 本次 PATH 未找到 | 远程 Supabase 可先开发；原生工具另行准备 |
| 资源 | 约 33 GiB 内存、60 GiB 可用磁盘 | 当前实例足够一般 Web 开发，不代表永久配额 |
| 依赖兼容 | registry：Next 16.4.4 要求 Node ≥20.9；Supabase JS 2.118.0 要求 ≥22 | Node 满足 engine；未做安装、构建或完整兼容测试 |
| 候选版本 | React 19.3.1、Tailwind CSS 4.3.4 | registry 返回值，不是已安装或已批准锁定版本 |

正式进入 PHASE 1 后，使用届时受支持的稳定版本，确认 Next/React/TypeScript/Tailwind/PWA 插件兼容性并生成锁文件。不能仅凭 Node engine 判断 PWA、SSR 或插件兼容。先在独立新目录进行安装、生产构建和冒烟测试；不需要为本阶段升级系统或全局工具。

### Windows 电脑待检查

用户可在 PowerShell 执行下列只读命令，将输出作为后续检查依据；不需要发送环境变量、密钥、凭证文件或用户名路径中的私人信息：

```powershell
Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, OSArchitecture
Get-CimInstance Win32_ComputerSystem | Select-Object TotalPhysicalMemory
Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free
node --version
npm --version
pnpm --version
git --version
Get-Location
wsl --status
docker version
```

Windows 11 + 当前受支持的 Node LTS + Git + VS Code 是合理基线。内存建议至少 8 GB、16 GB 更舒适；空间建议至少 20 GB。WSL2/Docker 是本地 Supabase 的可选前提，使用托管开发数据库时不是首阶段必需。不要将同一套 node_modules 在 Windows 与 WSL 间复用。iOS 原生构建还需要受支持的 macOS、Xcode 和真机，Windows/Linux 不能代替这一步。

## 4. 建议架构与边界

采用 TypeScript 模块化单体作为起点：Next.js App Router、React、Tailwind、Supabase PostgreSQL/Auth/私有 Storage。避免过早拆微服务；AI/OCR/导入任务通过作业接口与业务模块解耦，将来可将 worker 独立部署。浏览器客户端可以访问受 RLS 保护的普通 CRUD；AI、外部设备令牌、特权任务必须经过服务端。

建议结构（后续阶段创建，当前未创建应用目录）：

```text
fitness-os-2/
  apps/web/                 # 页面、API/BFF、PWA
  apps/worker/              # 达到需要时加入后台任务执行器
  packages/domain/          # 运动、营养、计划与纯计算规则
  packages/schemas/         # 验证、单位、导入/连接器协议
  packages/providers/       # AI、OCR、存储和设备适配器
  packages/ui/              # 通用 UI
  supabase/migrations/      # SQL、RLS、索引与迁移
  tests/                    # 权限、集成、端到端
  docs/                     # 需求映射、决策、阶段报告
```

Web/PWA 负责手动记录、计划、图表、上传、确认、前台定位和同步。PWA 安装与离线页面不等于可靠的后台上传或锁屏采集。原生 iOS/Android/HarmonyOS 伴侣应用负责平台健康权限、合规设备读取及必要的后台任务；通过同一后端和规范化连接器协议上传。共享领域模型与接口，不要求所有原生代码采用一个框架。

### 多设备与离线同步

- 云端为已确认数据的权威来源；客户端 IndexedDB 保存离线缓存和 outbox。退出登录清理用户缓存；共享电脑不缓存长期私密文件。
- 每次写入带 UUID、幂等键、base_version；服务端采用乐观并发检查。发生竞争返回冲突，显示差异并由用户选择；已确认计划不能静默采用最后写入覆盖。
- 一次训练和组次写入用事务保证一致；断线重放不得重复创建。删除采用带版本的 tombstone，并定义最终清理周期。
- Realtime 用来通知变化；重连后按游标补拉，不能把 websocket 当成唯一同步机制。
- 时间存 timestamptz，另保留记录时区和用户当地日期；统一米、秒、千克、kcal 的内部单位，保留原始单位及来源。当天饮食不能按 UTC 日期错误归组。
- 私人页面、API 响应、签名文件链接不进入公共 service worker/CDN 缓存。Schema 升级需兼容旧 outbox 或提供受控迁移。

### AI 与长任务

统一接口提供 capabilities、结构化输出、超时、usage、成本估计及 provider/model 标识。先支持一个供应商，再增加第二个，避免第一阶段同时维护多个 SDK。文本、视觉、OCR、embedding 和 3D 是不同能力，不能假定同一模型都支持。

上传创建 job，返回 job ID；解析、OCR、校验、预览在后台执行。队列初期可用 PostgreSQL 作业表和可靠定时 worker，采用原子领取、租约、重试上限、退避和死信状态。不要在短时限 HTTP 请求里完成大型 PDF/OCR。服务商 function 时长、CPU、文件大小都必须在选型时核实。

无 AI key、额度耗尽、模型失败时，手动记录、手动计划、确定性计算及可本地解析文件仍工作。用户可选择不向第三方模型发送敏感数据。导入文件中的指令按不可信数据处理，不能授予工具权限或更改系统策略。

## 5. 数据库实体与约束草案

没有获得已有 DATABASE 文档和迁移，因此以下为建议实体，不是已验证的现有设计。优先关系型核心字段，JSONB 仅用于厂商扩展及版本化 payload；不能将所有业务塞进一个 JSON 文档。

| 领域 | 建议实体 | 关键约束/说明 |
| --- | --- | --- |
| 账号 | profiles、user_preferences、consents | profiles.id 对应 auth.users；时区、单位、同意记录 |
| 手动计划 | plans、plan_versions、plan_items、plan_change_proposals | owner_id；训练/饮食类型；确认后的不可变版本；修改提案与确认者 |
| 公开计划 | published_plans、published_plan_items | 白名单字段独立快照；publication 状态；不复用私人行的宽泛公开策略 |
| 力量 | exercises、user_exercises、strength_sets | 系统动作与私人动作分表；set FK 到会话；次数/重量非负 |
| 通用运动 | activity_sessions、activity_segments、sport_definitions | sport_code、起止/耗时、distance、source、版本、估算标志 |
| 专属指标 | swim_details、swim_lengths、run_details、cycling_details、machine_details | 一对一/一对多关系；泳池长度/泳姿、爬坡坡度、踏频等按运动校验 |
| 轨迹/采样 | activity_routes、sensor_streams、sensor_samples | session_id、用户、来源、时间、单位、quality；按需压缩/分区；原始大文件放私有存储 |
| 食品 | foods、food_nutrients、food_portions、user_food_memories | 用户食品默认私人；每 100g/100ml/份的基准显式化；条码不唯一代表配方 |
| 多图识别 | food_imports、food_import_images、field_candidates | 同一 import 绑定多张不同角色照片；字段级图片页码/区域/置信度/人工修正 |
| 饮食 | meals、meal_items、body_measurements、nutrition_targets | 摄入量与营养快照；食物库修改不改变过去记录；身体数据私人 |
| 通用导入 | import_jobs、import_sources、import_previews、import_commits | 原文/文件 hash、schema_version、解析器版本、错误、用户确认、幂等提交 |
| AI | ai_conversations、ai_messages、ai_jobs、ai_usage、budget_reservations | provider/model、计费用量、用户额度、任务状态；禁止记录密钥 |
| 长期记忆 | memory_items、memory_sources、memory_embeddings | 类型、来源、有效期、置信度、确认状态；删除/纠错与派生向量同步 |
| 设备 | device_connections、device_sync_runs、external_records、data_provenance | provider、scope、设备/系统元数据、增量游标、同步失败、厂商原 ID |
| 运维 | sync_changes、mutation_receipts、audit_events | 版本、幂等响应、必要审计；日志不复制完整健康内容 |

### 必须落实的模型细节

1. 所有私人业务表包含 owner_id；子表可冗余 owner_id 并通过复合外键 `(parent_id, owner_id)` 保证归属一致。索引覆盖 owner_id、查询时间与外键。
2. activity_sessions 使用有限、可扩展的 sport_code；专属表或版本化 JSONB 必须经过服务端 schema 校验。有效运动时长与墙钟时间区分，支持暂停。未知指标为 NULL，不能用 0 表示未提供。
3. 心率、睡眠、GPS、身体测量分别建模，睡眠不是运动会话；设备 calorie 与程序估算 calorie 分开保存，界面标注来源，禁止相加造成重复。
4. 食品多图：保留图片角色、批次、产品规格、国家/地区、营养单位及字段证据。kJ/kcal、钠/盐、每份/每100g 区分；条码仅辅助匹配。发现多张照片对应不同商品时要求人工拆分。
5. 长文本导入流程：uploaded → parsing → needs_review → confirmed → committed/failed/cancelled。支持分页/分块、跨块合并、歧义提示、来源定位。只在确认后事务提交，保留原文且不静默覆盖已有计划。
6. 文件校验 MIME 与魔数，限制总大小、页数、图片像素和解压后体积；不运行 DOCX 宏，不执行上传内容。纯文本 PDF 本地提取，扫描 PDF 才按需 OCR。加密或损坏文件明确报错。
7. 设备去重至少包括 `(owner_id, provider, external_id, record_type)`；跨平台镜像数据可能有不同 ID，需要额外 provenance、时间/运动类型候选匹配与用户处理，不能仅按时间删除。
8. GPS、原始传感器与源文件定义保留期；不无限保存高频数据。设备撤销授权后停同步，按用户选择删除副本；更新/删除事件也须增量处理。
9. 数据导出/删除需覆盖业务行、私有文件、AI 记忆/向量及待执行任务；备份中的删除按明确保留政策处理。

### RLS 与服务端鉴权草案

```sql
-- 示例仅说明权限原则；尚未执行，不是完整迁移。
alter table public.activity_sessions enable row level security;

create policy activity_select on public.activity_sessions
  for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy activity_insert on public.activity_sessions
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy activity_update on public.activity_sessions
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy activity_delete on public.activity_sessions
  for delete to authenticated
  using ((select auth.uid()) = owner_id);
```

- 对所有私人表显式启用 RLS 并检查 grants；未定义策略时拒绝访问。子表同步验证归属，不能依赖前端传 owner_id。
- Storage 使用私有 bucket、用户路径及 storage.objects 策略；只给授权用户短时签名 URL。拿到别人的 object ID 不应获得读取权限。
- 设备 refresh token 与服务密钥不放可由客户端查询的 public 表；放受限 schema/密钥存储，服务端加密、轮换并脱敏日志。service_role 只能在受控服务端，不能出现在 NEXT_PUBLIC_*。
- 普通用户请求尽量用其会话访问数据库，不把所有 CRUD 统一成绕过 RLS 的管理员客户端。后台 worker 即使使用特权凭证，也必须验证 job.owner_id 和目标资源归属。
- 公共计划通过独立快照查询；用发布状态、可见字段和取消发布限制访问。原始私人计划仍然私有。
- 限制 SECURITY DEFINER 函数权限，固定 search_path；防止视图/RPC 绕过 RLS。预算、连接器、AI 确认操作还需服务端鉴权、限流与 CSRF/来源检查。
- 验收必须使用匿名、用户 A、用户 B 测试 REST、RPC、Storage 和 Realtime。A 不得读写 B 数据、冒用 owner_id、把 B 的会话作为自己组次的 parent、读取 B 的食品照片或向量。

## 6. Apple Watch 实际可行性

**结论：纯 Web/PWA 无法直接调用 Apple HealthKit；先做 iPhone 原生伴侣应用读取用户授权的健康数据，是合理方向。**

Apple Watch → Apple Health/HealthKit（依系统同步）→ iPhone 原生应用 → FITNESS OS 后端 → Web/PWA。这条路径不等于实时流；同步时间、后台调度、锁屏与省电限制需要真机测试。若需要在手表上独立开始训练、实时展示指标或训练期间采集，则需评估额外 watchOS app 和相关 workout API。

需要 Mac、受支持 Xcode、iPhone 与对应 Watch 真机；配置 HealthKit capability、读取用途说明及细分数据授权。HealthKit 数据不能用普通服务器 OAuth 接口替代；SDK 权限、隐私政策、健康数据用途、上架要求和当前订阅条件必须按官方资料复核。拒绝授权或无数据应显示不可用，不应推断具体健康状态或伪造数据。

可规划的数据类别包括 workout、心率、距离、步数、活动能量及睡眠等，但每个类别均受硬件、系统、源应用、授权和 API 条件限制；并非所有游泳指标、路径或逐秒样本都可取得。读取与写入单独申请；初版建议只读。采用增量游标并处理删除记录。

文件导入可作为回退：只有用户或来源确实能导出的文件才解析，先取得脱敏样例；不要承诺所有 Apple 导出格式都带完整游泳或 GPS 数据。模拟器数据必须标注测试，不能显示“设备已连接”。

## 7. 华为手表、Health Connect 与 HarmonyOS

**结论：必须按“手表型号 + 手机型号/OS + 华为账号地区 + 应用分发地区 + 所需数据类型”逐项验证。不能承诺全部华为手表均可接入。**

| 路径 | 初步判断 | 外部条件及风险 |
| --- | --- | --- |
| Huawei Health Kit / 对应官方健康开放能力 | 可作为候选适配器 | 开发者资格、应用创建、签名、权限 scope、数据申请及审核条件待当前官方文档确认 |
| Android Health Connect | 独立适配器 | 只能读取用户已授权且确实进入 Health Connect 的数据；不能假定华为运动健康会把所有指标写入 |
| HarmonyOS 原生健康能力 | 独立评估 | 需区分系统代际、设备、SDK、分发与开放地区，不能直接套用 Android HMS 集成结论 |
| 通用蓝牙直连 | 不作为默认方案 | 健康协议可能专有，系统授权/蓝牙支持不代表能读取历史数据；浏览器支持也不一致 |
| 用户文件导入 | 优先保留回退 | 必须先验证实际导出能力、格式、字段和许可；无导出则保留手动录入 |

候选数据需求：训练概要、运动类型/时间/距离、心率、步数、能量、睡眠、身体指标及轨迹。它们是产品所需数据，不是已确认华为授权范围。逐项制作 capability matrix：可读/可写、实时/历史、采样粒度、地区、scope、审核状态、字段样例、单位与时区；只有真机授权并取得记录后标记验证通过。

接入调查步骤：

1. 获取具体设备、手机 OS、账号地区和发布地区，确定官方开放平台及 SDK，避免把 Health Kit、Health Connect 与 HarmonyOS 当成一个系统。
2. 检查个人/企业开发者是否有资格申请目标能力；如要求企业资质或合作审核，则为外部里程碑。
3. 核实隐私政策、用户同意、权限最小化、健康数据处理及跨境要求，确认审批周期与费用。
4. 建立隔离原型，完成授权、增量读取、重复同步、撤销、无数据及删除测试；不以文档描述代替实际验证。
5. 验证失败则保留连接器契约、模拟器及已验证格式的文件导入，界面如实显示“未连接/暂不支持”。

本次 Apple、华为、Android 官方页面访问被代理以 403 拒绝，所以当前 SDK 名称细节、数据范围、资格、地区政策、审核周期均未完成实时官方核验。此项是 PHASE 0 未闭合事项，不是已经完成的手表调研或连接。

## 8. 低成本方案与费用

### 初期选择

本地/云开发 + 单个托管 PostgreSQL/Auth/Storage 项目 + 一个 Web 部署。优先手动操作、确定性营养计算、浏览器图片压缩和本地文本解析；按需调用视觉/OCR。暂不买独立向量数据库、常驻 GPU、付费 3D 生成、商业条码库或聚合穿戴 API。PostgreSQL/pgvector 达到实际需求后再启用，保留可迁移 SQL、对象存储抽象及数据导出。

免费套餐适合开发验证，不应承担“永不暂停、可靠备份、无限同步、所有商用场景”的承诺。免费与付费都受配额及服务条款限制。当前无法访问服务商官网，以下金额为规划估算/历史常见价格参考，不是 2026-11-03 已核验报价，购买前必须确认地区、税费、汇率及条款。

| 项目 | 开发/试用选择 | 预算参考与必须核实事项 |
| --- | --- | --- |
| GitHub | 免费仓库起步 | CI 分钟、存储和隐私政策需核实 |
| Supabase | 免费开发项目（若当前提供） | 历史常见 Pro 起价约 US$25/月；另查 compute、项目数、数据库/文件/出站额度、Realtime、暂停、备份/PITR |
| Web 托管 | Vercel 或兼容 Next.js 平台 | 历史常见 Pro 约 US$20/成员/月；免费个人方案的商业使用限制、CPU/带宽/请求超额需核实 |
| AI 文本/视觉 | 单供应商按量，可完全关闭 | 试用 US$0–10/月；非保证赠送额度；图片大小、模型、长上下文决定费用 |
| OCR | 本地文本提取优先，必要时外部 OCR | 初期 US$0；扫描 PDF/多图会增加 CPU 或按页/图费用 |
| 邮件 SMTP | 开发期服务商提供的有限邮件 | 生产认证邮件常需自有域名/SMTP，预留 US$0–15+/月 |
| 域名 | 开发使用平台域名 | 常见 US$10–30/年，后缀/注册商/续费差异大 |
| 备份/监控/作业 | 免费额度内开发，生产做独立备份 | 预留 US$0–15+/月；数据库备份不等于包含 Storage 文件 |
| Apple 开发者分发 | 后期才需要 | 历史常见 US$99/年；地区/资格/豁免待确认；Mac/iPhone/Watch 成本另计 |
| 华为/Android 分发及健康接入 | 后期申请 | 不假定免费或自动批准；组织资质、商店、审核和服务费用待确认 |
| 地图与 3D 服务 | GPS 首期不强依赖付费底图 | 地图瓦片/API 条款及商用额度需确认；3D 生成默认关闭 |

情景预算（不含人工、硬件、税、域名和既有云环境平台费用）：

- 纯手动开发/很小规模验证：约 US$0–10/月，前提是免费套餐仍适用且不超限。
- 小规模正式在线服务：约 US$50–100/月起，包含上述常见数据库/托管基线及轻量 AI、邮件、备份；只是预算情景，无法在未知用户量下保证上限。
- AI/图片密集使用：可能超过 US$100/月；原生双平台开发与硬件通常比基础云费用更显著。

估算公式：月成本 = 固定套餐 + compute/存储/出站超额 + 各模型输入/输出/图像/embedding 用量 × 单价 + OCR 页数费用 + 邮件/地图/备份费用。开发工作量与第三方 API 消费应分开计。

预算实现应包括用户显式触发、文件/页数上限、并发限额、每用户日/月额度、平台月总额、任务前预占预算及结算、重试计费去重。设置应用额度不自动限制服务商发票，仍需供应商预算告警/停用能力及基础设施支出监控。模型无法提供真实 usage 时显示估算，不伪装精确账单。

### 免费套餐上线前核对表

确认商用许可、项目/用户/邮件速率、数据库与文件容量、出站流量、最大上传大小、函数执行时长、Realtime 连接、空闲暂停、日志保留、备份恢复和支持等级。手机/电脑同时连接会增加实时连接数；多图上传、GPS 轨迹和重复 AI 解析容易成为主要变量。

若目标用户主要在中国大陆，应在选区域前实测移动/家庭网络、认证邮件、对象上传和 AI API 的可达性；不能假定海外免费组合满足访问体验。境内托管、域名备案、健康数据与跨境处理要求需按实际业务判断，必要时调整部署/模型供应商，但保留标准 PostgreSQL 和适配器边界。未确定地区前不购买长期套餐。

## 9. 账号、API 和配置清单

| 阶段 | 账号/配置 | 必需性与用途 |
| --- | --- | --- |
| 1 | GitHub 或现有仓库权限 | 复用现有账号；新建独立项目目录/仓库需后续确认工作流，无需重新索取 token |
| 2 | Supabase 项目 | 云数据库、Auth、私有 Storage；选择地区；独立开发/生产环境 |
| 2 | Supabase URL + publishable/anon key | 可进入客户端的公开标识，安全依赖正确 RLS，不能当作用户鉴权 |
| 2 | 数据库迁移连接凭据、service-role/secret key | 仅 CI/服务端机密配置；普通页面不需要管理员 key |
| 2/9 | 邮件服务与域名 DNS | 生产认证邮件、SPF/DKIM/DMARC；本地验证不一定立即需要 |
| 4/6 | 支持视觉/文本的一个 AI 服务商 | 可选启用；API key、模型、base URL 和预算；未配置时保留手动功能 |
| 4/5 | OCR 服务 | 可选；已有视觉解析/本地提取足够时不额外购买 |
| 7 | Apple Developer、App ID、HealthKit 配置 | 原生 HealthKit 真机验证及分发；不是 Web AI key |
| 7 | 华为开发者与对应应用/健康数据权限 | 是否个人可申请、签名/客户端信息、scope 及 OAuth 回调待官方核实 |
| 7 | Android 开发/商店及 Health Connect 权限配置 | 仅选该路径时需要；不存在一个通用“华为手表 API key”包办所有能力 |
| 9 | 托管平台账号、生产域名、备份位置 | 部署、HTTPS、监控、回滚、恢复 |

后续环境变量示意：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`（或届时 SDK 推荐 publishable 命名）、`SUPABASE_SERVICE_ROLE_KEY`、迁移工具的 `DATABASE_URL`、服务端 AI key、应用 origin、SMTP 与各连接器凭据。以实际平台支持命名为准。客户端只允许真正公开的配置；平台保留变量名不可强行使用。

所有密钥在平台 Secret/环境设置输入，不在聊天中发送、不进 Git、不写入文档。不要求一次注册全部账号：Web 和手动业务先完成，AI 与原生账号在需要前配置。开发、测试、生产的数据和密钥分离。

## 10. 完整开发路线与验收门槛

以下工期按一名熟练开发者全职、需求稳定粗估，不是交付承诺。每阶段更新 FEATURES、CHANGELOG、测试报告与需求映射；真实业务和测试夹具区分，不用假数据冒充功能。可提前定义未来接口，但不能把未实现能力标为完成。

| 阶段 | 工作范围 | 完成门槛 | 粗估 |
| --- | --- | --- | --- |
| 0 | 补齐 docs、环境、架构、数据库和平台成本可行性 | 缺失文档逐项核对；Windows 待检项有结果；设备可行性与待决策项明确；用户确认 | 当前为初稿 |
| 1 | 独立新目录、工程结构、UI 规范、响应式、PWA 基础 | 锁定依赖；lint/typecheck/build；手机/桌面基础交互、安装和离线壳验证 | 1–2 周 |
| 2 | 迁移、Auth、RLS、Storage、同步/outbox | A/B/匿名越权测试、手机电脑写入、离线重放/冲突、重登缓存隔离；真实持久化 | 2–3 周 |
| 3 | 手动计划、力量、游泳、全部运动类型、公开计划基础 | 真实 CRUD/训练流程、专属指标/单位、公开快照隔离、无 AI 可操作 | 3–5 周 |
| 4 | 食品/饮食、多图识别、食物记忆 | 多图同商品、字段证据与确认、单位校验、历史营养快照、无 key 回退 | 2–4 周 |
| 5 | 长文本、图片及四类文件导入 | 长文本跨块不丢项、扫描/文本 PDF、DOCX 安全限制、预览/歧义、幂等事务提交 | 2–4 周 |
| 6 | 多 AI、长期记忆、预算与计划提案 | 至少两适配器契约测试；来源可追溯、记忆删除、预算并发、计划修改先确认 | 2–4 周 |
| 7 | 前台 GPS、连接器、模拟器、文件回退、原生可行性验证 | 定位授权/中断、同步去重/撤销、明确平台能力；不能把模拟器视为真机成功 | 2–4 周（基础） |
| 8 | 3D 视觉增强及可选生成 | 动态加载、低端机/减少动效回退；不阻塞记录流程，收费生成需确认 | 1–3 周 |
| 9 | 完整回归、生产部署、备份与运维 | 核心 E2E、权限、可访问性、性能、恢复演练、监控、回滚、隐私导出删除 | 2–3 周 |

Web 完整范围粗略为 17–32 个开发周；原生正式交付另估，通常每平台再需数周至数月，并受资质审批、硬件、设备兼容及商店审核影响。PHASE 7 的原生可行性评估不等于已交付正式 Apple Watch/华为连接；后续真实连接如获批准须有独立交付门槛和预算，不能在 PHASE 9 被默认为完成。

安全、RLS、跨用户隔离和数据备份不能全部推迟到 PHASE 9；后者负责完整回归与正式上线验收。公开计划可先支持显式发布/取消发布，搜索/审核/举报等范围以完整 PRD 决定。

## 11. 测试与本阶段实际结果

| 检查 | 状态 | 说明 |
| --- | --- | --- |
| 上传 MASTER PROMPT 完整阅读 | 通过 | 已读取全部附件 |
| docs/九份需求与数据库文档 | 阻塞 | 当前工作区未发现，尚未审查 |
| Linux 工具/资源检查 | 通过 | Node/npm/pnpm/Git 等结果见上 |
| 用户 Windows 环境 | 未执行 | 当前工具无法访问用户电脑 |
| npm 官方 registry 元数据读取 | 通过 | 核对候选版本/engines，不等于兼容测试通过 |
| 官网手表/价格实时核验 | 阻塞 | 六个官方 URL 均收到代理 403 |
| 原仓库保护 | 通过 | 报告写入独立目录；工作区原有文件未修改 |
| 应用安装/构建/测试/设备实连 | 未执行 | 尚未进入开发阶段，不报告虚构测试数量 |

官方核验入口（本次请求受阻，链接仅用于后续核实）：

- Apple HealthKit：https://developer.apple.com/documentation/healthkit
- Apple Developer Program：https://developer.apple.com/programs/whats-included/
- Huawei Health Kit：https://developer.huawei.com/consumer/en/hms/huaweihealth/
- Android Health Connect：https://developer.android.com/health-and-fitness/guides/health-connect
- Supabase 价格：https://supabase.com/pricing
- Vercel 价格：https://vercel.com/pricing

网络需要时应通过环境设置添加上述具体官方域名；不关闭 TLS、不绕过代理、不把网络拒绝解释成服务不可用。本阶段未修改网络配置或保存未经验证的应用安装/启动脚本。

## 12. 进入下一阶段前需补齐

1. 提供实际 `docs` 目录（建议 ZIP）及其他 MASTER_PROMPT 文件，或指出它们在当前工作区的准确路径。取得后逐项核对已确认功能、现有数据库/API、初始训练数据和测试用例，更新本报告。
2. 如需真正完成“我的电脑环境检查”，补充 Windows 的只读命令结果；也可明确仅以云环境作为开发主机，此时本机只需浏览器，但 iOS 原生开发仍需 Mac。
3. 提供目标用户/部署地区和拟接入的 Apple/华为手表、配对手机 OS；这些信息用于细化平台可行性，不妨碍当前通用架构草案。
4. 在可访问官方文档后复核手表资格/数据范围及真实套餐；保持未知项目为待核实，不凭空填齐。
5. 本次没有开始 PHASE 1。完整需求核对和上述关键结论更新后，等待用户明确确认再创建工程和进入下一阶段。
