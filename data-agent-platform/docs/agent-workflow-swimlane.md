# 数据标采 Agent 项目流程图

## 1. 分层总览

```mermaid
flowchart TB
  L1[产品入口层\n用户端 / 运营管理端 / 供应商质检端] --> L2[项目对象层\n项目列表 / 项目详情 / 阶段看板]
  L2 --> L3[Agent 助手层\n对话理解 / 预览动作 / 授权写入 / 高亮步骤]
  L3 --> L4[业务执行层\n需求文档 / 数据资产 / 工具配置 / 预标注 / 质检 / 验收]
  L4 --> L5[数据与知识层\n需求版本 / 数据存储 / 规则库 / 公共数据集 / 模型结果]
  L5 --> L6[沉淀训练层\n操作日志 / 对话日志 / 成功项目复盘 / Agent 训练样本]
```

## 2. 用户到任务完成泳道图

```mermaid
flowchart LR
  subgraph U[用户端]
    U1[进入项目列表]
    U2[新建项目草稿]
    U3[选择数据资产]
    U4[上传或绑定需求文档 PDF]
    U5[与 Agent 对话\n一句话描述下一步]
    U6[查看 Agent 预览]
    U7[授权 Agent 写入]
    U8[查看项目进度和交付结果]
    U9[确认验收]
  end

  subgraph A[Agent 助手层]
    A1[解析用户输入]
    A2[识别意图\n需求结构化 / 工具配置 / 预标注 / 质检脚本]
    A3[读取项目上下文\n需求文档版本 / 数据资产 / 当前阶段]
    A4[生成 AgentAction 预览]
    A5[等待用户授权]
    A6[授权后写入业务对象]
    A7[高亮当前步骤]
    A8[写入对话日志和操作日志]
  end

  subgraph O[运营管理端]
    O1[查看全部授权项目]
    O2[审核需求文档版本]
    O3[审核验收口径 AC 条款]
    O4[审核工具配置和样例效果]
    O5[决定执行方式\n用户自执行 / Agent 工具 / 供应商执行]
    O6[分配供应商或执行任务]
    O7[跟进进度 / 风险 / 返修]
    O8[结算与复盘]
  end

  subgraph S[供应商 / 质检端]
    S1[接收运营分配任务]
    S2[查看规则和验收口径]
    S3[执行采集 / 标注 / 清洗 / 质检]
    S4[提交批次结果]
    S5[接收质量事件和返修要求]
    S6[完成返修 / 复检]
  end

  subgraph D[数据与模型层]
    D1[数据资产记录\n名称 / 数量 / 路径 / 类型]
    D2[公共数据集\nCOCO / Open Images / 模板数据]
    D3[工具配置]
    D4[预标注结果]
    D5[质量事件]
    D6[训练结果]
    D7[下一步训练建议]
  end

  U1 --> U2 --> U3 --> U4 --> U5
  U5 --> A1 --> A2 --> A3 --> A4 --> U6 --> U7 --> A6
  A6 --> O1
  O1 --> O2 --> O3 --> O4 --> O5
  O5 -->|用户自执行 / Agent 工具| D3
  O5 -->|供应商执行| S1
  S1 --> S2 --> S3 --> S4 --> D5
  D3 --> D4 --> O4
  D5 --> O7
  O7 -->|需要返修| S5 --> S6 --> D5
  O7 -->|通过| U8 --> U9
  U9 --> D6 --> D7
  A4 --> A8
  A6 --> A8
  O8 --> A8
```

## 3. 当前项目已实现的最小闭环

```mermaid
sequenceDiagram
  participant User as 用户
  participant UI as 项目详情页
  participant Agent as Agent 动作层
  participant DB as SQLite / Prisma
  participant Ops as 运营

  User->>UI: 输入一句话，例如“帮我写漏标质检脚本”
  UI->>Agent: submitAgentMessage(projectCode, message)
  Agent->>Agent: 识别意图并生成预览动作
  Agent->>DB: 写入 AgentMessage
  Agent->>DB: 写入 AgentAction(status=PREVIEW)
  Agent->>DB: 写入 OperationLog
  DB-->>UI: 返回项目详情页
  UI-->>User: 显示新的待授权动作
  User->>UI: 点击授权
  UI->>DB: AgentAction.status = AUTHORIZED
  UI->>DB: 更新项目阶段和操作日志
  Ops->>UI: 审核工具配置与样例效果
  Ops->>DB: 通过审核，进入执行阶段
```

## 4. 关键对象关系

```mermaid
flowchart LR
  P[Project 项目] --> R[ProjectRequirement\n需求文档 / 结构化摘要 / 验收口径]
  P --> DS[Dataset\n数据名称 / 数据量 / 存储路径 / 存储类型]
  P --> ST[ProjectStage\n创建 / 审核 / 执行 / 验收]
  P --> TC[ProjectToolConfig\n工具配置 / 样例效果]
  P --> PR[PrelabelRun\n开源模型预标注]
  P --> AS[AgentSession\nAgent 对话会话]
  AS --> AM[AgentMessage\n用户与 Agent 消息]
  AS --> AA[AgentAction\n预览 / 授权 / 执行结果]
  P --> Q[QualityEvent\n缺陷 / 返修 / 质检记录]
  P --> M[ModelRun\n训练结果]
  M --> MR[ModelRecommendation\n下一步训练建议]
  P --> LOG[OperationLog\n全流程操作日志]
```

## 5. 功能清单按列拆解

| 列 | 当前功能 | 下一步功能 |
|---|---|---|
| 用户端 | 新建项目、选择数据资产、查看项目详情、Agent 对话、授权预览 | 上传需求文档、预览版本差异、确认验收、查看训练建议 |
| Agent 助手层 | 根据用户输入生成 AgentAction 预览、记录消息、等待授权 | 接真实 LLM、生成字段 diff、生成工具配置、生成质检脚本、调用开源模型 |
| 运营管理端 | 查看项目列表、审核工具配置、通过审核进入执行 | 审核需求版本、审核 AC 验收条款、分配供应商、处理返修、结算复核 |
| 供应商 / 质检端 | 规划中 | 接任务、看规则、提交结果、接收质量事件、返修复检 |
| 数据与模型层 | 数据资产字段、PDF 版本、预标注预览、训练结果展示 | 公共数据集检索、真实文件存储、模型训练记录、badcase 分析 |
| 沉淀训练层 | 操作日志、Agent 消息、AgentAction | 成功项目复盘、脱敏训练样本、Skill 市场、Agent 能力迭代 |
```