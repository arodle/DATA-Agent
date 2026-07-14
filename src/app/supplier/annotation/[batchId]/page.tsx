"use client";

import { useParams, useRouter } from "next/navigation";
import { useSupplierRole } from "../../SupplierRoleContext";
import { useState, useRef, useEffect } from "react";

interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const annotationAgentPrompts = [
  "这个目标的标注规则是什么？",
  "帮我检查一下最近的标注质量",
  "如何标注遮挡目标？",
];

const collectionAgentPrompts = [
  "采集场景有什么要求？",
  "当前数据量是否达标？",
  "采集设备参数怎么设置？",
];

const batchInfo: Record<string, { name: string; project: string; type: string; rule: string; total: number; mode: "标注" | "采集" }> = {
  "BATCH-042": { name: "车辆 2D 框质检与返修", project: "PRJ-001 自动驾驶", type: "质检/返修", rule: "RULE-2D-BBOX-V1.1", total: 50, mode: "标注" },
  "BATCH-043": { name: "行人关键点标注", project: "PRJ-003 行人检测", type: "标注", rule: "RULE-KEYPOINT-V2.0", total: 100, mode: "标注" },
  "BATCH-044": { name: "骑行人属性质检", project: "PRJ-001 自动驾驶", type: "质检", rule: "RULE-ATTR-V1.0", total: 30, mode: "标注" },
  "BATCH-045": { name: "语音转写标注", project: "PRJ-004 语音识别", type: "标注", rule: "RULE-ASR-V2.1", total: 80, mode: "标注" },
  "BATCH-046": { name: "交通场景分类标注", project: "PRJ-002 交通识别", type: "标注", rule: "RULE-CLASS-V1.2", total: 60, mode: "标注" },
  "BATCH-048": { name: "夜间场景车辆检测", project: "PRJ-001 自动驾驶", type: "标注", rule: "RULE-2D-BBOX-V1.1", total: 40, mode: "标注" },
  "BATCH-049": { name: "交通灯颜色标注", project: "PRJ-002 交通识别", type: "标注", rule: "RULE-COLOR-V1.0", total: 30, mode: "标注" },
  "COL-001": { name: "城区道路图像采集", project: "PRJ-001 自动驾驶", type: "图像采集", rule: "RULE-COLLECT-IMG-V2.0", total: 200, mode: "采集" },
  "COL-002": { name: "夜间场景视频采集", project: "PRJ-001 自动驾驶", type: "视频采集", rule: "RULE-COLLECT-VIDEO-V1.1", total: 100, mode: "采集" },
  "COL-003": { name: "方言语音采集", project: "PRJ-004 语音识别", type: "语音采集", rule: "RULE-COLLECT-AUDIO-V2.0", total: 500, mode: "采集" },
  "COL-004": { name: "停车场场景采集", project: "PRJ-002 交通识别", type: "图像采集", rule: "RULE-COLLECT-IMG-V2.0", total: 150, mode: "采集" },
  "COL-005": { name: "户外广告牌采集", project: "PRJ-003 行人检测", type: "图像采集", rule: "RULE-COLLECT-IMG-V2.0", total: 120, mode: "采集" },
};

