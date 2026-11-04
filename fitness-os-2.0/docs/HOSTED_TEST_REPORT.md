# HOSTED TEST REPORT

日期：2026-11-04。总体：**ACCEPTANCE BLOCKED**。

## 本轮真实执行

| 操作 | 环境 | 结果 |
|---|---|---|
| Git 分支/工作区 | Cloud 文件系统 | 开始时干净，feature/phase2-cloud-foundation，HEAD 8ca8d3e |
| 最新/历史提交核对 | 本地 Git | 最新实现保留，0caad38 是历史检查点，PHASE 1.1 基线 8d0c462 保留 |
| 配置草稿读取与保存 | 环境配置服务 | 已保存域名/公开配置/Secret 要求和启动说明；requires_publish=true |
| 运行实例配置读取 | 实际 Cloud 实例 | observations_current=true；网络 enforced，但目标域名未放行，变量与 Secret 未注入 |
| GET /auth/v1/health（无凭据） | 原代理 → 托管域名 | CONNECT 403，未到达 Supabase，不计作托管 Auth 或 RLS 用例 |
| pnpm test | 本地工程 | 7 个文件、66 项通过 |
| pnpm test:e2e:local --reporter=list,json | 受保护的本地 Supabase | 20 场景通过，0 失败、0 跳过；含首页+43模块、导航、缓存与全部账户流程 |
| 只读审查 SQL 冒烟验证 | 本地 PostgreSQL | READ ONLY 事务执行成功并 COMMIT；不是托管 Schema 查询 |
| 17 份不可变原文 | 文件哈希 | SHA256 完整，工作文档路径检查通过 |
| 旧 gpt 项目 | 原 checkout | 干净，HEAD e55ff9175bcc82e7c4c2934d089c26118dfcba71，无本轮修改 |

原有本地 79 SQL / 113 HTTP/Auth/Storage 断言的历史结果保留在既有交付中，本轮没有改写它们为云端结果，也没有把历史执行日期换成本轮新测试。

## 托管测试实际状态

本轮托管业务用例执行 **0 项**。下列均为未执行，不算通过或失败：

- Schema/迁移历史、差异、备份和迁移：网络/目录权限不足，且未到用户批准阶段。
- 注册、投递、确认、登录、错误密码、退出、恢复/重置、持久会话、撤销与过期：托管前提未满足，真实邮箱测试按用户要求待执行。
- A/B 真实 JWT、匿名 CRUD、伪造 user_id、旧 token 与撤销访问：未执行。
- 私人文件本人读写、跨用户读/删拒绝、类型/大小、元数据和文件清理：未执行。
- 双会话、桌面/手机视口、离线恢复、幂等、冲突、跨账户队列隔离：未执行托管路径。
- JSON/CSV、确认/密码重验、临时账号级联删除与他人数据保持：未执行托管路径。

用户确认正式网站尚未部署、无公网预览。正式 HTTPS、Auth Redirect、PWA 与公网私人 API 策略未测试；当前内部回环页面不是公网预览。手机视口也不代表真机。

用户已指定两个专用收件箱，以 A/B 标识；真实地址只保存在被 Git 忽略的私有配置，不进入仓库。没有向托管测试收件箱投递邮件，没有向无关用户发送邮件，也没有创建/删除任何托管用户或对象。托管清理登记为空；本地测试使用各自独立 fixture 与 Mailpit，完成后清理。

## 复现与证据

本轮本地浏览器原始 JSON：被忽略的 `.private-test-artifacts/hosted-preflight-local-browser.json`。只读 SQL 本地日志同样留在私有测试目录。公开交付仅保存状态、计数、路径及无敏感信息摘要。

本轮没有修改应用源码、原有测试、依赖、锁文件或已测试账户迁移；只新增审查资料、只读 SQL 与阶段登记。不会去掉 runner 的 loopback 限制把它强行指向云项目。

详细配置操作见 CLOUD_ENV_SETUP；现有/缺少对象未知及冲突/备份门见 HOSTED_SCHEMA_REVIEW；迁移方案尚不可申请批准。完成配置后重新核实有效运行状态，再继续只读审查，不重复未改变条件的失败连接。
