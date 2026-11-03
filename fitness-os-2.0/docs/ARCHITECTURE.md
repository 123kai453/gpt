# 技术架构

## Web核心建议
Next.js + React + TypeScript；Tailwind + shadcn/ui；Motion；Three.js/React Three Fiber按需引入；PostgreSQL + Supabase；PWA Service Worker + IndexedDB；Zod；Vitest/Playwright。

## 模块边界
- auth：认证和权限
- training：力量计划和训练
- sports：通用运动中心与各运动适配器
- swimming：游泳专属数据
- nutrition：食品、商品包装、餐次和营养
- import-center：长文本、图片、文档解析
- wearable：设备连接器和标准化数据
- ai：Provider Adapter、任务路由和预算
- memory：长期记忆
- sync：离线队列和冲突处理
- media：图片/视频/3D对象存储

## 运动类型架构
采用通用 `activity_sessions` + `activity_metrics` + `activity_laps/splits` + `activity_routes` + `activity_sources`，并为游泳等复杂运动保留专属表/字段。运动类型由配置/注册表管理，定义必填字段、单位、指标和表单Schema。不要为每一种运动复制一套完全独立的会话逻辑。

## GPS
- Web Geolocation仅在安全上下文、用户授权和设备支持时使用。
- 前台记录路线，保存带时间戳的位置点；记录精度、来源和权限。
- 路线计算需过滤漂移点，避免速度/距离异常。
- iOS PWA后台持续定位不作保证；需要锁屏/后台稳定记录时规划原生iOS/Android伴侣应用。
- 精确路线默认私人；分享前进行明确确认和隐私模糊处理选项。

## 可穿戴设备架构
定义统一接口 `WearableConnector`：
- connect / authorize
- getCapabilities
- syncIncremental
- disconnect / revoke
- normalizeRecords

连接器：
- AppleHealthKitConnector：后续由原生iOS伴侣应用实现；通过HealthKit权限读取后安全同步云端。纯Web/PWA不能直接调用HealthKit。
- HuaweiHealthConnector：根据实际Huawei Health Kit/Health Connect/HarmonyOS SDK、设备型号、地区、开发者资格和数据授权情况实现；先做技术可行性验证。
- FileImportConnector：支持标准化CSV/JSON等文件导入，作为低成本回退。
- ManualConnector：手动录入。

## 设备数据标准化
记录provider、设备/型号、指标类型、数值、单位、采样时间、来源ID、授权状态、同步时间、原始来源引用、去重键。保留来源，不重复累计同一活动或同一数据点。设备缺少某指标时显示不可用，不得编造。

## AI
服务端统一Provider Adapter；按任务路由；Zod校验结构化输出；预算熔断；密钥仅服务端。

## 安全
RLS、服务端鉴权、速率限制、文件权限、最小化敏感数据。GPS、睡眠、心率和身体数据默认私人。

## 目录建议
src/app
src/features/{dashboard,auth,training,sports,swimming,nutrition,import-center,wearable,ai-coach,memory,community,admin}
src/lib/{ai,database,calculations,validation,storage,sync,geo}
src/types
supabase/migrations
public/{images,exercises,sports,swimming,models}
tests
docs
