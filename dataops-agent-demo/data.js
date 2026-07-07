window.DATAOPS_DEMO = {
  projects: [
    {
      id: "PRJ-002",
      requirementId: "REQ-002",
      name: "人体关键点标注项目",
      customer: "智驾算法客户 A",
      type: "标注",
      modality: "视频抽帧图片",
      stage: "供应商执行",
      status: "执行中",
      volume: "6996 张",
      deadline: "周三",
      risk: "预算单待确认",
      format: "JSON",
      nextAction: "确认 24 点版本，供应商 1 小批量质检，催办预算单"
    },
    {
      id: "PRJ-005",
      requirementId: "REQ-005",
      name: "街景车辆 2D 框标注",
      customer: "城市视觉客户 B",
      type: "标注",
      modality: "图像",
      stage: "质检返修",
      status: "执行中",
      volume: "20000 张",
      deadline: "2026-08-01",
      risk: "P1 漏标返修",
      format: "COCO JSON",
      nextAction: "等待质检完成，按缺陷类型生成返修批次"
    },
    {
      id: "PRJ-007",
      requirementId: "REQ-007",
      name: "客服录音转写清洗",
      customer: "金融客服客户 C",
      type: "清洗",
      modality: "音频",
      stage: "需求评估",
      status: "评估中",
      volume: "80 小时",
      deadline: "2026-07-20",
      risk: "验收口径缺失",
      format: "TXT + JSON",
      nextAction: "补充说话人区分和敏感信息处理规则"
    }
  ],
  requirements: [
    {
      id: "REQ-002",
      title: "人体 SMPLX 关键点标注",
      customer: "智驾算法客户 A",
      type: "标注",
      modality: "视频抽帧图片",
      description: "第一视角和第三视角交互视频抽帧，标注桌面前方单人的人体关键点。",
      acceptance: "关键点误差小于 3 pixels；不可见点不标；左右以人物自身左右为准。",
      volume: "6996 张",
      priority: "P0",
      status: "已立项"
    },
    {
      id: "REQ-005",
      title: "街景车辆 2D 框与属性标注",
      customer: "城市视觉客户 B",
      type: "标注",
      modality: "图像",
      description: "街景道路图片，标注车辆 2D 框、类型、遮挡和朝向。",
      acceptance: "2D 框 IoU 大于 0.85，车辆类别准确率不低于 95%。",
      volume: "20000 张",
      priority: "P0",
      status: "执行中"
    },
    {
      id: "REQ-007",
      title: "客服录音转写清洗",
      customer: "金融客服客户 C",
      type: "清洗",
      modality: "音频",
      description: "双人通话转写、说话人区分、敏感信息脱敏。",
      acceptance: "转写准确率不低于 98%，敏感信息脱敏准确。",
      volume: "80 小时",
      priority: "P1",
      status: "待评估"
    }
  ],
  batches: [
    {
      id: "BATCH-021",
      projectId: "PRJ-002",
      type: "首标",
      team: "Vendor-02",
      volume: "2000 张",
      estimate: "800 张/人天",
      actual: "进行中",
      status: "进行中",
      due: "周三",
      risk: "质量通过，排期可控"
    },
    {
      id: "BATCH-022",
      projectId: "PRJ-002",
      type: "小批量复测",
      team: "Vendor-01",
      volume: "100 张",
      estimate: "700 张/人天",
      actual: "待完成",
      status: "待启动",
      due: "今日",
      risk: "试标质量偏弱，需要先过抽检"
    },
    {
      id: "BATCH-031",
      projectId: "PRJ-005",
      type: "返修",
      team: "内部标注团队",
      volume: "450 张",
      estimate: "900 张/人天",
      actual: "待完成",
      status: "进行中",
      due: "2026-07-14",
      risk: "漏标样本集中，需要按规则复训"
    }
  ],
  qualityEvents: [
    {
      id: "QINC-005",
      projectId: "PRJ-005",
      batchId: "BATCH-031",
      ruleId: "RULE-001",
      type: "漏标",
      severity: "P1",
      sample: "IMG_0712_0450~IMG_0712_0899",
      location: "缺失(白色车辆未标注)",
      impact: "450 张",
      status: "处理中",
      action: "全量返修"
    },
    {
      id: "QINC-008",
      projectId: "PRJ-002",
      batchId: "BATCH-022",
      ruleId: "RULE-010",
      type: "点位偏移",
      severity: "P2",
      sample: "FRAME_0001~FRAME_0100",
      location: "left_ankle/right_ankle 偏低",
      impact: "100 张抽检",
      status: "待复查",
      action: "小批量复测"
    }
  ],
  vendors: [
    {
      id: "Vendor-01",
      name: "Vendor-01",
      capability: "图像关键点、2D 框",
      capacity: "可加班",
      quality: "B",
      efficiency: "700-900 张/人天",
      risk: "质量波动，需要质检门槛"
    },
    {
      id: "Vendor-02",
      name: "Vendor-02",
      capability: "人体关键点、图像分类",
      capacity: "稳定",
      quality: "A",
      efficiency: "800-1000 张/人天",
      risk: "产能有限，适合先接核心批次"
    },
    {
      id: "Vendor-03",
      name: "Vendor-03",
      capability: "语音转写、文本清洗",
      capacity: "充足",
      quality: "A-",
      efficiency: "8-12 小时/人天",
      risk: "需确认敏感信息脱敏规则"
    }
  ],
  rules: [
    {
      id: "RULE-010",
      version: "V1.0",
      name: "人体关键点标注规则",
      modality: "图像",
      requirement: "左右以人物自身左右为准；不可见点不标；head 标头部中央；pelvis 位于左右髋连线偏上、小腹偏下。",
      metric: "关键点误差小于 3 pixels；label 与点位表一致。"
    },
    {
      id: "RULE-001",
      version: "V1.1",
      name: "车辆 2D 框标注规则",
      modality: "图像",
      requirement: "框紧贴车辆可见边界，遮挡部分不脑补，白色车辆同样必须标注。",
      metric: "IoU 大于 0.85，类别准确率不低于 95%。"
    },
    {
      id: "RULE-003",
      version: "V1.0",
      name: "语音转写清洗规则",
      modality: "音频",
      requirement: "逐字转写，区分说话人，敏感信息脱敏。",
      metric: "转写准确率不低于 98%。"
    }
  ],
  faq: [
    {
      q: "正式创建标注任务需要准备什么？",
      a: "至少需要数据路径、规则文档、预算单或预算说明、交付格式和验收标准。"
    },
    {
      q: "试标结果有问题怎么反馈？",
      a: "先整理为质量事件，说明缺陷类型、影响范围、规则依据和返修要求，再同步给供应商。"
    },
    {
      q: "任务能否先不提交预算单？",
      a: "Demo 口径为：可保存草稿和试标建议，但正式放量前必须补齐预算单。"
    }
  ]
};
