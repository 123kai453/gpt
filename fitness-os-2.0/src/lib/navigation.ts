export interface ModulePage {
  slug: string;
  title: string;
  eyebrow: string;
  phase: number;
  description: string;
  capabilities: readonly string[];
  parent?: string;
}

export const modules: readonly ModulePage[] = [
  { slug: "sports", title: "运动中心", eyebrow: "MOVEMENT", phase: 3, description: "每一种热爱，都值得被认真记录。统一的运动入口，为不同运动保留各自的专业指标。", capabilities: ["力量与游泳专属记录", "全部运动的手动记录", "可扩展运动类型与来源追踪"] },
  { slug: "sports/strength", parent: "sports", title: "力量训练", eyebrow: "STRENGTH", phase: 3, description: "从自主计划到每一组训练，建立属于你的力量体系。", capabilities: ["动作库、手动计划与不可变版本", "重量、次数、RIR / RPE 与休息", "训练快照、PR 与肌群训练量"] },
  { slug: "sports/plans", parent: "sports", title: "自主训练计划", eyebrow: "YOUR TRAINING PLAN", phase: 3, description: "由你安排每一周训练，AI 只是可选辅助。", capabilities: ["手动创建、编辑、复制和删除", "日 / 周 / 周期与休息日", "版本和执行快照；修改不覆盖历史"] },
  { slug: "sports/swimming", parent: "sports", title: "游泳", eyebrow: "SWIMMING", phase: 3, description: "泳池里的每一趟，都有自己的节奏。", capabilities: ["泳姿、池长与分趟", "实际游进、休息与出发间隔分开记录", "技术练习、配速与历史表现"] },
  { slug: "sports/outdoor-run", parent: "sports", title: "户外跑步", eyebrow: "OUTDOOR RUN", phase: 3, description: "从手动记录开始，把每一次出发连成长期进步。", capabilities: ["距离、时长、分段与配速", "心率、步频与来源", "前台 GPS 路线在 PHASE 4 开放"] },
  { slug: "sports/treadmill", parent: "sports", title: "跑步机爬坡", eyebrow: "TREADMILL", phase: 3, description: "平跑与爬坡，保留每次训练的真实条件。", capabilities: ["速度、距离和时长", "坡度百分比与普通跑步机模式", "心率及明确标注的消耗估算"] },
  { slug: "sports/indoor-cycle", parent: "sports", title: "室内动感单车", eyebrow: "INDOOR CYCLING", phase: 3, description: "用自己的节奏，积累耐力。", capabilities: ["时长、踏频与心率", "设备提供的距离、功率与阻力", "未知指标保留为空，不编造"] },
  { slug: "sports/hike", parent: "sports", title: "徒步与登山", eyebrow: "HIKING", phase: 3, description: "走向更远的地方，也看见自己的变化。", capabilities: ["距离、时长与强度", "有来源的海拔与累计爬升", "路线与定位隐私在 PHASE 4 实现"] },
  { slug: "sports/elliptical", parent: "sports", title: "椭圆机", eyebrow: "ELLIPTICAL", phase: 3, description: "低冲击训练，同样值得完整记录。", capabilities: ["时长与阻力", "设备提供的步频与距离", "心率和训练感受"] },
  { slug: "sports/rowing", parent: "sports", title: "划船机", eyebrow: "ROWING", phase: 3, description: "在一推一拉之间，找到稳定的节奏。", capabilities: ["距离与时长", "500 米配速与桨频", "设备提供的功率与心率"] },
  { slug: "sports/jump-rope", parent: "sports", title: "跳绳", eyebrow: "JUMP ROPE", phase: 3, description: "轻装上阵，记录每一组坚持。", capabilities: ["次数、组数与时长", "组间休息和间歇", "心率及强度"] },
  { slug: "sports/stair-climber", parent: "sports", title: "登山机", eyebrow: "STAIR CLIMBER", phase: 3, description: "一步一步，向上积累。", capabilities: ["时长、等级与速度", "楼层或步数及设备来源", "心率与训练感受"] },
  { slug: "sports/other", parent: "sports", title: "其他运动", eyebrow: "YOUR MOVEMENT", phase: 3, description: "运动不止一种定义，为你的热爱留出空间。", capabilities: ["自定义名称与分类", "时长、距离和强度", "受校验的自定义指标"] },
  { slug: "nutrition", title: "营养中心", eyebrow: "NOURISH", phase: 5, description: "吃得明白，记录轻松。让营养成为长期训练的支持。", capabilities: ["饮食、食品与计划", "食品包装多图识别与确认", "程序计算与历史营养快照"] },
  { slug: "nutrition/log", parent: "nutrition", title: "饮食记录", eyebrow: "FOOD JOURNAL", phase: 5, description: "记录每一餐，逐渐了解自己的饮食节奏。", capabilities: ["早餐、午餐、晚餐与加餐", "用量与营养快照", "日、周、月趋势"] },
  { slug: "nutrition/library", parent: "nutrition", title: "私人食品库", eyebrow: "FOOD LIBRARY", phase: 5, description: "常吃的食物，不必反复认识。", capabilities: ["品牌、规格与自定义标签", "最近使用、收藏与复用", "配料表和营养来源"] },
  { slug: "nutrition/recognition", parent: "nutrition", title: "食品识别", eyebrow: "FOOD RECOGNITION", phase: 5, description: "把包装信息看清楚，再由你确认。", capabilities: ["正面、背面、配料、营养表与条码多图关联", "字段证据、校对与确认", "估重明确标注；不补造营养数据"] },
  { slug: "nutrition/analysis", parent: "nutrition", title: "营养分析", eyebrow: "NUTRITION INSIGHTS", phase: 5, description: "让有来源的数据，帮助你理解饮食。", capabilities: ["热量与有依据的营养素统计", "目标完成度", "正确区分每份、每 100g 与每 100ml"] },
  { slug: "nutrition/plans", parent: "nutrition", title: "饮食计划", eyebrow: "MEAL PLANS", phase: 5, description: "不依赖 AI，也能制定适合自己的饮食计划。", capabilities: ["纯手动创建与编辑", "餐次、份量与目标", "计划版本和确认"] },
  { slug: "ai", title: "AI 私人教练", eyebrow: "YOUR INTELLIGENCE", phase: 7, description: "辅助你思考，始终由你决定。", capabilities: ["OpenAI 与 Gemini 可扩展路由", "训练、运动和饮食分析", "预算限制与计划修改确认"] },
  { slug: "ai/training", parent: "ai", title: "训练分析", eyebrow: "TRAINING INSIGHTS", phase: 7, description: "在真实记录之上，理解长期训练。", capabilities: ["训练趋势与总结", "来源可追溯", "修改计划前必须确认"] },
  { slug: "ai/nutrition", parent: "ai", title: "饮食分析", eyebrow: "NUTRITION COACH", phase: 7, description: "从饮食记录中发现可以调整的细节。", capabilities: ["仅使用当前用户授权数据", "营养计算由程序完成", "建议与事实明确区分"] },
  { slug: "ai/memory", parent: "ai", title: "长期记忆", eyebrow: "LONG-TERM MEMORY", phase: 7, description: "记住你的偏好，也尊重你的改变。", capabilities: ["偏好、纠正与历史摘要", "查看、编辑、删除和导出", "派生摘要与来源同步更新"] },
  { slug: "ai/models", parent: "ai", title: "模型设置", eyebrow: "MODEL SETTINGS", phase: 7, description: "按任务选择能力，按预算控制使用。", capabilities: ["OpenAI / Gemini Provider", "服务端密钥与用量日志", "无 Key 时保留手动流程"] },
  { slug: "data", title: "数据中心", eyebrow: "YOUR PROGRESS", phase: 2, description: "你的数据，由你掌握。", capabilities: ["私人资料与身体数据", "来源、单位和时区", "安全导出与删除"] },
  { slug: "data/body", parent: "data", title: "身体数据", eyebrow: "BODY METRICS", phase: 2, description: "关注长期变化，不急于定义每一天。", capabilities: ["体重、围度与体成分", "测量日期和来源", "历史资料需确认后导入"] },
  { slug: "data/trends", parent: "data", title: "运动趋势", eyebrow: "ACTIVITY TRENDS", phase: 3, description: "让持续发生的运动，成为看得见的进步。", capabilities: ["运动频率与训练量", "时间范围和来源清晰", "有真实记录后才显示图表"] },
  { slug: "data/history", parent: "data", title: "训练历史", eyebrow: "TRAINING HISTORY", phase: 3, description: "保留每一次努力原本的样子。", capabilities: ["执行记录与计划快照", "版本修改不覆盖历史", "真实记录和导入来源"] },
  { slug: "data/personal", parent: "data", title: "个人数据", eyebrow: "DATA OWNERSHIP", phase: 2, description: "安全保存，也能够带走。", capabilities: ["JSON / CSV 导出", "数据删除", "多用户隔离与云同步"] },
  { slug: "devices", title: "设备中心", eyebrow: "CONNECTED, BY CHOICE", phase: 8, description: "连接你的设备，保留你的选择。当前没有连接任何设备。", capabilities: ["逐项验证平台权限和真实数据范围", "来源追踪、去重与撤销", "文件导入和手动记录回退"] },
  { slug: "devices/apple", parent: "devices", title: "Apple Health", eyebrow: "APPLE HEALTH", phase: 8, description: "未连接。HealthKit 需要原生 iPhone 伴侣应用，网页不能直接调用。", capabilities: ["逐类授权与安全同步", "数据范围与历史窗口待验证", "不承诺实时或锁屏持续采集"] },
  { slug: "devices/huawei", parent: "devices", title: "Huawei Health", eyebrow: "HUAWEI HEALTH", phase: 8, description: "未连接。H1–H5 五条候选路径均保留，具体能力待官方与真机验证。", capabilities: ["H1 Android · H2 iOS 候选 · H3 官方云候选", "H4 Health Connect · H5 HarmonyOS 原生候选", "SDK、地区、资格、scope 和数据范围待验证"] },
  { slug: "devices/health-connect", parent: "devices", title: "Android Health Connect", eyebrow: "HEALTH CONNECT", phase: 8, description: "未连接。只能读取源应用实际写入且获授权的数据。", capabilities: ["不等同于直连所有华为手表", "逐类权限与来源", "历史、去重及删除验证"] },
  { slug: "devices/files", parent: "devices", title: "设备文件导入", eyebrow: "FILE FALLBACK", phase: 8, description: "为支持的设备导出格式保留低成本回退。", capabilities: ["CSV / JSON Schema 校验", "预览、确认与来源保留", "不把文件导入显示为真实设备已连接"] },
  { slug: "community", title: "社区", eyebrow: "MOVE TOGETHER", phase: 3, description: "分享训练思路，保留私人边界。", capabilities: ["主动发布的计划快照", "搜索、收藏与复制", "默认不公开健康指标和精确路线"] },
  { slug: "community/plans", parent: "community", title: "公开训练计划", eyebrow: "PUBLIC PLANS", phase: 3, description: "发现新的训练思路，复制后由你调整。", capabilities: ["仅搜索已发布快照", "复制到自己的私人空间", "可撤回发布"] },
  { slug: "community/favorites", parent: "community", title: "我的收藏", eyebrow: "SAVED PLANS", phase: 3, description: "保存值得再次打开的训练灵感。", capabilities: ["私人收藏", "公开快照访问控制", "收藏与复制分开处理"] },
  { slug: "community/share", parent: "community", title: "分享计划", eyebrow: "SHARE WITH INTENT", phase: 3, description: "选择要公开的内容，再确认分享。", capabilities: ["二次确认与字段白名单", "不附带私人身体与 GPS 数据", "取消发布"] },
  { slug: "community/profile", parent: "community", title: "个人主页", eyebrow: "YOUR SPACE", phase: 3, description: "由你决定，哪些内容可以被看见。", capabilities: ["公开资料与私人资料分离", "已发布计划", "默认保护健康数据"] },
  { slug: "import", title: "智能导入", eyebrow: "BRING YOUR HISTORY", phase: 6, description: "把已有的计划与记录带进来，先预览，再确认。", capabilities: ["长文本、图片、截图", "TXT / MD / PDF / DOCX", "原文、纠错、字段来源与防覆盖"] },
  { slug: "settings", title: "偏好设置", eyebrow: "MAKE IT YOURS", phase: 1, description: "现在可以切换并保存外观。账户、隐私与同步设置将在 PHASE 2 开放。", capabilities: ["深色与浅色主题已可使用", "选择仅保存在当前浏览器", "不保存任何健康数据"] },
  { slug: "admin", title: "管理中心", eyebrow: "SYSTEM OPERATIONS", phase: 2, description: "后续建立受控管理界面。当前没有管理权限或私人数据接口。", capabilities: ["公共素材与受审计配置", "模型和成本管理在 PHASE 7 扩展", "管理员默认不能随意查看私人健康数据"] },
  { slug: "explore", title: "探索 FITNESS OS", eyebrow: "ONE SYSTEM, YOUR RHYTHM", phase: 1, description: "运动、营养与长期进步，在同一个系统中相遇。", capabilities: ["全部产品入口", "清楚标注各阶段", "没有数据时保持真实空态"] },
];

export const topModules = modules.filter((module) => !module.parent && module.slug !== "explore");
export function getModule(slug: string) { return modules.find((module) => module.slug === slug); }
export function getChildren(slug: string) { return modules.filter((module) => module.parent === slug); }
export function phaseLabel(phase: number) { return phase === 1 ? "PHASE 1 · 基础已开放" : `PHASE ${phase} · 尚未开放`; }
