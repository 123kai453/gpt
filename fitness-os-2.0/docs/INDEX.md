# 文档索引

项目根目录：`/workspace/fitness-os-2.0`。下列17份工作文档均直接位于 `docs/`，含隐藏文件 `.env.example`。

| 文档 | 审阅结论 |
| --- | --- |
| [README.md](README.md) | 交付物为文档包而非网站源码；低成本和授权边界明确。 |
| [PRD.md](PRD.md) | 覆盖13个需求章节；发现管理员权限、收藏搜索、食物估重、液体密度和历史身体信息等须补入此前报告。 |
| [FEATURES.md](FEATURES.md) | 每个勾选条目独立建立覆盖记录；原状态保持未开始。 |
| [DESIGN.md](DESIGN.md) | 深浅主题、减少动态、手机降级、付费/公开/删除二次确认与真实状态。 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 采用src/features模块化单体；运动注册表、专属扩展与统一连接器。 |
| [DATABASE.md](DATABASE.md) | 逐项实体保留并映射关系；补充类型、索引、复合归属外键与RLS方案，尚未执行迁移。 |
| [API.md](API.md) | 11个服务边界；导入确认、设备增量/撤权、AI结构化校验与服务端预算。 |
| [MASTER_PROMPT.txt](MASTER_PROMPT.txt) | 原则与需求保留；工作副本已按正式决定统一0–10；旧编号原文仍在档案。 |
| [PHASES.md](PHASES.md) | 0–10独立GPS阶段；报告逐阶段映射，不丢弃旧路线能力。 |
| [CODING_RULES.md](CODING_RULES.md) | 16项规范作为后续验收门槛；按当前用户授权执行PHASE 1，后续阶段仍需确认。 |
| [INITIAL_TRAINING_DATA.md](INITIAL_TRAINING_DATA.md) | 历史身体/力量/游泳/疼痛数据只读审查；日期和现状不明，不自动seed到真实账户。 |
| [TEST_CASES.md](TEST_CASES.md) | 逐条建立验收映射，全部未执行；不将文档检查作为应用测试通过。 |
| [CHANGELOG.md](CHANGELOG.md) | 原始需求基线保留，本阶段变更另写项目根CHANGELOG。 |
| [.env.example](.env.example) | 模板无真实值；OPENAI_等变量名可能受当前云平台限制，后续使用受支持映射；未创建.env.local。 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 测试/生产隔离、GPS/原生边界、发布检查保留；未部署。 |
| [BACKUP.md](BACKUP.md) | 数据库与对象存储分开备份；用户导出/删除、恢复演练需实体覆盖。 |
| [WEARABLE_INTEGRATION.md](WEARABLE_INTEGRATION.md) | 官方链接是研究入口而非验证证据；具体SDK/范围待核实；禁止非官方抓取。 |

原始副本与 ZIP hash 见项目根 `DOCUMENT_MANIFEST.json`；17份原始文件位于 `documentation-originals/FITNESS-OS-2.0-PROJECT/`。PHASE 0整理时仅README和MASTER_PROMPT调整导航；PHASE 1另在工作MASTER中落实正式0–10路线。17份档案原文保持不变。

本阶段新增材料：

- [技术报告](../PHASE_0_TECHNICAL_REPORT.md)
- [需求覆盖与验收映射](../REQUIREMENTS_COVERAGE.md)
- [设备研究及适配器边界](../WEARABLE_RESEARCH.md)
- [完整能力矩阵CSV](../WEARABLE_CAPABILITY_MATRIX.csv)
- [功能状态](../FEATURES_STATUS.md)
- [检查报告](../TEST_REPORT.md)
- [阶段变更记录](../CHANGELOG.md)


## PHASE 1工作记录

- [正式项目决策与旧阶段映射](PROJECT_DECISIONS.md)
- [PHASE 1初始实施报告（历史保留）](PHASE1_IMPLEMENTATION_REPORT.md)
- [安装与启动说明](../README.md)
- [64项实际功能状态](../FEATURES.md)

原docs/FEATURES.md为原始功能清单；根FEATURES.md记录实现状态。历史PHASE 0报告中的待确认事项，以PROJECT_DECISIONS的新决定为准；具体平台能力验证仍未自动完成。

- [PHASE 1正式执行授权原文](PHASE1_EXECUTION_PROMPT.txt)

## PHASE 1最终交付准备

- [当前最终交付报告（保留GitHub原报告，不覆盖）](../delivery/phase1/PHASE1_IMPLEMENTATION_REPORT.md)
- [Windows与手机运行方案](WINDOWS_LOCAL_RUN.md)
- [机器可读最终检查](../delivery/phase1/FINAL_CHECK_RESULTS.json)
- [截图索引](../delivery/phase1/screenshots/SCREENSHOT_MANIFEST.json)

## PHASE 1.1视觉工作记录

- [执行授权原文](PHASE1_1_EXECUTION_PROMPT.txt)
- [视觉实施报告](PHASE1_1_VISUAL_REPORT.md)
- [图片来源与尺寸](VISUAL_ASSETS.md)
- [图片完整元数据](VISUAL_ASSETS.json)
- [动效规范](MOTION_DESIGN.md)

## GitHub完整交付版本

- [发布说明与历史状态解释](../delivery/phase1-1/PUBLISH_NOTES.md)
- [GitHub可直接查看的七组截图](../delivery/phase1-1/SCREENSHOTS.md)
- [PHASE 1.1交付时完整实施记录](../delivery/phase1-1/PHASE1_IMPLEMENTATION_REPORT.md)

## PHASE 2 账户与云同步

当前 Cloud 工作目录：`/workspace/fitness-os-phase2/fitness-os-2.0`。上方 PHASE 0/1 审阅结论是历史记录，以各阶段最新验证报告区分当前状态。原始 17 份档案保持不变。

- [正式执行指令](PHASE2_EXECUTION_PROMPT.txt)
- [实施报告](PHASE2_IMPLEMENTATION_REPORT.md)
- [数据库结构与后续扩展](DATABASE_SCHEMA.md)
- [安全与 RLS](SECURITY_AND_RLS_REPORT.md)
- [同步架构](SYNC_ARCHITECTURE.md)
- [环境配置](ENV_SETUP.md)
- [实际测试报告](TEST_REPORT.md)

## PHASE 2 托管最终验收（当前 BLOCKED）

- [托管执行指令](PHASE2_HOSTED_EXECUTION_PROMPT.txt)
- [总报告](PHASE2_HOSTED_ACCEPTANCE_REPORT.md)
- [Schema 审查状态](HOSTED_SCHEMA_REVIEW.md)
- [迁移方案草案](HOSTED_MIGRATION_PLAN.md)
- [安全报告](HOSTED_SECURITY_REPORT.md)
- [同步报告](HOSTED_SYNC_REPORT.md)
- [实际测试报告](HOSTED_TEST_REPORT.md)
- [Cloud 配置操作说明](CLOUD_ENV_SETUP.md)
- [只读目录检查 SQL](../supabase/reviews/hosted_schema_readonly.sql)
- [BRAND STUDIO 强制阶段锁](BRAND_STUDIO_PHASE_LOCK.md)

本地、托管、正式网站分开记录；旧阶段报告为对应提交的历史证据，不将本地通过等同于托管通过。
