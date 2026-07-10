"use client";

import { useState } from "react";

type SkillItem = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  official: boolean;
  usageCount: number;
  rating: number | null;
};

type AgentActionItem = {
  id: string;
  actionType: string;
  status: string;
  projectCode: string | null;
  createdAt: Date;
  authorizedAt: Date | null;
  executedAt: Date | null;
};

type AgentSessionItem = {
  id: string;
  title: string | null;
  context: string;
  messageCount: number;
  actionCount: number;
  createdAt: Date;
};

type ToolItem = {
  id: string;
  name: string;
  toolType: string;
  status: string;
  projectCode: string | null;
  createdAt: Date;
};

const agentActionLabels: Record<string, string> = {
  STRUCTURE_REQUIREMENT: "结构化需求",
  GENERATE_TOOL_CONFIG: "生成工具配置",
  RUN_OPEN_SOURCE_PRELABEL: "开源模型预标注",
  GENERATE_QUALITY_SCRIPT: "生成质检脚本",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  PREVIEW: { bg: "#fff8e6", text: "#9b6400" },
  AUTHORIZED: { bg: "#e9fbf3", text: "#0aa866" },
  EXECUTED: { bg: "#edf4ff", text: "#2d65c7" },
  FAILED: { bg: "#fff0f3", text: "#c41e3a" },
};

type Props = {
  skills: SkillItem[];
  actions: AgentActionItem[];
  sessions: AgentSessionItem[];
  tools: ToolItem[];
};

const subTabs = [
  { key: "skills", label: "Skill 管理" },
  { key: "orchestration", label: "任务编排" },
  { key: "memory", label: "知识记忆" },
  { key: "tools", label: "工具调用" },
  { key: "growth", label: "能力成长" },
];

