"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Stage = {
  id: number;
  phase: string;
  title: string;
  agent: string;
  type: "agent" | "user" | "system" | "decision";
  content: string;
  options?: string[];
};

const stages: Stage[] = [
  { id: 1, phase: "需求分析", title: "发起 AI 目标", agent: "用户", type: "user", content: "我需要做一个**城市道路车辆 2D 框标注项目**，需要检测轿车、SUV、卡车、公交车、摩托车 5 类目标，大概 5 万张图片的数据量。" },
  { id: 2, phase: "需求分析", title: "识别任务类型", agent: "需求 Agent", type: "agent", content: "🔍 检测到您的 AI 目标：根据关键词「车辆检测」「标注」「2D框」「城市道路」分析，这是一个 **2D 目标检测标注项目**，属于 **采标一体** 任务类型。\n\n建议数据源方案：混合方案（仿真 + 真实采集）\n预计数据规模：50,000+ 张图片\n标注类别：轿车、SUV、卡车、公交车、摩托车\n\n📋 匹配到 **PRJ-A23K**（相似度 94%）等 3 个同类历史项目，可复用其配置。" },
  { id: 3, phase: "需求分析", title: "自动询问关键信息", agent: "需求 Agent", type: "agent", content: "为了精确规划，请补充以下关键信息：\n\n1. 标注精度要求？\n2. 数据来源？（已有数据 / 需要采集 / 两者结合）\n3. 预期工期？\n4. 预算范围？\n5. 是否需要模型训练和推理支持？" },
  { id: 4, phase: "需求分析", title: "补充关键信息", agent: "用户", type: "user", content: "标注精度要求框偏移 ≤ 3px；数据已有但要先清洗；预期 3 个月完成；预算 10-50 万；需要模型训练和推理支持。" },
  { id: 5, phase: "需求分析", title: "推荐历史相似项目", agent: "需求 Agent", type: "agent", content: "📋 匹配到 3 个高相似度历史项目，建议复用其配置：\n\n**推荐 1：PRJ-A23K**（相似度 94%）\n城市道路车辆 2D 框标注 | 48,000张 | 3个月 | 交付评分 4.8\n• 标注规范：v2.1\n• AC规则：框偏移≤3px、3轮交叉验证\n• 供应商：标注星球（报价 0.8元/框，返修率 2.3%）\n• Schema：COCO格式 + 5类车型\n\n**推荐 2：PRJ-B12M**（相似度 87%）\n**推荐 3：PRJ-C04L**（相似度 76%）\n\n点击需要的字段进行复用 →" },
  { id: 6, phase: "需求分析", title: "复用资产字段", agent: "用户", type: "user", content: "复用 PRJ-A23K 的标注规范 v2.1、AC验收规则、COCO Schema，报价参考也保留。" },
  { id: 7, phase: "需求分析", title: "生成需求文档", agent: "需求 Agent", type: "agent", content: "📝 **需求文档摘要（草稿）**\n\n**项目名称：** 城市道路车辆检测标注\n**任务类型：** 2D目标检测标注\n**数据规模：** 预计 50,000 张\n**标注类别：** 轿车、SUV、卡车、公交车、摩托车（5类）\n**标注精度：** 框偏移 ≤ 3px\n**预期工期：** 3个月\n**预算范围：** 10-50万\n\n⚠️ 请确认以上内容是否准确。" },
  { id: 8, phase: "需求分析", title: "确认需求文档", agent: "用户", type: "user", content: "确认无误，请生成正式需求文档。" },
  { id: 9, phase: "需求分析", title: "正式需求文档", agent: "需求 Agent", type: "agent", content: "✅ **正式需求文档已生成**\n文档编号：REQ-2026-0042\n\n📊 下一步：生成数据源规划方案…" },
  { id: 10, phase: "数据规划", title: "数据源规划", agent: "需求 Agent", type: "agent", content: "📊 **数据源规划**\n\n**方案 A：纯采集**（实地采集 50,000 张，约 8-12万）\n**方案 B：采集 + 仿真混合（推荐）**（15K仿真 + 35K采集，约 10-15万）\n**方案 C：成品数据集采购**（CityScapes + BDD100K 子集，约 3-5万）\n\n仿真数据优势：精确标注、覆盖夜间/雨雪/雾天等稀有场景。" },
  { id: 11, phase: "数据规划", title: "仿真决策", agent: "需求 Agent", type: "decision", content: "是否需要仿真数据来补充边缘场景和极端天气覆盖？", options: ["是，加入仿真数据", "否，纯采集即可"] },
  { id: 12, phase: "数据规划", title: "确认仿真", agent: "用户", type: "user", content: "是，加入仿真数据。" },
  { id: 13, phase: "数据规划", title: "采购决策", agent: "需求 Agent", type: "decision", content: "是否需要采购成品数据集（如 CityScapes 子集）作为冷启动补充？", options: ["是，采购成品数据集", "否，跳过采购"] },
  { id: 14, phase: "数据规划", title: "确认采购", agent: "用户", type: "user", content: "否，跳过采购。" },
  { id: 15, phase: "方案设计", title: "方案设计", agent: "采标规划 Agent", type: "agent", content: "📐 **采标方案（草案）**\n\n**阶段一：数据准备（第1-3周）**\n• 已有数据清洗（推荐平台清洗工具）\n• 数据预标（平台预标API，准确率85%+）\n• 15,000 张仿真数据生成\n\n**阶段二：标注执行（第4-10周）**\n• 3名标采员 × 约11,000张/人\n• 分批验收：每1,000张一批\n\n**阶段三：验收交付（第11-12周）**\n• 质量抽检：每批随机 10%\n• 返修窗口：3个工作日\n\n💰 预估费用：约 11.5万" },
  { id: 16, phase: "方案设计", title: "费用预估", agent: "费用预估 Agent", type: "agent", content: "💰 **费用预估明细**\n\n| 项目 | 单价 | 数量 | 金额 |\n|------|------|------|------|\n| 数据清洗 | 0.02元/张 | 50,000 | 1,000 |\n| 仿真生成 | 0.5元/张 | 15,000 | 7,500 |\n| 2D框标注 | 0.8元/框 | ~125K | 100,000 |\n| 预标调用 | 0.05元/张 | 50,000 | 2,500 |\n| 验收抽检 | 0.15元/框 | ~10K | 1,500 |\n| **合计** | | | **≈ 11.5万** |\n\n⚠️ 精准价格待运营对接供应商后确定。" },
  { id: 17, phase: "任务发布", title: "生成任务界面", agent: "需求 Agent", type: "agent", content: "✅ **任务界面已生成**\n\n• 任务编码：TASK-2026-0075\n• Schema：COCO JSON（5类）\n• AC规则：已配置验收规则引擎\n• 数据版本：v1.0（50,000张 + 15,000仿真）\n\n⏳ 配置工具预估费用中…" },
  { id: 18, phase: "供应商匹配", title: "推荐供应商", agent: "运营 Agent", type: "agent", content: "🏭 **供应商匹配结果**\n\n**推荐 1：标注星球** ⭐4.8\n• 产能 20,000框/天 | 单价 0.8元/框 | 返修率 2.3%\n• 试标报价：0.75元/框\n\n**推荐 2：AI标注工厂** ⭐4.5\n• 产能 15,000框/天 | 单价 0.72元/框 | 返修率 3.1%\n\n⏳ 等待运营审核…" },
  { id: 19, phase: "供应商匹配", title: "运营审核", agent: "系统通知", type: "system", content: "✅ 运营已审核通过。选定标注星球（主）+ AI标注工厂（备选），已自动发起试标任务：每供应商 500 张，3 个工作日内完成。" },
  { id: 20, phase: "供应商执行", title: "试标评估", agent: "供应商 Agent", type: "agent", content: "📊 **试标评估结果**\n\n**标注星球：** 框精度 97.2% | 漏标率 1.8% | 通过 ✅\n**AI标注工厂：** 框精度 95.8% | 漏标率 2.4% | 通过 ✅\n\n建议首选定标标注星球。" },
  { id: 21, phase: "执行管理", title: "漏洞发现", agent: "供应商 Agent", type: "agent", content: "🔍 **小批量量产反馈**\n\n发现 3 个规则漏洞：\n1. 摩托车与电动车难以区分\n2. 遮挡场景边框争议\n3. 夜间场景曝光不足漏标\n\n标注规范已更新至 v2.2，所有 Agent 已同步。" },
  { id: 22, phase: "量产验收", title: "量产监控", agent: "标采员 Agent", type: "agent", content: "📊 **量产进度看板**\n\n已完成 38,500/50,000张（77%）\n质检通过率 96.8%\n返修率 2.4%\n预计提前 3 天完成。" },
  { id: 23, phase: "量产验收", title: "脚本文持", agent: "需求 Agent", type: "decision", content: "检测到需要格式转换和批量质检，是否需要 Agent 编写辅助脚本？\n\n• COCO 格式验证脚本\n• 批量可视化脚本\n• 数据集划分脚本", options: ["是，需要辅助脚本", "否，手动处理即可"] },
  { id: 24, phase: "量产验收", title: "确认脚本", agent: "用户", type: "user", content: "是，需要辅助脚本。" },
  { id: 25, phase: "交付结算", title: "完整验收", agent: "运营 Agent", type: "agent", content: "✅ **项目完整验收通过**\n\n交付数据：50,000张（采集）+ 15,000张（仿真）\n标注框总数：132,500 框 | 最终合格率 97.3%\n实际工期 80天（提前10天）\n费用：113,000元（预算内）\n\n📨 已生成供应商账单。" },
  { id: 26, phase: "交付结算", title: "资产沉淀", agent: "需求 Agent", type: "agent", content: "📊 **项目总结 & 资产沉淀**\n\n✅ 新增数据集：PRJ-D042（65,000张）\n✅ 新增标注规范 v2.2\n✅ 更新供应商报价基准\n✅ 新增 Python 验证脚本\n✅ 全套项目包已归档至数据资产\n\n🎉 项目圆满完成！需要转格式服务可随时找我。" },
];

