# 设备研究与独立适配器设计（PHASE 0）

## 证据等级与当前结论

日期：2026-11-03。`docs/PRD.md` §8、`docs/ARCHITECTURE.md`、`docs/WEARABLE_INTEGRATION.md` 为产品需求依据，不等于官方证明。本次再次读取 Apple 两个入口、Huawei、Android 官方入口时均收到代理 403，详见 `OFFICIAL_SOURCE_CHECKS.json`。没有获得 SDK、开发者后台、真机或授权样本。所有具体数据读写能力、scope 和字段映射都保持待验证；不可根据产品目标把支持状态设为 true。

稳定的平台边界：HealthKit 是原生能力，普通 Web/PWA 不能直接调用；PWA 不承诺锁屏后台 GPS。后续原生桥接需要平台权限、真机验证和用户授权，不等于云端已有通用手表 API。

## 华为“五种路径”的可追溯性

收到的17份文件没有明确编号列出五种华为接入方式。它们列出 Android/HarmonyOS/iOS/Web 的核实要求、Health Kit/Health Connect，以及文件/手动回退。因此以下五项是为推进独立适配器设计所作的**候选拆分**，不是声称这是用户已经确认的五项，也不是声称各项均存在可申请的官方接口。需要用户补充原五项列表或确认这份拆分；该不确定性不阻碍其他 PHASE 0 工作。

| ID | 独立适配器设计名 | 所在端/边界 | 存在性及外部前提 | 当前状态 |
| --- | --- | --- | --- | --- |
| H1 | HuaweiHealthKitAndroidAdapter | Android 原生侧 → 安全云同步 | 目标 Health Kit Android SDK、版本、资格、地区、scope、签名和审核待官方确认 | 候选；未实现；未验证 |
| H2 | HuaweiHealthKitiOSAdapter | iOS 原生侧（若目标官方 SDK 提供） | 不能由多平台宣传推断 iOS SDK 完整能力，需确认是否提供、范围和地区 | 候选；SDK可用性未确认 |
| H3 | HuaweiOfficialCloudAdapter | 服务端或官方支持的 Web/OAuth 流程（若存在） | 不假设有通用健康云 REST API；应用资质、官方端点、授权流程、回调、历史范围均未知 | 候选；API存在性未确认 |
| H4 | AndroidHealthConnectAdapter | Android 健康数据中转 → 后端 | Health Connect SDK/系统要求、权限和华为源应用实际写入需分别确认；不是直连华为手表 | 候选；华为数据覆盖未知 |
| H5 | HarmonyOSNativeHealthAdapter | HarmonyOS 原生健康能力 → 后端 | 系统代际、设备/手机、SDK开放资格、分发地区待核实；不复用 Android HMS 能力假设 | 候选；原生能力范围未知 |

另设 A1 `AppleHealthKitAdapter`（iPhone原生桥接）、F1 `FileImportAdapter`、M1 `ManualAdapter`。文件/手动回退独立于上述五个候选，不混称设备实连。若原五项实际包含这些回退，应调整文档 ID 映射，而不是虚构第五个厂商 API。

只做接口文档和模型设计，未创建连接器业务代码，未购买或申请服务。

## 统一连接器契约

操作沿用 API 文档：connect、authorize、getCapabilities、syncIncremental、disconnect、revoke、normalizeRecords。文档层补充以下约束：

- connect 只创建待授权连接；authorize 必须通过平台真实授权，不以“已保存设置”冒充“已授权”。原生平台授权无须强行建模为 OAuth。
- getCapabilities 按 provider、SDK/OS版本、地区、设备与数据类型返回：`unverified / unsupported / documented / device_verified`，另记录授权观察状态；未验证不能显示“支持”。
- capability 的读/写、实时/历史分别独立；UI 的展示由证据与当前授权共同决定。实现时默认禁用写回设备。
- syncIncremental 包含游标、批次幂等键、数据来源、删除/更新标记、重试状态；同一游标提交和数据写入事务化，失败不能提前推进游标。
- disconnect 停调度；revoke 尝试平台支持的撤权及本地凭证清理。无法远程撤权时引导用户去系统设置，仍立即停本系统同步。
- normalizeRecords 保留 provider 原 ID、source app/设备、原单位/值、UTC 时间、原时区/偏移、来源许可和原始引用。未知时区标记 unknown，不擅自解释为北京时间。
- HealthKit 的读权限状态不能简单用授权请求成功推断，空结果也不能区分所有拒绝/无数据情况；状态应如实显示“未取得可用数据/读取授权未确认”，以目标 API 的可观察结果为准。

