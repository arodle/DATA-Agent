window.DATAOPS_SEED = {
  projects: [
    {
      id: "TASK-1001",
      projectId: "PRJ-2001",
      taskName: "人体关键点图像标注",
      org: "示例组织 A",
      creator: "林经理",
      operator: "运营 A",
      supplier: "Vendor-02",
      type: "标注",
      modality: "图像",
      volume: 6996,
      startDate: "2026-07-07",
      endDate: "2026-07-18",
      taskStatus: "执行中",
      stage: "执行",
      priority: "P0",
      acceptance: "24 点人体关键点，左右以人物自身为准，不可见点不标，关键点误差小于 3px。",
      currentRisk: "预算单待补充，供应商小批量复测未关闭",
      nextAction: "供应商完成首批 2000 张后进入质检抽检"
    },
    {
      id: "TASK-1002",
      projectId: "PRJ-2002",
      taskName: "道路车辆 2D 框与属性标注",
      org: "示例组织 B",
      creator: "赵同学",
      operator: "运营 B",
      supplier: "待选配",
      type: "标注",
      modality: "图像",
      volume: 20000,
      startDate: "2026-07-07",
      endDate: "2026-07-26",
      taskStatus: "审核中",
      stage: "审核",
      priority: "P1",
      acceptance: "车辆 2D 框 IoU 大于 0.85，类别准确率不低于 95%。",
      currentRisk: "样例数据未补齐，供应商未选定",
      nextAction: "运营审核需求字段并确认样例数据"
    },
    {
      id: "TASK-1003",
      projectId: "PRJ-2003",
      taskName: "客服录音转写与脱敏清洗",
      org: "示例组织 C",
      creator: "王运营",
      operator: "运营 C",
      supplier: "Vendor-03",
      type: "清洗",
      modality: "音频",
      volume: 80,
      startDate: "2026-07-08",
      endDate: "2026-07-30",
      taskStatus: "创建中",
      stage: "创建",
      priority: "P2",
      acceptance: "逐字转写、说话人区分、敏感信息脱敏，转写准确率不低于 98%。",
      currentRisk: "验收口径缺失，安全信息待确认",
      nextAction: "用户补充脱敏规则和安全信息"
    },
    {
      id: "TASK-1004",
      projectId: "PRJ-2004",
      taskName: "街景图片采集质检",
      org: "示例组织 A",
      creator: "陈产品",
      operator: "运营 A",
      supplier: "Vendor-01",
      type: "质检",
      modality: "图像",
      volume: 5000,
      startDate: "2026-07-01",
      endDate: "2026-07-09",
      taskStatus: "验收中",
      stage: "验收",
      priority: "P1",
      acceptance: "采集清晰度、GPS 字段和时间戳完整性通过验收抽检。",
      currentRisk: "存在 1 条 P2 质量事件待复核",
      nextAction: "质检关闭事件后由用户确认验收"
    }
  ],
  stageDetails: {
    "创建": {
      title: "创建",
      customer: "补充需求、样例数据、安全信息和验收口径。",
      operator: "检查字段完整性，判断是否可进入审核。",
      vendor: "暂不可执行，等待运营确认任务范围。"
    },
    "审核": {
      title: "审核",
      customer: "等待运营评估规则、预算、交期和供应商资源。",
      operator: "确认需求可执行性，配置工具，选择供应商。",
      vendor: "查看预沟通信息，准备排期和试标资源。"
    },
    "执行": {
      title: "执行",
      customer: "查看执行进度和运营同步的风险说明。",
      operator: "跟进批次、效率、返修和供应商协作。",
      vendor: "执行标注/采集/清洗任务，提交进度和交付物。"
    },
    "验收": {
      title: "验收",
      customer: "检查交付结果，确认验收或提出返修意见。",
      operator: "汇总结论，关闭质量事件，准备结算复核。",
      vendor: "处理验收反馈，完成返修和最终交付。"
    }
  },
  operationLogs: [
    {
      id: "LOG-9001",
      projectId: "TASK-1001",
      time: "2026-07-07 09:12",
      actor: "林经理",
      role: "用户",
      action: "创建需求",
      note: "上传 6996 张图片，说明需要人体 24 点关键点标注。"
    },
    {
      id: "LOG-9002",
      projectId: "TASK-1001",
      time: "2026-07-07 10:20",
      actor: "运营 A",
      role: "运营",
      action: "审核通过",
      note: "确认标注规则、交付格式和首批执行范围。"
    },
    {
      id: "LOG-9003",
      projectId: "TASK-1001",
      time: "2026-07-07 14:35",
      actor: "Vendor-02",
      role: "供应商",
      action: "开始执行",
      note: "首批 2000 张进入执行，预计 7 月 12 日提交抽检。"
    },
    {
      id: "LOG-9004",
      projectId: "TASK-1002",
      time: "2026-07-07 11:05",
      actor: "赵同学",
      role: "用户",
      action: "提交需求",
      note: "道路车辆 2D 框标注，样例数据待补齐。"
    },
    {
      id: "LOG-9005",
      projectId: "TASK-1004",
      time: "2026-07-07 16:20",
      actor: "质检 A",
      role: "质检",
      action: "登记质量事件",
      note: "发现 GPS 字段缺失样本，等待供应商补充。"
    }
  ],
  batches: [
    { id: "BATCH-3001", projectId: "TASK-1001", type: "首标", supplier: "Vendor-02", volume: 2000, status: "进行中", plannedEnd: "2026-07-12", risk: "进度正常" },
    { id: "BATCH-3002", projectId: "TASK-1001", type: "小批量复测", supplier: "Vendor-01", volume: 100, status: "待启动", plannedEnd: "2026-07-10", risk: "试标质量波动" },
    { id: "BATCH-3003", projectId: "TASK-1004", type: "返修", supplier: "Vendor-01", volume: 260, status: "进行中", plannedEnd: "2026-07-09", risk: "待复核" }
  ],
  qualityEvents: [
    { id: "QINC-4001", projectId: "TASK-1001", batchId: "BATCH-3002", ruleId: "RULE-5001", type: "点位偏移", severity: "P2", impact: "100 张抽检样本", status: "处理中", action: "小批量返修复测" },
    { id: "QINC-4002", projectId: "TASK-1004", batchId: "BATCH-3003", ruleId: "RULE-5004", type: "字段缺失", severity: "P2", impact: "260 张", status: "处理中", action: "供应商补充字段" }
  ],
  suppliers: [
    { id: "Vendor-01", name: "Vendor-01", tags: "图像关键点、2D 框", capacity: "可加班", qualityLevel: "B", efficiencyRange: "700-900 张/人天", status: "活跃", risk: "质量波动，需设置抽检门槛" },
    { id: "Vendor-02", name: "Vendor-02", tags: "人体关键点、图像分类", capacity: "稳定", qualityLevel: "A", efficiencyRange: "800-1000 张/人天", status: "活跃", risk: "产能有限，适合核心批次" },
    { id: "Vendor-03", name: "Vendor-03", tags: "语音转写、文本清洗", capacity: "充足", qualityLevel: "A-", efficiencyRange: "8-12 小时/人天", status: "活跃", risk: "需确认敏感信息脱敏规则" }
  ],
  rules: [
    { id: "RULE-5001", version: "V1.0", name: "人体关键点标注规则", type: "标注规范", modality: "图像", scope: "人体 24 点关键点", content: "左右以人物自身为准；不可见点不标；head 标头部中央；pelvis 位于左右髋连线偏中、小腹偏下。", metric: "关键点误差小于 3px，标签与点位表一致。", status: "启用" },
    { id: "RULE-5002", version: "V1.1", name: "车辆 2D 框标注规则", type: "标注规范", modality: "图像", scope: "道路车辆检测", content: "框紧贴车辆可见边界，遮挡部分不脑补，白色车辆同样必须标注。", metric: "IoU 大于 0.85，类别准确率不低于 95%。", status: "启用" },
    { id: "RULE-5003", version: "V1.0", name: "语音转写清洗规则", type: "清洗规范", modality: "音频", scope: "客服通话转写", content: "逐字转写，区分说话人，姓名、手机号、证件号等敏感信息需脱敏。", metric: "转写准确率不低于 98%。", status: "启用" }
  ],
  prelabels: [],
  operations: [],
  settlements: [
    { id: "SET-7001", projectId: "TASK-1001", supplier: "Vendor-02", period: "2026-07", volume: 2000, status: "未开始", checkResult: "质量事件未关闭，暂不进入结算" }
  ]
};



