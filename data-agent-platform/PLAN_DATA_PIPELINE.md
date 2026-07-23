# 数据需求规划 → 标采完成 全链路真实打通方案

> 2026-07-20 | 基于当前代码库现状评估

---

## 一、现状评估

### 已有基础（可复用）
| 模块 | 状态 |
|---|---|
| 项目 CRUD（Projects/ProjectRequirement/ProjectStage/ProjectTask） | Prisma 实表，CRUD 就绪 |
| 数据资产管理（Dataset/DatasetVersion/FileObject/PublicAsset） | Prisma 实表，基本 CRUD 就绪 |
| 云连接 API（CloudConnection） | Prisma 实表，API 就绪 |
| Agent 数据模型（AgentSession/AgentMessage/AgentAction） | Prisma 实表，基础读写就绪 |
| Skill 系统（Skill/SkillVersion） | Prisma 实表 |
| 训练示例（AgentTrainingExample） | Prisma 实表，标注审批后自动写入 |
| 供应商/聊天/标注（SupplierChat/ChatAnnotation） | Prisma 实表，API 就绪 |
| 项目详情页（/user/projects/[code]） | 真实 Prisma 数据 |
| 运营工作台（/operator） | 真实 Prisma 数据 |

### 核心缺口（需从零构建）
| 缺口 | 影响链路环节 |
|---|---|
| **无认证系统** | 全链路 — currentUser 硬编码 |
| **Agent 对话全是 mock** | 需求分析/数据规划/方案设计 — 无真实 LLM |
| **供应商端 100% mock** | 供应商执行/量产验收/交付 — 无真实数据流 |
| **无工作流引擎** | 全链路 — 阶段推进靠手动模拟 |
| **无消息通知系统** | 供应商匹配/任务分配 — 角色间无法通信 |
| **无质量检测引擎** | 量产验收 — 质量判定靠 mock |
| **无结算计算引擎** | 交付结算 — 金额靠 mock |

---

## 二、链路定义

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  需求分析    │ →  │  数据规划    │ →  │  方案设计    │ →  │  任务发布    │
│  (用户↔Agent) │    │  (Agent → 用户)│    │  (Agent → 用户)│    │  (Agent → 运营)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  交付结算    │ ←  │  量产验收    │ ←  │  供应商执行   │ ←  │  供应商匹配   │
│  (运营→结算)  │    │  (质检→验收)  │    │  (供应商→质检) │    │  (Agent→运营) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

共 **8 个阶段**，跨越 **3 种角色**（用户、运营、供应商），全部由 **Agent 驱动流转**。

---

## 三、分阶段开发计划

### 阶段零：基础设施（预计最先做，打通所有后续依赖）

#### 0.1 认证系统
- **内容**：NextAuth.js v5 集成，支持账号密码 + OAuth
- **影响**：所有页面的 currentUser 硬编码替换
- **工作量**：中等
- **依赖此模块的阶段**：全部

#### 0.2 真实 LLM Agent 引擎
- **内容**：对接 LLM API（OpenAI/Claude/国产模型），实现 Agent 核心能力：
  - System Prompt 管理（不同阶段/角色的 Agent 人格）
  - Tool Calling（Function Calling → 数据库操作/外部 API）
  - 上下文管理（AgentSession + AgentMessage → prompt 拼接）
  - 流式输出（SSE → 前端打字机效果）
  - AgentAction 生命周期（PREVIEW → AUTHORIZED → EXECUTED）
- **技术方案**：Vercel AI SDK (`ai` + `@ai-sdk/openai`) 或直接 OpenAI API
- **工作量**：大
- **依赖此模块的阶段**：1, 2, 3, 4, 5

#### 0.3 工作流引擎
- **内容**：阶段状态机，定义阶段间的推进条件、触发动作、回退规则
- **数据模型扩展**：
  ```prisma
  // 增强 ProjectStage
  model ProjectStage {
    triggerCondition  String?   // JSON: 推进条件表达式
    autoActions       String?   // JSON: 自动触发的 AgentAction 列表
    enteredAt         DateTime?
    completedAt       DateTime?
  }
  ```
- **工作量**：中等
- **依赖此模块的阶段**：全部

#### 0.4 消息通知系统
- **内容**：
  - 数据库 Notification 表
  - 前端通知铃铛组件
  - 关键节点自动推送（任务分配、审核请求、验收完成等）
- **工作量**：小
- **依赖此模块的阶段**：5, 7, 8

---

### 阶段一：需求分析 Agent（用户端）

> 对应 workflow-demo 步骤 1-9