## capability matrix

完整逐路径逐指标矩阵在 `WEARABLE_CAPABILITY_MATRIX.csv`：6条平台候选路径（A1、H1–H5）×15种指标=90行。每行记录可读、可写、实时/历史、采样粒度、地区、权限scope、审核、字段样例、单位、时区、依据、待验证状态。文件/手动回退不视为设备能力，不混入90行。

覆盖 steps、heart_rate、resting_heart_rate、active_energy、workout、distance、pace、sleep、route、elevation、cycling_cadence、swimming_laps、swimming_stroke、power、body_metrics。后五类用于验证专属运动和身体数据，不表示原文承诺任何厂商都有该指标。

所有字段样例为**合成的内部标准化格式**，不是 SDK 返回样本；单位是内部建议，不是官方原始单位；scope 不填猜测的权限字符串。实测后须增加官方数据标识与原始单位映射。配速等程序推导可作为 derived 独立记录，不混进设备 measured 指标。

## Apple 路线

Apple Watch/其他源 → Apple Health/HealthKit → iPhone companion → 本项目后端 → Web/PWA。系统同步不保证实时，原生后台投递也不是无限持续运行。初版只读训练/健康数据，若要 Watch 上独立开始训练或实时采集则另设 watchOS app 里程碑。真机、Mac/Xcode、受支持系统与签名/分发条件必须另行验证。

申请逐类权限、用途说明和 HealthKit capability；审核健康数据用途、隐私政策、允许存储/处理方式及删除/撤权流程。HealthKit 不提供可由任意网页直接获取数据的通用云 key。官方实际历史范围、读取保护、后台通知、路线访问条件均待核实。

## 各路径接入研究检查表

| 路径 | 必查事项 | 测试前置材料 |
| --- | --- | --- |
| A1 | HealthKit数据类型/读写授权、后台通知、增量与删除、分发与隐私要求 | iPhone/Watch/OS型号、Mac/Xcode、合法开发签名、用户授权样本 |
| H1 | Android/HMS/Health Kit版本、个人或企业资格、开放地区、scope/签名及申请 | 手机/手表/账号地区、开发者后台审批、官方SDK |
| H2 | iOS SDK是否存在且对目标地区开放、能力与Android差异 | 官方当前文档、支持矩阵和真机应用 |
| H3 | 官方云接口是否存在、谁能申请、OAuth/服务端鉴权/回调、删除通知 | 官方端点与合同/资格依据；没有依据不得构造请求 |
| H4 | Health Connect最低系统要求、数据权限/历史限制、源app是否实际写入 | 配对手机、源app版本、脱敏源记录及读取结果 |
| H5 | HarmonyOS代际、健康SDK/权限与开发者资格、手机/表端边界 | 具体系统和设备、官方工具链、批准权限及样本 |

统一真机验收：空库、授权拒绝、部分授权、断网、重复批次、跨源重复、UTC/时区切换、夏令时、采样缺口、权限撤回、历史记录更新/删除、账号退出及删除。仅出现 PID、成功回调或模拟样本不构成真实能力验证。

官方入口：
- https://developer.apple.com/documentation/healthkit/
- https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
- https://developer.huawei.com/consumer/en/hms/huaweihealth/
- https://developer.android.com/health-and-fitness/guides/health-connect

这些入口当前未能读取；审核时间、收费、个人/企业资格及每条scope都待官方确认。不得以非官方抓取、用户密码或绕过平台授权替代。
