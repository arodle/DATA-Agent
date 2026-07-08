# Data Agent Platform 数据模型 V1

这个目录先作为正式开发的数据模型底座。当前推荐技术栈：Next.js + PostgreSQL + Prisma。

## 入口层

- 用户端：`User`、`Organization`、`Project`、`ProjectMember`
- 运营管理端：同一套 `Project`，但通过 `ProjectMember.role` 和 `OrganizationMember.role` 拿到更多字段与操作权
- 供应商执行端：`Supplier` + `ProjectTask.executorType = SUPPLIER`
- Agent 助手层：`AgentSession`、`AgentMessage`、`AgentAction`
- 公共数据库层：`PublicAsset`、`ToolTemplate`、`QualityScript`
- 社区生态层：`Skill`、`SkillVersion`、`OfficialPost`

## 项目主链路

核心对象是 `Project`。

用户可以自助执行：

- `Project.executionStatus = SELF_RUNNING`
- `ProjectTask.executorType = USER_SELF / AGENT_TOOL / OPEN_SOURCE_MODEL / INTERNAL_TOOL`

用户不能直接派供应商：

- 涉及供应商时，创建 `ProjectTask.executorType = SUPPLIER`
- 该任务必须由运营侧创建、审核或接管
- 通过 `OperationStatus` 记录运营介入状态

## 项目详情页对应模型

左侧基础信息：

- `Project`
- `ProjectRequirement`
- `Dataset`
- `ProjectToolConfig`

右侧流程区：

- `ProjectStage`
- `ProjectTask`
- `PrelabelRun`
- `QualityEvent`
- `ModelRun`
- `TrainingRecommendation`

底部日志：

- `OperationLog`
- `AgentAction`

## 公共数据库层

用 `PublicAsset` 统一存：

- COCO、VOC、KITTI、nuScenes、Cityscapes 等公开数据集
- 标注规则
- 采集规范
- 数据格式说明
- 模型能力说明
- FAQ
- 典型案例
- 行业模板
- 质检脚本模板

## 模型训练闭环

平台第一版不负责重训练大模型，先接入训练结果：

- `ModelEntity`：模型对象
- `ProjectModelBinding`：项目绑定模型
- `ModelRun`：训练/评估记录，可以存 W&B、MLflow、手工上传指标
- `TrainingRecommendation`：Agent 根据效果生成下一轮数据建议

闭环是：

`ModelRun.metricsJson / badcaseJson` -> Agent 分析 -> `TrainingRecommendation` -> 新的 `ProjectRequirement` 或 `ProjectTask`

## Agent 授权机制

所有 Agent 写入必须走：

1. `AgentAction.status = PREVIEW`
2. 生成 `previewJson` 和 `diffJson`
3. 用户确认后变成 `CONFIRMED`
4. 执行后变成 `EXECUTED`
5. 同时写 `OperationLog`

不要让 Agent 直接改正式业务表。

## 经验炼化层

成功项目沉淀到：

- `ProjectRetrospective`
- `AgentTrainingExample`
- `PublicAsset(type = CASE_STUDY / INDUSTRY_TEMPLATE / QUALITY_SCRIPT_TEMPLATE)`
- `Skill`

炼化流程：收集日志 -> 脱敏 -> 人工审核 -> 结构化 -> 进入知识库/训练样本。

## 建议第一期只实现这些表

最小可跑通：

1. `User`
2. `Organization`
3. `OrganizationMember`
4. `Project`
5. `ProjectMember`
6. `ProjectRequirement`
7. `ProjectStage`
8. `ProjectTask`
9. `Dataset`
10. `PublicAsset`
11. `AgentSession`
12. `AgentMessage`
13. `AgentAction`
14. `OperationLog`
15. `ModelEntity`
16. `ProjectModelBinding`
17. `ModelRun`
18. `TrainingRecommendation`

第二期再做：

- `Supplier`
- `QualityEvent`
- `QualityScript`
- `PrelabelRun`
- `Skill`
- `ProjectRetrospective`
- `AgentTrainingExample`

## 初始化命令

```bash
npx create-next-app@latest data-agent-platform
cd data-agent-platform
npm install prisma @prisma/client
npx prisma init
```

然后把本目录的 `schema.prisma` 覆盖到项目里的 `prisma/schema.prisma`。

```bash
npx prisma format
npx prisma migrate dev --name init
```