#### 1.1 核心 Agent 能力

| Agent 能力 | 实现方式 | 数据依赖 |
|---|---|---|
| **意图识别** | LLM 分类 → 标注/采集/清洗/质检 | System Prompt + 需求类型枚举 |
| **信息采集对话** | LLM 多轮对话 → 提取场景/模态/量级/精度等 | 对话上下文 |
| **历史项目推荐** | 向量检索 + LLM RAG → 相似需求匹配 | Project + ProjectRequirement 表 |
| **需求文档生成** | LLM 结构化输出 → 写入 ProjectRequirement.agentStructuredJson | 对话摘要 |
| **资产复用建议** | 匹配历史项目的 Dataset/Schema/AC规则 | Dataset/QualityScript 表 |

#### 1.2 需开发的前端页面
- **重构 `/user/workspace` 的新建项目对话框**：从表单 → 改为 Agent 对话式创建
  - 用户输入自然语言需求
  - Agent 多轮追问
  - 最终生成结构化需求文档并确认
- **保持 `/projects/new`** 作为快捷表单入口（兼容两种创建方式）

#### 1.3 需开发的 API
```
POST /api/agent/chat                    # Agent 对话（SSE 流式）
POST /api/agent/requirement/generate    # 生成需求文档
GET  /api/projects/search/similar       # 历史项目相似检索
```

---

### 阶段二：数据规划 Agent（用户端）

> 对应 workflow-demo 步骤 10-14

#### 2.1 核心 Agent 能力

| Agent 能力 | 实现方式 |
|---|---|
| **数据源方案生成** | LLM 根据需求类型/量级/场景 → 推荐采集/仿真/采购/混合方案 |
| **多方案对比** | 结构化输出 3-6 种方案的优劣/成本/周期对比表 |
| **决策辅助** | LLM 分析用户场景 → 给出推荐方案及理由 |

#### 2.2 需开发的前端页面
- 复用 `/user/projects/[code]` 项目详情页的 Agent Tab
- 新增"数据规划"子 Tab，展示方案对比卡片（类似 operator assets 内置资产的数据源方案卡片）

#### 2.3 数据模型（已有基础）
- 数据源方案可复用 `operator/assets` 中"内置资产 → 数据源方案"的模板数据
- 方案数据写入 `Project` 或新建 `DataPlan` 模型

---

### 阶段三：方案设计 Agent（用户端 → 运营端）

> 对应 workflow-demo 步骤 15-16

#### 3.1 核心 Agent 能力

| Agent 能力 | 实现方式 |
|---|---|
| **采标方案拆分** | LLM 根据需求量级 → 拆分为多个批次/阶段 |
| **费用预估** | 公式计算（量级 × 供应商均价） + LLM 生成明细表 |
| **任务生成** | AgentAction Pending → 运营审核后执行 → 写入 ProjectTask |

#### 3.2 AgentAction 生命周期
```
用户对话中 Agent 生成方案
       │
       ▼
AgentAction (status=PREVIEW, previewJson={方案详情})
       │
       ▼
运营端 /operator/agent 看到待授权列表
       │
       ▼
运营审核 → AUTHORIZED → 自动创建 ProjectTask + 写入 ProjectStage
```

#### 3.3 需开发的 API
```
POST /api/agent/action/preview        # Agent 创建待审核动作
POST /api/agent/action/authorize      # 运营授权动作
GET  /api/agent/cost/estimate         # 费用预估
```

---

### 阶段四：任务发布（运营端）

> 对应 workflow-demo 步骤 17

#### 4.1 运营端任务工作台
- `/operator/projects/[code]` 项目详情页增加"任务发布"操作
- 展示 Agent 生成的采标方案 → 运营可调整拆分/分配 → 确认发布

#### 4.2 核心数据流
```
Agent 生成的 ProjectTask (status=DRAFT)
       │
       ▼
运营调整(修改量级/分配供应商/设置截止日期)
       │
       ▼
确认发布 → ProjectTask status=PUBLISHED → 通知供应商
```

---

### 阶段五：供应商匹配（运营端 → 供应商端）

> 对应 workflow-demo 步骤 18-19

#### 5.1 Agent 匹配推荐
- **匹配因子**：供应商 capabilityTags（模态/任务类型）、qualityLevel（质量评分）、efficiencyRange（效率范围）、riskNote（风险提示）
- **实现方式**：规则引擎 + LLM 排序推荐

#### 5.2 供应商端改造（最大工作量）
**供应商端当前 100% mock，需要全部改造为真实数据驱动：**