const skillCategories = [
  { key: "all", label: "全部" },
  { key: "需求理解", label: "需求理解" },
  { key: "数据分析", label: "数据分析" },
  { key: "算法分析", label: "算法分析" },
  { key: "标注方案", label: "标注方案生成" },
  { key: "质量评估", label: "质量评估" },
  { key: "资源调度", label: "资源调度" },
];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export default function AgentConsoleClient({ skills, actions, sessions, tools }: Props) {
  const [subTab, setSubTab] = useState("skills");
  const [skillFilter, setSkillFilter] = useState("all");

  const filteredSkills = skillFilter === "all"
    ? skills
    : skills.filter((s) => s.category.includes(skillFilter));

  const totalUsage = skills.reduce((sum, s) => sum + s.usageCount, 0);
  const officialCount = skills.filter((s) => s.official).length;

  return (
    <>
      <header className="roleTopbar">
        <div>
          <p className="crumb">用户视角 / Agent 控制台</p>
          <h1>Agent 控制台</h1>
        </div>
        <div className="topbarRight">
          <span className="statusTag">{skills.length} 个 Skill · {actions.length} 次调用</span>
          <button className="primaryBtn">配置 Agent</button>
        </div>
      </header>

      <div className="agentBanner">
        <span className="agentBannerIcon">🤖</span>
        <div>
          <strong>AI Agent 能力中枢</strong>
          <p>管理 Agent 的专业技能、任务编排、知识记忆与工具调用，持续优化服务效果</p>
        </div>
      </div>

      <div className="subTabBar">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            className={subTab === tab.key ? "subTabItem active" : "subTabItem"}
            onClick={() => setSubTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "skills" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>Skill 库</h3>
            <div className="skillStats">
              <span>总 Skill：{skills.length}</span>
              <span>官方：{officialCount}</span>
              <span>累计调用：{totalUsage} 次</span>
            </div>
          </div>
          <div className="skillFilterBar">
            {skillCategories.map((cat) => (
              <button
                key={cat.key}
                className={skillFilter === cat.key ? "skillFilterChip active" : "skillFilterChip"}
                onClick={() => setSkillFilter(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="skillGrid">
            {filteredSkills.map((skill) => (
              <div className="skillCard" key={skill.id}>
                <div className="skillCardHead">
                  <div className="skillInfo">
                    <strong>{skill.name}</strong>
                    <span className="skillCategory">{skill.category}</span>
                  </div>
                  {skill.official && <span className="officialBadge">官方</span>}
                </div>
                <p className="skillDesc">{skill.description ?? "暂无描述"}</p>
                <div className="skillMeta">
                  <span>调用 {skill.usageCount} 次</span>
                  {skill.rating && <span>评分 {skill.rating.toFixed(1)}</span>}
                </div>
                <div className="skillActions">
                  <button className="linkBtn">查看详情</button>
                  <button className="linkBtn">测试调用</button>
                </div>
              </div>
            ))}
            {filteredSkills.length === 0 && (
              <div className="emptyState">暂无 Skill</div>
            )}
          </div>
        </div>
      )}

      {subTab === "orchestration" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>任务编排</h3>
            <button className="outlineBtn">新建编排</button>
          </div>
          <div className="orchestrationFlow">
            <div className="flowStep">
              <div className="flowStepNum">1</div>
              <div className="flowStepCard">
                <strong>需求理解</strong>
                <span>解析用户自然语言需求</span>
              </div>
            </div>
            <div className="flowArrow">→</div>
            <div className="flowStep">
              <div className="flowStepNum">2</div>
              <div className="flowStepCard">
                <strong>数据分析</strong>
                <span>评估数据质量与规模</span>
              </div>
            </div>
            <div className="flowArrow">→</div>
            <div className="flowStep">
              <div className="flowStepNum">3</div>
              <div className="flowStepCard">
                <strong>方案生成</strong>
                <span>输出标注/采集方案</span>
              </div>
            </div>
            <div className="flowArrow">→</div>
            <div className="flowStep">
              <div className="flowStepNum">4</div>
              <div className="flowStepCard">
                <strong>质量评估</strong>
                <span>质检规则与验收标准</span>
              </div>
            </div>
            <div className="flowArrow">→</div>
            <div className="flowStep">
              <div className="flowStepNum">5</div>
              <div className="flowStepCard">
                <strong>资源调度</strong>
                <span>分配算力与人力</span>
              </div>
            </div>
          </div>
          <div className="actionHistory">
            <div className="actionHistoryHead">
              <strong>执行记录</strong>
              <span className="actionHistoryHint">最近 {actions.length} 条 Agent 动作</span>
            </div>
            <div className="actionTable">
              <div className="actionRow actionHead">
                <span>时间</span>
                <span>动作类型</span>
                <span>项目</span>
                <span>状态</span>
                <span>授权时间</span>
                <span>执行时间</span>
              </div>
              {actions.map((action) => {
                const colors = statusColors[action.status] ?? statusColors.PREVIEW;
                return (
                  <div className="actionRow" key={action.id}>
                    <span className="mono">{formatDate(action.createdAt)}</span>
                    <span>{agentActionLabels[action.actionType] ?? action.actionType}</span>
                    <span>{action.projectCode ?? "-"}</span>
                    <span>
                      <span className="statusBadge" style={{ background: colors.bg, color: colors.text }}>
                        {action.status}
                      </span>
                    </span>
                    <span>{action.authorizedAt ? formatDate(action.authorizedAt) : "-"}</span>
                    <span>{action.executedAt ? formatDate(action.executedAt) : "-"}</span>
                  </div>
                );
              })}
              {actions.length === 0 && (
                <div className="actionRow empty">暂无执行记录</div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === "memory" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>知识记忆</h3>
            <button className="outlineBtn">管理记忆</button>
          </div>
          <div className="memoryLayout">
            <div className="memoryMain">
              <div className="memorySection">
                <div className="memorySectionHead">
                  <span className="memoryIcon">💬</span>
                  <strong>会话记忆</strong>
                  <span className="memoryCount">{sessions.length} 个会话</span>
                </div>
                <div className="sessionList">
                  {sessions.map((session) => (
                    <div className="sessionCard" key={session.id}>
                      <div className="sessionHead">
                        <strong>{session.title ?? "未命名会话"}</strong>
                        <span className="sessionTime">{formatDate(session.createdAt)}</span>
                      </div>
                      <p className="sessionContext">{session.context}</p>
                      <div className="sessionMeta">
                        <span>{session.messageCount} 条消息</span>
                        <span>{session.actionCount} 个动作</span>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="emptyState">暂无需话记录</div>
                  )}
                </div>
              </div>
            </div>
            <div className="memorySide">
              <div className="memorySection">
                <div className="memorySectionHead">
                  <span className="memoryIcon">📚</span>
                  <strong>案例沉淀</strong>
                </div>
                <div className="caseList">
                  <div className="caseItem">
                    <strong>城市道路车辆检测</strong>
                    <span>YOLOv8 · 142K 帧 · 3 类</span>
                  </div>
                  <div className="caseItem">
                    <strong>垃圾分类图像采集</strong>
                    <span>分类采集 · 50K 张 · 4 类</span>
                  </div>
                  <div className="caseItem">
                    <strong>行人重识别</strong>
                    <span>ReID · 20K 张 · 多相机</span>
                  </div>
                </div>
              </div>
              <div className="memorySection">
                <div className="memorySectionHead">
                  <span className="memoryIcon">📊</span>
                  <strong>反馈数据</strong>
                </div>
                <div className="feedbackStats">
                  <div className="feedbackStat">
                    <span>用户反馈</span>
                    <strong>47 条</strong>
                  </div>
                  <div className="feedbackStat">
                    <span>正向反馈</span>
                    <strong>89%</strong>
                  </div>
                  <div className="feedbackStat">
                    <span>迭代优化</span>
                    <strong>12 次</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === "tools" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>工具调用</h3>
            <button className="outlineBtn">接入新工具</button>
          </div>
          <div className="toolGrid">
            {tools.map((tool) => (
              <div className="toolCard" key={tool.id}>
                <div className="toolCardHead">
                  <span className="toolIcon">🔧</span>
                  <div className="toolInfo">
                    <strong>{tool.name}</strong>
                    <span className="toolType">{tool.toolType}</span>
                  </div>
                  <span
                    className="statusBadge"
                    style={{
                      background: tool.status === "ACTIVE" ? "#e9fbf3" : "#fff8e6",
                      color: tool.status === "ACTIVE" ? "#0aa866" : "#9b6400",
                    }}
                  >
                    {tool.status}
                  </span>
                </div>
                <div className="toolMeta">
                  <span>项目：{tool.projectCode ?? "通用"}</span>
                  <span>创建：{formatDate(tool.createdAt)}</span>
                </div>
                <div className="toolActions">
                  <button className="linkBtn">调用日志</button>
                  <button className="linkBtn">配置</button>
                </div>
              </div>
            ))}
            <div className="toolCard addToolCard">
              <span className="addToolIcon">+</span>
              <strong>接入新工具</strong>
              <span>添加外部 API 或自定义脚本</span>
            </div>
          </div>
        </div>
      )}

      {subTab === "growth" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>能力成长</h3>
            <span className="growthHint">基于历史项目积累的学习轨迹</span>
          </div>
          <div className="growthLayout">
            <div className="growthStats">
              <div className="growthStatCard">
                <span className="growthStatIcon">📈</span>
                <strong>项目经验</strong>
                <span className="growthStatValue">23 个</span>
                <span className="growthStatLabel">完成项目</span>
              </div>
              <div className="growthStatCard">
                <span className="growthStatIcon">🎯</span>
                <strong>任务完成</strong>
                <span className="growthStatValue">156 次</span>
                <span className="growthStatLabel">Agent 动作</span>
              </div>
              <div className="growthStatCard">
                <span className="growthStatIcon">⭐</span>
                <strong>技能掌握</strong>
                <span className="growthStatValue">{skills.length} 个</span>
                <span className="growthStatLabel">Skill 模块</span>
              </div>
              <div className="growthStatCard">
                <span className="growthStatIcon">🧠</span>
                <strong>知识积累</strong>
                <span className="growthStatValue">{sessions.length} 条</span>
                <span className="growthStatLabel">会话记忆</span>
              </div>
            </div>
            <div className="growthTimeline">
              <div className="growthTimelineHead">
                <strong>成长轨迹</strong>
              </div>
              <div className="growthTimelineList">
                <div className="growthTimelineItem">
                  <span className="growthDot" />
                  <div>
                    <strong>新增资源调度 Skill</strong>
                    <span>通过 5 个项目学习 GPU 调度策略</span>
                    <em>2024-07-10</em>
                  </div>
                </div>
                <div className="growthTimelineItem">
                  <span className="growthDot" />
                  <div>
                    <strong>质量评估准确率提升</strong>
                    <span>从 85% 提升至 94%，基于用户反馈优化</span>
                    <em>2024-07-05</em>
                  </div>
                </div>
                <div className="growthTimelineItem">
                  <span className="growthDot" />
                  <div>
                    <strong>新增多模态理解能力</strong>
                    <span>支持图文混合需求解析</span>
                    <em>2024-06-28</em>
                  </div>
                </div>
                <div className="growthTimelineItem">
                  <span className="growthDot" />
                  <div>
                    <strong>标注方案生成优化</strong>
                    <span>支持复杂场景下的多阶段标注流程</span>
                    <em>2024-06-15</em>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