type StageCategory = {
  phase: string;
  icon: string;
  color: string;
  stages: Stage[];
};

function groupStages(stages: Stage[]): StageCategory[] {
  const phaseOrder = ["需求分析", "数据规划", "方案设计", "任务发布", "供应商匹配", "供应商执行", "执行管理", "量产验收", "交付结算"];
  const phaseIcons: Record<string, string> = { "需求分析":"🔍","数据规划":"📊","方案设计":"📐","任务发布":"🚀","供应商匹配":"🏭","供应商执行":"⚙️","执行管理":"📋","量产验收":"✅","交付结算":"💰" };
  const phaseColors: Record<string, string> = { "需求分析":"#60a5fa","数据规划":"#34d399","方案设计":"#d4a853","任务发布":"#f59e0b","供应商匹配":"#a78bfa","供应商执行":"#f97316","执行管理":"#06b6d4","量产验收":"#22c55e","交付结算":"#ec4899" };

  const groups: Record<string, Stage[]> = {};
  stages.forEach((s) => { if (!groups[s.phase]) groups[s.phase] = []; groups[s.phase].push(s); });

  return phaseOrder.filter((p) => groups[p]).map((p) => ({
    phase: p, icon: phaseIcons[p] || "📌", color: phaseColors[p] || "#71717a", stages: groups[p],
  }));
}