| 页面 | 改造内容 |
|---|---|
| `/supplier` 任务管理 | 从 Prisma ProjectTask 读取真实任务 |
| `/supplier/annotation` 标注执行 | 接入真实数据集 + 标注工具 |
| `/supplier/collection` 采集执行 | 接入真实数据源 + 采集进度 |
| `/supplier/rules` 规则库 | 从 QualityScript 读取真实规则 |
| `/supplier/quality` 质量分析 | 接入真实 QualityEvent 数据 |
| `/supplier/delivery` 交付 | 真实交付记录 + 文件上传 |
| `/supplier/settlement` 结算 | 真实结算计算 + 记录 |

#### 5.3 供应商角色权限真实化
- 当前 `SupplierRoleContext` 是 mock 状态切换
- 需要基于真实认证 + Supplier 表做权限判断

---

### 阶段六：供应商执行（供应商端）

> 对应 workflow-demo 步骤 20-21

#### 6.1 标注工作台真实化
- 标注画布接入真实文件对象（FileObject）
- 标注工具（框选/分类/描点等）→ 标注结果写入数据库
- 试标评估：小批量标注 → 自动质检 → 通过/不通过

#### 6.2 采集工作台真实化
- 采集任务分配
- 采集进度上报
- 采集数据自动入 Dataset

#### 6.3 质检能力
- 脚本化质检（QualityScript 执行）
- 质量事件记录（QualityEvent）
- 质量看板数据聚合

---

### 阶段七：量产验收（运营端 + 供应商端）

> 对应 workflow-demo 步骤 22-24

#### 7.1 验收流程
```
供应商提交批次 → 自动质检(脚本) → 人工抽检 → 通过/驳回 → 批次状态更新
```

#### 7.2 AC 验收规则执行
- 从 `ProjectRequirement.acceptanceCriteria` 读取验收标准
- 对接质检脚本，自动判定是否达标

#### 7.3 需开发的 API
```
POST /api/delivery/submit          # 供应商提交交付
POST /api/quality/auto-check       # 自动质检
POST /api/acceptance/review        # 人工验收
GET  /api/acceptance/stats         # 验收统计
```

---

### 阶段八：交付结算（运营端 + 供应商端）

> 对应 workflow-demo 步骤 25-26

#### 8.1 结算计算引擎
- 基于 ProjectTask.completedVolume × 单价
- 支持阶梯计价、扣款规则
- 生成结算单（写入新表或扩展现有表）

#### 8.2 数据资产沉淀
- 验收通过的数据 → 自动创建 Dataset + DatasetVersion
- 标注结果 → Schema 资产库
- 质检脚本 → QualityScript 复用库
- 项目经验 → ProjectRetrospective + AgentTrainingExample

---

## 四、Agent 能力全景

```
                    ┌──────────────────────────────┐
                    │       Agent 能力矩阵           │
                    ├──────────┬───────────────────┤
                    │  角色     │  核心能力           │
                    └──────────┴───────────────────┘
                    
  用户端 Agent        运营端 Agent        供应商端 Agent
  ───────────        ───────────        ────────────
  • 需求对话          • 方案审核           • 任务接收
  • 意图识别          • 供应商匹配         • 标采执行指引
  • 信息提取          • 报价对比           • 规范解答
  • 方案推荐          • 风险预警           • 质量自检
  • 历史复用          • 进度监控           • 问题上报
  • 费用预估          • 质检调度           • 日报生成
  • 文档生成          • 结算审核
  • 任务跟踪
```

### Agent 技术架构

