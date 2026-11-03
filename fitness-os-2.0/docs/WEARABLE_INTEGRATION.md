# 可穿戴设备接入策略

## 产品目标
后续支持Apple Watch与华为手表数据读取，但本阶段先建立接口、数据模型、权限状态、模拟器和回退方式，不把实际连接列为首阶段上线条件。

## Apple
Apple官方HealthKit文档说明，HealthKit是iPhone/Apple Watch健康健身数据中心，应用需逐类请求用户读取/共享授权。HealthKit是原生框架；普通网页/PWA不能直接调用。实际方案：开发原生iOS companion app，启用HealthKit capability和用途说明，按需申请数据类型权限，将用户授权的数据安全同步至FITNESS OS后端。需考虑用户撤销授权、有限历史访问、删除数据和来源去重。

官方参考：
- https://developer.apple.com/documentation/healthkit/
- https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data

## Huawei
华为官方Health Kit页面说明其生态支持多平台，并允许在用户授权后读取开放的健身健康数据。但实际可用能力取决于具体SDK、设备、地区、开发者资质、数据类型、权限申请和审核。不能假设所有华为设备或所有数据类型都可直接读取。

需由Codex在实施前查阅最新官方文档并输出：
- 目标设备型号及系统要求
- Android/HarmonyOS/iOS/Web各自接入方式
- 可读取数据类型和历史范围
- 开发者注册/实名认证/权限申请条件
- 测试用户限制、审核周期、商用条件和费用
- 数据授权与撤销流程

官方入口：
- https://developer.huawei.com/consumer/en/hms/huaweihealth/

## 统一标准化
指标建议：steps、heart_rate、resting_heart_rate、active_energy、workout、distance、pace、sleep、route、elevation、cycling_cadence等。每条记录保留provider、device、source_id、timestamp、unit、permission scope、sync time和dedup key。设备没有提供的指标不得推算成实测值。

## 回退方案
- Apple Health导出或经原生桥接同步（按平台实际支持）。
- Huawei官方健康平台授权同步或官方支持的健康数据中转。
- CSV/JSON文件导入。
- 手动记录。

不得使用非官方抓取、破解、绕过权限或要求用户提供账号密码的方式。
