# 数据库设计基线

Codex必须补齐字段类型、索引、外键、约束、RLS和迁移脚本。

## 用户
profiles、user_preferences、user_settings

## 身体
body_metrics、body_measurements、body_composition

## 力量训练
exercises、exercise_media、training_plans、training_plan_versions、training_plan_days、training_plan_exercises、workout_sessions、workout_exercises、workout_sets、personal_records

## 通用运动
activity_types、activity_sessions、activity_metrics、activity_laps、activity_routes、activity_route_points、activity_sources、activity_notes
可扩展运动指标采用明确Schema或受控JSONB，并验证单位和字段；不能让任意无效JSON污染核心数据。

## 游泳
swimming_sessions或activity_sessions的专属扩展、swimming_intervals、swimming_drills、swimming_records、swimming_styles

## 营养与食品
foods、food_products、food_product_images、food_labels、food_ingredients、food_nutrition、food_barcodes、meals、meal_items、nutrition_records、user_food_favorites

## 智能导入
import_jobs、import_sources、import_assets、import_parsed_records、import_confirmations
保存原文/文件引用、解析版本、识别字段、置信度、校验错误、用户确认状态。敏感原文件按保留策略管理。

## 可穿戴设备
wearable_connections、wearable_permissions、wearable_devices、wearable_sync_jobs、wearable_records、wearable_source_links
保存provider、device_id、metric_type、value、unit、start/end时间、source_record_id、dedup_key、permission_scope、synced_at。令牌必须安全存储，不能明文暴露给客户端。

## AI与记忆
ai_conversations、ai_messages、ai_memories、ai_memory_summaries、ai_model_configs、ai_usage_logs

## 社区与系统
shared_plans、user_favorites、notifications、audit_logs

## 关键原则
- 私人数据表必须有user_id并配置RLS。
- 公开计划单独授权，不公开私人表。
- 计划版本不能覆盖历史训练。
- 食品营养保存基准量、单位、来源、原文和确认状态。
- 多图属于同一商品导入任务，可追踪每张图提取的字段来源。
- 运动记录保存时区和数据来源。
- GPS点属于敏感个人数据，默认私人。
- 可穿戴数据使用幂等去重键，重复同步不得重复计数。
- 设备权限撤销后停止同步；用户可删除导入数据。
- AI记忆可追溯、可编辑、可删除。
