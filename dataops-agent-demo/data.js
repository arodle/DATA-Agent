window.DATAOPS_SEED = {
  requirements: [
    {
      id: "REQ-1001",
      title: "人体关键点图像标注",
      org: "示例组织 A",
      owner: "林经理",
      type: "标注",
      modality: "图像",
      volume: 6996,
      acceptance: "24 点人体关键点，左右以人物自身为准，不可见点不标，关键点误差小于 3px。",
      priority: "P0",
      status: "已立项",
      dueDate: "2026-07-18",
      createdAt: "2026-07-07"
    },
    {
      id: "REQ-1002",
      title: "道路车辆 2D 框与属性标注",
      org: "示例组织 B",
      owner: "赵同学",
      type: "标注",
      modality: "图像",
      volume: 20000,
      acceptance: "车辆 2D 框 IoU 大于 0.85，类别准确率不低于 95%。",
      priority: "P1",
      status: "评估中",
      dueDate: "2026-07-26",
      createdAt: "2026-07-07"
    },
    {
      id: "REQ-1003",
      title: "客服录音转写与脱敏清洗",
      org: "示例组织 C",
      owner: "王运营",
      type: "清洗",
      modality: "音频",
      volume: 80,
      acceptance: "逐字转写、说话人区分、敏感信息脱敏，转写准确率不低于 98%。",
      priority: "P2",
      status: "待评估",
      dueDate: "2026-07-30",
      createdAt: "2026-07-07"
    }
  ],
  projects: [
    {
      id: "PRJ-2001",
      requirementId: "REQ-1001",
      name: "人体关键点标注交付项目",
      org: "示例组织 A",
      manager: "运营 A",
      stage: "供应商执行",
      status: "执行中",
      supplier: "Vendor-02",
      toolStatus: "已配置",
      qualityStatus: "待抽检",
      settlementStatus: "未开始",
      risk: "预算单待补充，供应商小批量复测未关闭",
      nextAction: "确认最终 24 点版本，完成小批量复测后放量"
    }
  ],
  batches: [
    {
      id: "BATCH-3001",
      projectId: "PRJ-2001",
      type: "首标",
      supplier: "Vendor-02",
      volume: 2000,
      unit: "张/人天",
      estimateEfficiency: 850,
      actualEfficiency: "",
      status: "进行中",
      plannedEnd: "2026-07-12",
      actualEnd: "",
      risk: "进度正常"
    },
    {
      id: "BATCH-3002",
      projectId: "PRJ-2001",
      type: "小批量复测",
      supplier: "Vendor-01",
      volume: 100,
      unit: "张/人天",
      estimateEfficiency: 700,
      actualEfficiency: "",
      status: "待启动",
      plannedEnd: "2026-07-10",
      actualEnd: "",
      risk: "试标质量波动，需先过抽检"
    }
  ],
  qualityEvents: [
    {
      id: "QINC-4001",
      projectId: "PRJ-2001",
      batchId: "BATCH-3002",
      ruleId: "RULE-5001",
      type: "点位偏移",
      severity: "P2",
      sample: "FRAME_0001~FRAME_0100",
      location: "left_ankle/right_ankle 偏低",
      impact: "100 张抽检样本",
      status: "处理中",
      action: "小批量返修复测",
      createdAt: "2026-07-07"
    }
  ],
  suppliers: [
    {
      id: "Vendor-01",
      name: "Vendor-01",
      tags: "图像关键点、2D 框",
      capacity: "可加班",
      qualityLevel: "B",
      efficiencyRange: "700-900 张/人天",
      status: "活跃",
      risk: "质量波动，需设置抽检门槛"
    },
    {
      id: "Vendor-02",
      name: "Vendor-02",
      tags: "人体关键点、图像分类",
      capacity: "稳定",
      qualityLevel: "A",
      efficiencyRange: "800-1000 张/人天",
      status: "活跃",
      risk: "产能有限，适合核心批次"
    },
    {
      id: "Vendor-03",
      name: "Vendor-03",
      tags: "语音转写、文本清洗",
      capacity: "充足",
      qualityLevel: "A-",
      efficiencyRange: "8-12 小时/人天",
      status: "活跃",
      risk: "需确认敏感信息脱敏规则"
    }
  ],
  rules: [
    {
      id: "RULE-5001",
      version: "V1.0",
      name: "人体关键点标注规则",
      type: "标注规范",
      modality: "图像",
      scope: "人体 24 点关键点",
      content: "左右以人物自身为准；不可见点不标；head 标头部中央；pelvis 位于左右髋连线偏中、小腹偏下。",
      metric: "关键点误差小于 3px，标签与点位表一致。",
      status: "启用"
    },
    {
      id: "RULE-5002",
      version: "V1.1",
      name: "车辆 2D 框标注规则",
      type: "标注规范",
      modality: "图像",
      scope: "道路车辆检测",
      content: "框紧贴车辆可见边界，遮挡部分不脑补，白色车辆同样必须标注。",
      metric: "IoU 大于 0.85，类别准确率不低于 95%。",
      status: "启用"
    },
    {
      id: "RULE-5003",
      version: "V1.0",
      name: "语音转写清洗规则",
      type: "清洗规范",
      modality: "音频",
      scope: "客服通话转写",
      content: "逐字转写，区分说话人，姓名、手机号、证件号等敏感信息需脱敏。",
      metric: "转写准确率不低于 98%，敏感信息脱敏准确。",
      status: "启用"
    }
  ],
  operations: [
    {
      id: "OP-6001",
      title: "上传样例数据",
      role: "用户",
      objectId: "REQ-1001",
      status: "已完成",
      dueDate: "2026-07-07",
      guide: "在数据服务平台进入需求详情，上传样例图片和字段说明。"
    },
    {
      id: "OP-6002",
      title: "补充预算单",
      role: "用户",
      objectId: "PRJ-2001",
      status: "待处理",
      dueDate: "2026-07-09",
      guide: "补充预算单或预算说明后，运营才能正式放量。"
    },
    {
      id: "OP-6003",
      title: "配置标注工具",
      role: "运营",
      objectId: "PRJ-2001",
      status: "已完成",
      dueDate: "2026-07-08",
      guide: "配置 24 点关键点模板、标签映射和导出 JSON 格式。"
    }
  ],
  settlements: [
    {
      id: "SET-7001",
      projectId: "PRJ-2001",
      supplier: "Vendor-02",
      period: "2026-07",
      volume: 2000,
      status: "未开始",
      checkResult: "质量事件未关闭，暂不进入结算"
    }
  ]
};