```
┌─────────────────────────────────────────────────┐
│                  Agent 引擎层                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ LLM 路由  │ │Tool Call │ │ 上下文管理器      │ │
│  │(多模型)   │ │ 执行器    │ │(Session+Memory)  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────┤
│                  Agent 能力层                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ 需求 Agent│ │ 规划 Agent│ │ 匹配 Agent       │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ 质检 Agent│ │ 结算 Agent│ │ 知识 Agent       │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────┤
│                  Agent 工具层                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ 数据库 CRUD│ │ 向量检索  │ │ 外部 API 调用    │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 各 Agent 的 Tool 定义

#### 用户端 Agent Tools
```typescript
tools: {
  // 需求相关
  searchSimilarProjects:  // 语义检索历史项目
  generateRequirementDoc: // 生成结构化需求文档
  estimateDataVolume:     // 估算数据量级
  
  // 规划相关
  recommendDataStrategy:  // 推荐数据源方案
  estimateCost:           // 费用预估
  generateTaskBreakdown:  // 生成任务拆分方案
  
  // 查询相关
  queryProjectProgress:   // 查询项目进度
  querySupplierInfo:      // 查询供应商信息
}
```

#### 运营端 Agent Tools
```typescript
tools: {
  reviewAndAuthorize:     // 审核并授权 AgentAction
  matchSuppliers:         // 供应商智能匹配
  createProjectTask:      // 创建并发布任务
  triggerQualityCheck:    // 触发质检流程
  calculateSettlement:    // 计算结算金额
  queryAllProjects:       // 全量项目查询
}
```

#### 供应商端 Agent Tools
```typescript
tools: {
  acceptTask:             // 接收任务
  submitBatch:            // 提交批次
  queryAnnotationRules:   // 查询标注规则
  reportProgress:         // 上报进度
  requestSupport:         // 请求运营支持
  generateReport:         // 生成日报/周报
}
```

---

## 五、数据模型补充

### 需新增的表

```prisma
// 数据规划方案
model DataPlan {
  id          String   @id @default(uuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  planType    String   // COLLECTION | SIMULATION | PURCHASE | HYBRID
  detail      String   // JSON: 方案详情
  estimatedCost Float
  estimatedDays  Int
  selected    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

// 标注结果
model AnnotationResult {
  id          String   @id @default(uuid())
  taskId      String
  fileId      String
  annotatorId String
  content     String   // JSON: 标注内容(框/分类/属性等)
  status      String   @default("DRAFT") // DRAFT | SUBMITTED | REVIEWED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 交付记录
model Delivery {
  id          String   @id @default(uuid())
  projectId   String
  supplierId  String
  batchLabel  String
  fileCount   Int
  totalVolume Int
  status      String   // SUBMITTED | CHECKING | APPROVED | REJECTED
  submittedAt DateTime @default(now())
  checkedAt   DateTime?
  approvedAt  DateTime?
}

// 结算单
model Settlement {
  id          String   @id @default(uuid())
  projectId   String
  supplierId  String
  period      String   // 结算周期标识
  totalAmount Float
  details     String   // JSON: 明细
  status      String   // DRAFT | CONFIRMED | PAID
  createdAt   DateTime @default(now())
}

// 通知
model Notification {
  id          String   @id @default(uuid())
  userId      String
  type        String   // TASK_ASSIGNED | REVIEW_NEEDED | DELIVERY_SUBMITTED | ...
  title       String
  content     String
  relatedId   String?  // 关联实体 ID
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

---

## 六、开发优先级与估算

| 优先级 | 阶段 | 内容 | 原因 |
|---|---|---|---|
| P0 | 0.1 认证系统 | NextAuth.js 集成 | 全链路依赖 |
| P0 | 0.2 LLM Agent 引擎 | Agent 核心 + SSE 流式 | 阶段1-5依赖 |
| P0 | 0.3 工作流引擎 | 阶段状态机 | 全链路流转 |
| P1 | 阶段一 | 需求分析 Agent + 对话式创建 | 链路起点 |
| P1 | 阶段二 | 数据规划 Agent | 紧接需求 |
| P1 | 阶段三 | 方案设计 Agent + AgentAction 授权 | 衔接运营端 |
| P2 | 阶段五 | 供应商匹配 + 供应商端真实化 | 最大工作量 |
| P2 | 阶段四 | 任务发布 | 依赖阶段五的前置 |
| P3 | 阶段六 | 供应商执行（标注/采集工作台） | 核心业务 |
| P3 | 阶段七 | 量产验收 | 质检链路 |
| P4 | 阶段八 | 交付结算 + 资产沉淀 | 收尾闭环 |
| P4 | 0.4 消息通知 | 通知系统 | 体验增强 |

---

## 七、技术选型建议

| 层面 | 推荐方案 | 备选 |
|---|---|---|
| 认证 | NextAuth.js v5 | Clerk, Auth0 |
| LLM SDK | Vercel AI SDK (`ai` + `@ai-sdk/openai`) | LangChain, 直接 OpenAI SDK |
| 向量检索 | Prisma + sqlite-vss（轻量）, 或 Pinecone | pgvector, Weaviate |
| 流式输出 | SSE (Server-Sent Events) via AI SDK | WebSocket |
| 工作流 | 自研轻量状态机（基于 ProjectStage） | Temporal, Inngest |
| 文件存储 | 公司云/第三方云 API 对接（已有 CloudConnection） | Vercel Blob |
| 部署 | Vercel（前端）+ 独立后端（如需要） | Railway, 阿里云 SAE |