export default function ExecWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useSupplierRole();
  const batchId = params.batchId as string;
  const info = batchInfo[batchId] || { name: "未知批次", project: "-", type: "-", rule: "-", total: 100, mode: "标注" };
  const isCollection = info.mode === "采集";

  const [agentOpen, setAgentOpen] = useState(false);
  const [agentMsgs, setAgentMsgs] = useState<AgentMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: isCollection
        ? "👋 我是采集员智能助手！\n\n- 📖 采集规范与场景要求\n- ✅ 数据质量检查\n- 📷 设备参数建议\n\n有什么需要帮助的吗？"
        : "👋 我是标注员智能助手！\n\n- 📖 可以查询标注规则\n- ✅ 可以帮你检查标注质量\n- 💡 标注技巧和建议\n\n有什么需要帮助的吗？",
    },
  ]);
  const [agentInput, setAgentInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentPrompts = isCollection ? collectionAgentPrompts : annotationAgentPrompts;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMsgs]);

  const handleSend = (text?: string) => {
    const content = text || agentInput.trim();
    if (!content) return;
    const userMsg: AgentMessage = { id: Date.now().toString(), role: "user", content };
    setAgentMsgs((prev) => [...prev, userMsg]);
    setAgentInput("");
    setTimeout(() => {
      setAgentMsgs((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: isCollection
          ? `根据采集规范文档 ${info.rule}：\n\n1. 光线充足，避免逆光\n2. 拍摄角度覆盖正面/侧面/俯视\n3. 每场景不少于 50 张\n4. 避免运动模糊`
          : "根据标注规则文档：\n\n1. 目标必须完全可见时才标注\n2. 遮挡比例超过 50% 可跳过\n3. 框必须紧贴目标边缘",
      }]);
    }, 500);
  };

  return (
    <div className="sFullWorkspace">
      <div className="sFullTopbar">
        <div className="sFullTopbarLeft">
          <button className="ghostBtn" onClick={() => router.push("/supplier/annotation")}>← 返回</button>
          <span className="sFullTitle">{batchId}</span>
          <strong>{info.name}</strong>
          <span className="pill small" style={{
            background: isCollection ? "#fce4ec" : "#e3f2fd",
            color: isCollection ? "#c62828" : "#1565c0",
          }}>{info.mode}</span>
        </div>
        <div>
          <span className="pill small" style={{ background: "#e8f5e9", color: "#2e7d32" }}>执行中</span>
        </div>
      </div>

      <div className="sFullContent">
        {isCollection ? (
          <div className="sFullCanvas">
            <div className="sCanvasImage" style={{ background: "linear-gradient(135deg, #2d3a45 0%, #1a2530 100%)" }}>
              <div className="sCanvasCar" style={{ width: 180, height: 80, bottom: 20, left: 30, background: "#4a6a8a" }} />
              <div style={{ position: "absolute", top: 30, left: 160, color: "#fff", fontSize: 10, background: "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: 4 }}>
                当前帧: 042 / 200
              </div>
              <div style={{ position: "absolute", bottom: 10, right: 10, color: "rgba(255,255,255,0.4)", fontSize: 9 }}>
                FOV: 120°  ISO: 400
              </div>
            </div>
          </div>
        ) : (
          <div className="sFullCanvas">
            <div className="sCanvasImage">
              <div className="sCanvasCar" />
              <div className="sCanvasBox sBox1" />
              <div className="sCanvasBox sBox2" />
              <div className="sCanvasLabel sLabel1">车 0.95</div>
              <div className="sCanvasLabel sLabel2">人 0.87</div>
            </div>
          </div>
        )}

        <div className="sFullTools">
          {isCollection ? (
            <>
              <div className="sToolGroup">
                <strong>采集控制</strong>
                <div className="sToolButtons">
                  <button className="sToolBtn active">▶ 开始</button>
                  <button className="sToolBtn">⏸ 暂停</button>
                  <button className="sToolBtn">⏹ 停止</button>
                </div>
              </div>
              <div className="sToolGroup">
                <strong>采集模式</strong>
                <div className="sToolButtons">
                  <button className="sToolBtn active">连续</button>
                  <button className="sToolBtn">单帧</button>
                  <button className="sToolBtn">定时</button>
                </div>
              </div>
              <div className="sToolGroup">
                <strong>设备参数</strong>
                <div className="sAttrRow"><span>曝光</span><select className="ghostBtn" style={{ width: 100 }}><option>自动</option><option>手动</option></select></div>
                <div className="sAttrRow"><span>白平衡</span><select className="ghostBtn" style={{ width: 100 }}><option>自动</option><option>日光</option><option>阴天</option></select></div>
                <div className="sAttrRow"><span>分辨率</span><select className="ghostBtn" style={{ width: 100 }}><option>1920x1080</option><option>3840x2160</option></select></div>
              </div>
              <div className="sToolActions">
                <button className="primaryBtn">采集当前帧</button>
                <button className="ghostBtn">保存</button>
              </div>
            </>
          ) : (
            <>
              <div className="sToolGroup">
                <strong>标注工具</strong>
                <div className="sToolButtons">
                  <button className="sToolBtn active">▭ 矩形框</button>
                  <button className="sToolBtn">⬠ 多边形</button>
                  <button className="sToolBtn">⚪ 关键点</button>
                  <button className="sToolBtn">━ 线段</button>
                </div>
              </div>
              <div className="sToolGroup">
                <strong>标签选择</strong>
                <div className="sLabelGrid">
                  <button className="sLabelBtn selected">车</button>
                  <button className="sLabelBtn">人</button>
                  <button className="sLabelBtn">自行车</button>
                  <button className="sLabelBtn">摩托车</button>
                  <button className="sLabelBtn">交通灯</button>
                  <button className="sLabelBtn">路标</button>
                </div>
              </div>
              <div className="sToolGroup">
                <strong>属性</strong>
                <div className="sAttrRow"><span>遮挡</span><select className="ghostBtn" style={{ width: 100 }}><option>无</option><option>轻度</option><option>重度</option></select></div>
                <div className="sAttrRow"><span>截断</span><select className="ghostBtn" style={{ width: 100 }}><option>无</option><option>轻微</option><option>严重</option></select></div>
              </div>
              <div className="sToolActions">
                <button className="primaryBtn">提交当前</button>
                <button className="ghostBtn">跳过</button>
                <button className="ghostBtn">保存</button>
              </div>
            </>
          )}
        </div>
      </div>

      {role === "worker" && (
        <>
          {!agentOpen && (
            <button className="opAgentFab wAgentFab" onClick={() => setAgentOpen(true)}>
              <span className="opAgentFabIcon">🤖</span>
              <span className="opAgentFabText">{isCollection ? "采集助手" : "标注助手"}</span>
            </button>
          )}

          {agentOpen && (
            <div className="opAgentPanel wAgentPanel">
              <div className="opAgentHeader" style={{ background: isCollection ? "linear-gradient(135deg, #c62828, #e53935)" : "linear-gradient(135deg, #356df3, #6b93ff)" }}>
                <div className="opAgentHeaderLeft">
                  <span className="opAgentAvatar">🤖</span>
                  <div>
                    <strong>{isCollection ? "采集员智能助手" : "标注员智能助手"}</strong>
                    <span className="opAgentStatus"><span className="statusDot" /> 在线</span>
                  </div>
                </div>
                <button className="opAgentClose" onClick={() => setAgentOpen(false)}>✕</button>
              </div>

              <div className="opAgentMessages">
                {agentMsgs.map((msg) => (
                  <div key={msg.id} className={`opAgentMsg ${msg.role}`}>
                    <div className="opAgentMsgBubble">
                      <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    </div>
                    <span className="opAgentMsgTime">{new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="opAgentQuickPrompts">
                {agentPrompts.map((p) => (
                  <button key={p} className="quickPromptBtn" onClick={() => handleSend(p)}>{p}</button>
                ))}
              </div>

              <div className="opAgentInputBar">
                <textarea
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="输入问题..."
                  className="opAgentInput"
                  rows={1}
                />
                <button className="opAgentSendBtn" onClick={() => handleSend()}>发送</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
