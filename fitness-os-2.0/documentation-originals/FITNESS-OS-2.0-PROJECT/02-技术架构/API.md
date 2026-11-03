# API与服务接口规范

## 服务
AuthService、TrainingService、SportsService、SwimmingService、NutritionService、ImportService、WearableService、MemoryService、AIService、MediaService、SyncService。

## AI Provider统一接口
generateText、generateStructuredOutput、analyzeImage、parseDocument、usageMetadata、统一错误格式。所有模型输出必须Schema校验。

## 智能导入接口
- createImportJob
- uploadImportAsset
- parseText
- parseImages
- parseDocument
- validateParsedData
- previewImport
- confirmImport
- cancelImport

导入确认前不得写入正式计划/历史记录。保留原始文本和解析来源。

## 运动接口
- createActivity
- updateActivity
- addSplit
- addRoutePoints
- pause/resume/finish GPS session
- importActivityFile

## 可穿戴接口
WearableConnector：connect、authorize、getCapabilities、syncIncremental、disconnect、revoke、normalizeRecords。
实际Apple/Huawei适配需独立评估，不得假设Web端可直接访问原生API。

## AI路由
简写解析：低成本文本模型+Schema校验。
食品标签：OCR/视觉模型+用户确认。
复杂训练总结：较强推理模型。
确定性计算：程序执行，不调用大模型。

## 安全
AI请求服务端执行；密钥安全存储；限制频率、文件大小、输出长度；预算超限熔断。设备令牌不返回前端。
