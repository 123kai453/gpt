# HOSTED SCHEMA REVIEW

状态：**BLOCKED — 托管只读审查未执行**。2026-11-04。

目标 API：`https://lrehapbujedrwpxzhqrt.supabase.co`。代码基线：`8ca8d3e04a5d58b54f86f21679e9e115f716f5d5`。已有保存点 `0caad38` 为其祖先，不能倒退替换最新实现。

## 实际观察与未知项

| 项目 | 结果 |
|---|---|
| 运行时网络 | 项目域名未进入已生效白名单；代理 CONNECT 403，未到目标服务 |
| 凭据与数据库目录权限 | 当前未注入应用 key、服务端 Secret 或已授权数据库连接 |
| 已有表、索引、外键、函数、触发器、策略 | **未知**；未查询托管目录 |
| 缺少对象 | **未知**；不能将未能读取解释为空库或缺表 |
| 已应用迁移版本 | **未知**；未读托管迁移记录 |
| 当前数据与 Auth 用户 | **未知**；没有读取私人记录，没有假设用户数为 0 |
| 备份状态 | 本次未创建托管备份；现有平台备份未知 |
| 恢复演练 | 未执行 |
| 迁移执行 | 未申请最终执行，未运行，版本未登记 |

## 要比较的现有迁移

唯一目标迁移为 `supabase/migrations/20261103000100_account_foundation.sql`，版本 `20261103000100`，SHA256 `e3ee70b56d33b0ab3d4e73e95525a5d1c16fa94624901006a92387c9f405f436`。本轮不改写它。

以下是**源文件预期**，不是托管查询结果：

- public：profiles、user_preferences、user_consents、sync_metadata、user_data_exports、user_media、account_deletion_jobs。
- app_private：account_mutation_receipts、rate_limit_counters；共九张应用表启用 RLS。
- public 函数：has_current_auth_session、is_current_account_active、consume_account_rate_limit、apply_account_mutation、request_account_deletion。
- app_private 触发器函数：guard_owned_resource、clear_removed_avatar、create_account_defaults。
- 触发器：media_guard、exports_guard、deletion_jobs_guard、media_clear_avatar、auth.users 上 fitness_os_account_defaults。
- 私有桶 private-media：5 MiB，PNG/JPEG/WebP；Storage SELECT/INSERT/UPDATE/DELETE 本人策略与真实会话校验。
- Auth 外键级联、唯一用户名索引、其他索引/检查约束、列级授权与固定 search_path 应逐项对照源文件，不只数表。

## 需要重点排除的冲突

1. 任何同名应用表或既有 app_private schema 会让现有迁移主动中止；不能删除旧对象来绕过。
2. storage.objects **任意已有策略**会触发安全中止，包括其他桶的策略。PostgreSQL 宽松策略可能 OR 组合，不能只检查同名策略。
3. private-media 已有配置不一致时中止；不能自动改公开性或文件限制。
4. 现有同名函数/签名、触发器、索引以及迁移历史版本需要逐项比对；历史存在不等于内容一致。
5. 迁移会为**已有全部 Auth 用户**补充 profiles/preferences 默认行，并给后续 auth.users INSERT 加触发器。如果 Supabase 与其他应用共用，必须先确认影响范围和现有触发器，不把它当空项目。
6. has_current_auth_session 依赖实际 auth.sessions 的 session_id/user_id/not_after 语义；托管版本和权限需核实，本地兼容不能替代托管验证。

## 只读检查准备

已提供 [hosted_schema_readonly.sql](../supabase/reviews/hosted_schema_readonly.sql)。使用 `BEGIN READ ONLY`、15 秒 statement_timeout，仅查询目录、定义摘要、策略、授权、桶配置、迁移版本和计数，不导出私人行或密码。此脚本已在**本地 PostgreSQL**成功执行；托管执行仍未开始。

在目标项目 SQL Editor 或授权连接执行前，应先从外部确认项目身份。脚本的 current_database 往往只是 postgres，不能独自证明项目 ref。结果先作为私有审查资料保存，报告只记录必要对象/差异摘要，不公开原始数据。

## 备份与恢复方案（尚未执行）

备份需要覆盖应用 schema/data、函数/策略/触发器/权限、迁移历史以及本次会受影响的 Auth 触发器/用户关联。Auth 敏感备份应使用平台支持的方式私下保存，不能进入仓库。Storage 元数据备份**不包含对象二进制**，私人文件需另行受控备份，记录对象数量、校验和与恢复映射。

先确认平台现有备份是否覆盖这些范围及恢复权限，再选择逻辑备份或平台快照；免费套餐不保证存在可用快照或 PITR。恢复须先在独立环境演练，验证 Auth、FK、RLS 与 Storage 关联。当前没有可声称已验证的恢复点。

迁移失败先保存错误码并只读检查状态；不自动 DROP、TRUNCATE、reset 或执行未审查 down SQL。确认执行工具的事务行为；如果已有提交，不承诺一句 ROLLBACK 就能撤销，需经审查的前向修复或验证过的恢复方案。

## 执行顺序与审批门

配置发布生效 → 真实只读连接 → 目录与迁移差异 → 明确现有数据影响 → 完成并核验备份/恢复计划 → 生成最终可执行迁移计划 → **用户确认该计划** → 仅应用现有迁移 → 核查对象/权限/版本并记录真实部署时间 → 专用账号验收与清理。

当前计划尚不具备申请迁移批准的条件。此文档不是迁移批准，也不是已完成的托管审查结论。
