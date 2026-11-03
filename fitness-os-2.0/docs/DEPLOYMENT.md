# 部署与平台边界

## Web/PWA
本地开发；测试/生产环境分离；部署前核实免费套餐暂停、容量、带宽和商业用途条款。

## GPS
浏览器Geolocation要求安全上下文和用户授权。PWA前台可尝试路线记录；后台/锁屏连续定位不保证。可靠后台追踪需原生伴侣应用。

## Apple
HealthKit是iOS原生框架，需原生iOS app配置HealthKit capability、隐私说明并请求逐类授权。Web/PWA不能直接调用。原生桥接应用把用户授权数据安全同步到云端。

## Huawei
先确认目标设备、HarmonyOS/Android/iOS、地区、Huawei Health Kit/Health Connect可用性、开发者资格、API范围、审核与用户授权。不可用时使用文件导入或手动记录。

## 发布检查
环境变量、迁移、RLS、HTTPS、登录、手机适配、PWA、备份恢复、设备授权撤销、GPS隐私。