export default function WorkflowDemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Stage[]>([]);
  const [decisions, setDecisions] = useState<Record<number, string>>({});
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const grouped = groupStages(stages);
  const totalSteps = stages.length;
  const currentStage = stages[currentStep];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStep]);

  const advanceTo = (step: number) => {
    if (step > messages.length) {
      const newMsgs = stages.slice(messages.length, step);
      setMessages((prev) => [...prev, ...newMsgs]);
    }
    setCurrentStep(Math.min(step, totalSteps - 1));
  };

  const handleNext = () => {
    if (currentStep >= totalSteps - 1) return;
    const stage = stages[currentStep];
    if (stage.type === "decision" && !decisions[stage.id]) return;
    advanceTo(currentStep + 1);
    setUserInput("");
  };

  const handleDecision = (stageId: number, choice: string) => {
    setDecisions((prev) => ({ ...prev, [stageId]: choice }));
    setTimeout(() => handleNext(), 300);
  };

  const handleUserSend = () => {
    if (!userInput.trim()) return;
    const responseMap: Record<number, string> = {
      3: "标注精度要求框偏移 ≤ 3px；数据已有但要先清洗；预期 3 个月完成；预算 10-50 万；需要模型训练和推理支持。",
      7: "确认无误，请生成正式需求文档。",
      11: "是，加入仿真数据。",
      13: "否，跳过采购。",
      23: "是，需要辅助脚本。",
    };
    const resp = responseMap[currentStep + 1] || userInput.trim();
    const userStage: Stage = { id: currentStep + 1000, phase: currentStage.phase, title: "", agent: "用户", type: "user", content: resp };
    setMessages((prev) => [...prev, userStage]);
    setUserInput("");
    setTimeout(() => {
      if (currentStep < totalSteps - 1) advanceTo(currentStep + 1);
    }, 400);
  };

  const displayedMessages = messages.length > 0 ? messages : [stages[0]];

  const currentColor = grouped.find((g) => g.phase === currentStage.phase)?.color || "#60a5fa";

  return (
    <div className="wfDemo">
      <header className="wfDemoHeader">
        <Link href="/user/workspace" className="wfBackBtn">← 返回工作台</Link>
        <h1 className="wfTitle">🤖 AI 标采项目全流程模拟</h1>
        <div className="wfHeaderRight">
          <Link href="/user/data" className="wfAssetLink">📊 数据资产管理 →</Link>
        </div>
      </header>

      <div className="wfBody">
        <aside className="wfTimeline">
          <div className="wfTimelineTitle">流程阶段</div>
          <div className="wfTimelineList">
            {grouped.map((group) => (
              <div key={group.phase} className="wfPhaseGroup">
                <div className="wfPhaseLabel" style={{ borderLeftColor: group.color }}>
                  <span className="wfPhaseIcon">{group.icon}</span>
                  <span className="wfPhaseName">{group.phase}</span>
                  <span className="wfPhaseCount">{group.stages.length}步</span>
                </div>
                {group.stages.map((s) => {
                  const isCurrent = s.id === currentStep + 1;
                  const isPassed = s.id <= currentStep;
                  return (
                    <button
                      key={s.id}
                      className={`wfTimelineStep ${isCurrent ? "current" : ""} ${isPassed ? "passed" : ""}`}
                      onClick={() => advanceTo(s.id - 1)}
                    >
                      <span className="wfStepDot" style={{
                        background: isCurrent ? group.color : isPassed ? group.color : "#27272d",
                        borderColor: group.color,
                      }} />
                      <span className="wfStepTitle">{s.title}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        <main className="wfMain">
          <div className="wfStageHeader">
            <span className="wfStageNum">步骤 {currentStep + 1} / {totalSteps}</span>
            <div className="wfProgressBar">
              <div className="wfProgressFill" style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }} />
            </div>
          </div>

          <div className={`wfPhaseBanner`} style={{ borderLeftColor: currentColor }}>
            <span className="wfPhaseBannerIcon">{grouped.find((g) => g.phase === currentStage.phase)?.icon}</span>
            <span className="wfPhaseBannerText">{currentStage.phase}</span>
            <span className="wfPhaseBannerAgent">{currentStage.agent}</span>
          </div>

          <div className="wfChat">
            {displayedMessages.map((m, idx) => (
              <div key={m.id} className={`wfBubble ${m.type === "user" ? "user" : m.type === "system" ? "system" : "agent"}`}>
                <div className={`wfBubbleAvatar ${m.type}`}>
                  {m.type === "user" ? "👤" : m.type === "system" ? "📢" : "🤖"}
                </div>
                <div className="wfBubbleBody">
                  <div className="wfBubbleSender">
                    {m.type === "user" ? "我" : m.agent}
                    <span className="wfBubblePhase" style={{ color: grouped.find((g) => g.phase === m.phase)?.color }}>
                      {m.phase}
                    </span>
                  </div>
                  <div className="wfBubbleContent" style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                  {m.type === "decision" && m.options && (
                    <div className="wfDecisionArea">
                      <div className="wfDecisionPrompt">请选择：</div>
                      <div className="wfDecisionOptions">
                        {m.options.map((opt, i) => (
                          <button
                            key={i}
                            className={`wfDecisionBtn ${decisions[m.id] === opt ? "selected" : ""}`}
                            onClick={() => handleDecision(m.id, opt)}
                            disabled={!!decisions[m.id]}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {decisions[m.id] && <div className="wfDecisionResult">✅ {decisions[m.id]}</div>}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {displayedMessages.length === 0 && (
              <div className="wfChatEmpty">
                <span className="wfChatEmptyIcon">🤖</span>
                <p>点击左侧时间线开始模拟</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="wfInputBar">
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUserSend(); } }}
              placeholder="输入回复与 Agent 对话..."
              className="wfTextarea"
              rows={2}
              disabled={currentStage.type !== "user" && currentStage.type !== "decision"}
            />
            <div className="wfInputRight">
              <button
                className="wfSkipBtn"
                onClick={handleNext}
                disabled={currentStep >= totalSteps - 1 || (currentStage.type === "decision" && !decisions[currentStage.id])}
              >
                {currentStep >= totalSteps - 1 ? "已完成" : "下一步 →"}
              </button>
              <button className="wfSendBtn" onClick={handleUserSend} disabled={!userInput.trim()}>↑</button>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .wfDemo { min-height: 100vh; background: #0a0e17; color: #e4e4e7; display: flex; flex-direction: column; }
        .wfDemoHeader { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; background: #0d1117; border-bottom: 1px solid #1a1f2e; position: sticky; top: 0; z-index: 100; }
        .wfBackBtn { color: #60a5fa; text-decoration: none; font-size: 13px; padding: 6px 12px; border-radius: 6px; background: rgba(96,165,250,0.08); transition: background 0.15s; }
        .wfBackBtn:hover { background: rgba(96,165,250,0.15); }
        .wfTitle { font-size: 18px; font-weight: 700; margin: 0; color: #f9fafb; }
        .wfHeaderRight { display: flex; align-items: center; gap: 12px; }
        .wfAssetLink { padding: 6px 14px; background: rgba(96,165,250,0.1); color: #60a5fa; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500; }
        .wfAssetLink:hover { background: rgba(96,165,250,0.2); }
        .wfBody { display: flex; flex: 1; overflow: hidden; }

        /* Timeline */
        .wfTimeline { width: 260px; flex-shrink: 0; border-right: 1px solid #1a1f2e; background: #0d1117; display: flex; flex-direction: column; }
        .wfTimelineTitle { padding: 16px 20px; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #1a1f2e; }
        .wfTimelineList { flex: 1; overflow-y: auto; padding: 8px 0; }
        .wfPhaseGroup { margin-bottom: 4px; }
        .wfPhaseLabel { display: flex; align-items: center; gap: 8px; padding: 8px 20px; font-size: 12px; font-weight: 600; color: #a1a1aa; border-left: 3px solid transparent; }
        .wfPhaseIcon { font-size: 14px; } .wfPhaseName { flex: 1; }
        .wfPhaseCount { font-size: 10px; color: #52525b; background: #18191e; padding: 2px 6px; border-radius: 4px; }
        .wfTimelineStep { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 20px 6px 32px; border: none; background: transparent; cursor: pointer; font-size: 11px; color: #52525b; text-align: left; transition: all 0.15s; }
        .wfTimelineStep:hover { background: #18191e; color: #a1a1aa; }
        .wfTimelineStep.passed { color: #a1a1aa; }
        .wfTimelineStep.current { background: rgba(96,165,250,0.06); color: #e4e4e7; font-weight: 600; }
        .wfStepDot { width: 8px; height: 8px; border-radius: 50%; border: 2px solid #27272d; background: transparent; flex-shrink: 0; transition: all 0.2s; }
        .wfTimelineStep.passed .wfStepDot { border-width: 3px; }
        .wfTimelineStep.current .wfStepDot { transform: scale(1.3); box-shadow: 0 0 8px rgba(96,165,250,0.4); }
        .wfStepTitle { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Main chat area */
        .wfMain { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .wfStageHeader { display: flex; align-items: center; gap: 16px; padding: 16px 24px; background: #0d1117; border-bottom: 1px solid #1a1f2e; }
        .wfStageNum { font-size: 12px; color: #71717a; font-weight: 600; }
        .wfProgressBar { flex: 1; height: 4px; background: #18191e; border-radius: 2px; overflow: hidden; }
        .wfProgressFill { height: 100%; background: linear-gradient(90deg, #60a5fa, #34d399); border-radius: 2px; transition: width 0.3s ease; }

        .wfPhaseBanner { display: flex; align-items: center; gap: 10px; padding: 10px 24px; background: #0d1117; border-bottom: 1px solid #1a1f2e; border-left: 3px solid #60a5fa; }
        .wfPhaseBannerIcon { font-size: 14px; }
        .wfPhaseBannerText { font-size: 12px; font-weight: 600; color: #a1a1aa; margin-right: 10px; padding-right: 10px; border-right: 1px solid #27272d; }
        .wfPhaseBannerAgent { font-size: 12px; color: #60a5fa; }

        /* Chat messages */
        .wfChat { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
        .wfChatEmpty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #52525b; }
        .wfChatEmptyIcon { font-size: 48px; margin-bottom: 12px; }
        .wfChatEmpty p { font-size: 14px; margin: 0; }

        .wfBubble { display: flex; gap: 12px; animation: bubbleIn 0.3s ease-out; }
        @keyframes bubbleIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .wfBubble.user { flex-direction: row-reverse; }
        .wfBubble.user .wfBubbleBody { align-items: flex-end; }
        .wfBubble.system { justify-content: center; }
        .wfBubble.system .wfBubbleBody { align-items: center; max-width: 80%; }
        .wfBubble.system .wfBubbleContent { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); color: #fbbf24; text-align: center; }

        .wfBubbleAvatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .wfBubbleAvatar.agent { background: rgba(96,165,250,0.12); }
        .wfBubbleAvatar.user { background: rgba(34,197,94,0.12); }
        .wfBubbleAvatar.system { background: rgba(251,191,36,0.12); }

        .wfBubbleBody { display: flex; flex-direction: column; gap: 4px; max-width: 75%; }
        .wfBubbleSender { font-size: 11px; color: #71717a; display: flex; align-items: center; gap: 8px; padding: 0 4px; }
        .wfBubble.user .wfBubbleSender { justify-content: flex-end; }
        .wfBubblePhase { font-size: 10px; padding: 1px 6px; border-radius: 6px; background: rgba(255,255,255,0.04); }
        .wfBubbleContent { padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.7; word-break: break-word; }
        .wfBubble.agent .wfBubbleContent { background: #18191e; color: #d4d4d8; border-bottom-left-radius: 4px; border: 1px solid #27272d; }
        .wfBubble.user .wfBubbleContent { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }
        .wfBubble.system .wfBubbleContent { background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.15); color: #fbbf24; }

        /* Decision area */
        .wfDecisionArea { margin-top: 10px; padding: 12px; background: rgba(244,114,182,0.05); border: 1px solid rgba(244,114,182,0.1); border-radius: 10px; }
        .wfDecisionPrompt { font-size: 12px; color: #f472b6; font-weight: 600; margin-bottom: 8px; }
        .wfDecisionOptions { display: flex; gap: 8px; flex-wrap: wrap; }
        .wfDecisionBtn { padding: 8px 16px; border: 1px solid #27272d; background: #18191e; color: #d4d4d8; border-radius: 8px; cursor: pointer; font-size: 12px; transition: all 0.15s; }
        .wfDecisionBtn:hover:not(:disabled) { border-color: #f472b6; background: rgba(244,114,182,0.1); }
        .wfDecisionBtn.selected { background: rgba(244,114,182,0.15); border-color: #f472b6; color: #f472b6; }
        .wfDecisionBtn:disabled { opacity: 0.5; cursor: not-allowed; }
        .wfDecisionResult { margin-top: 8px; font-size: 12px; color: #34d399; }

        /* Input bar */
        .wfInputBar { display: flex; align-items: flex-end; gap: 10px; padding: 14px 24px; border-top: 1px solid #1a1f2e; background: #0d1117; }
        .wfTextarea { flex: 1; border: 1px solid #27272d; background: #0f1117; color: #e4e4e7; border-radius: 14px; padding: 12px 16px; font-size: 14px; font-family: inherit; resize: none; outline: none; min-height: 48px; max-height: 100px; line-height: 1.5; }
        .wfTextarea::placeholder { color: #52525b; }
        .wfTextarea:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,0.1); }
        .wfTextarea:disabled { opacity: 0.5; }
        .wfInputRight { display: flex; gap: 8px; align-items: center; }
        .wfSkipBtn { padding: 10px 20px; border: 1px solid #27272d; background: transparent; color: #a1a1aa; border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .wfSkipBtn:hover:not(:disabled) { border-color: #60a5fa; color: #60a5fa; }
        .wfSkipBtn:disabled { opacity: 0.3; cursor: not-allowed; }
        .wfSendBtn { width: 42px; height: 42px; background: #60a5fa; color: #fff; border: none; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .wfSendBtn:hover:not(:disabled) { background: #4a90e2; transform: scale(1.05); }
        .wfSendBtn:disabled { background: #27272d; color: #52525b; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
