"use client";

import { useState, useEffect, useCallback } from "react";

interface ChatItem {
  id: string;
  content: string;
  senderRole: string;
  senderName: string;
  createdAt: string;
  project?: { code: string; name: string };
  annotation?: {
    id: string;
    isValuable: boolean;
    category: string;
    correctedReply: string;
    note: string;
    reviewStatus: string;
  } | null;
}

const tabs = [
  { key: "PENDING", label: "待标注" },
  { key: "ANNOTATED", label: "已标注" },
  { key: "REVIEWED", label: "已审核" },
];

const categories = [
  { value: "CLARIFY_REQUIREMENT", label: "需求澄清" },
  { value: "QUALITY_FEEDBACK", label: "质量反馈" },
  { value: "TECH_SPEC", label: "技术规范" },
  { value: "EXCEPTION_HANDLING", label: "异常处理" },
  { value: "PROCESS_NOTICE", label: "流程通知" },
  { value: "CHITCHAT", label: "闲聊" },
];

const roleLabel: Record<string, string> = {
  USER: "需求方",
  SUPPLIER_LEADER: "供应商负责人",
  SUPPLIER_MEMBER: "供应商执行员",
};

const roleColor: Record<string, string> = {
  USER: "#4a90d9",
  SUPPLIER_LEADER: "#f5a623",
  SUPPLIER_MEMBER: "#7ed321",
};

const statusLabel: Record<string, string> = {
  PENDING_ANNOTATION: "待审核",
  APPROVED: "已入库",
  REJECTED: "已驳回",
};

export default function ChatAnnotationPage() {
  const [activeTab, setActiveTab] = useState("PENDING");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [annotating, setAnnotating] = useState(false);

  const [form, setForm] = useState({
    isValuable: true,
    category: "CLARIFY_REQUIREMENT",
    correctedReply: "",
    note: "",
  });

  const loadChats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/annotation?status=${activeTab}`);
      const data = await res.json();
      setChats(data.chats || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const selectedChat = chats.find((c) => c.id === selectedId);

  const openAnnotate = (chat: ChatItem) => {
    setSelectedId(chat.id);
    if (chat.annotation) {
      setForm({
        isValuable: chat.annotation.isValuable,
        category: chat.annotation.category || "CLARIFY_REQUIREMENT",
        correctedReply: chat.annotation.correctedReply || "",
        note: chat.annotation.note || "",
      });
    } else {
      setForm({
        isValuable: true,
        category: "CLARIFY_REQUIREMENT",
        correctedReply: "",
        note: "",
      });
    }
  };

  const submitAnnotation = async () => {
    if (!selectedId || annotating) return;
    setAnnotating(true);
    try {
      await fetch("/api/chat/annotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedId, ...form }),
      });
      loadChats();
      setSelectedId(null);
    } catch (e) {
      console.error(e);
    }
    setAnnotating(false);
  };

  const handleApprove = async (annotationId: string) => {
    try {
      await fetch("/api/chat/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotationId }),
      });
      loadChats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (annotationId: string) => {
    try {
      await fetch("/api/chat/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotationId }),
      });
      loadChats();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="annotationWorkbench">
      <div className="annotationHeader">
        <h2>对话标注清洗工作台</h2>
        <p>标注供应商对话数据，将高质量对话回流至Agent训练</p>
      </div>

      <div className="annotationTabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`annotationTab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="annotationLayout">
        <div className="annotationList">
          {loading && <div className="emptyState">加载中...</div>}
          {!loading && chats.length === 0 && (
            <div className="emptyState">暂无对话数据</div>
          )}
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chatListItem ${selectedId === chat.id ? "selected" : ""}`}
              onClick={() => openAnnotate(chat)}
            >
              <div className="chatListItemHead">
                {chat.project && (
                  <span className="chatListProject">{chat.project.code}</span>
                )}
                <span
                  className="chatListRole"
                  style={{ color: roleColor[chat.senderRole] || "#666" }}
                >
                  {roleLabel[chat.senderRole] || chat.senderRole}
                </span>
                {chat.annotation && (
                  <span className={`chatListStatus ${
                    chat.annotation.reviewStatus === "APPROVED" ? "approved" : ""
                  }`}>
                    {statusLabel[chat.annotation.reviewStatus] || chat.annotation.reviewStatus}
                  </span>
                )}
              </div>
              <div className="chatListContent">{chat.content}</div>
              <div className="chatListTime">
                {new Date(chat.createdAt).toLocaleString("zh-CN")}
              </div>
            </div>
          ))}
        </div>

        <div className="annotationDetail">
          {!selectedChat && (
            <div className="emptyState">
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📝</div>
              <strong>选择左侧对话开始标注</strong>
              <p>标记有价值的对话，编辑修正回复，为Agent提供训练数据</p>
            </div>
          )}

          {selectedChat && (
            <div className="annotationForm">
              <div className="annotationChatPreview">
                <div className="annotationChatMeta">
                  <span style={{ color: roleColor[selectedChat.senderRole] || "#666" }}>
                    {roleLabel[selectedChat.senderRole] || selectedChat.senderRole}
                  </span>
                  <span>· {selectedChat.senderName}</span>
                  <span>· {new Date(selectedChat.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <div className="annotationChatContent">{selectedChat.content}</div>
              </div>

              <div className="annotationFields">
                <div className="annotationField">
                  <label>训练价值</label>
                  <div className="annotationRadioGroup">
                    <label className="annotationRadio">
                      <input
                        type="radio"
                        checked={form.isValuable}
                        onChange={() => setForm({ ...form, isValuable: true })}
                      />
                      <span>✅ 有训练价值</span>
                    </label>
                    <label className="annotationRadio">
                      <input
                        type="radio"
                        checked={!form.isValuable}
                        onChange={() => setForm({ ...form, isValuable: false })}
                      />
                      <span>❌ 无训练价值</span>
                    </label>
                  </div>
                </div>

                {form.isValuable && (
                  <>
                    <div className="annotationField">
                      <label>对话分类</label>
                      <select
                        className="annotationSelect"
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                      >
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="annotationField">
                      <label>修正的理想回复（训练用）</label>
                      <textarea
                        className="annotationTextarea"
                        value={form.correctedReply}
                        onChange={(e) =>
                          setForm({ ...form, correctedReply: e.target.value })
                        }
                        placeholder="编写这条对话的理想回复，将作为Agent的训练目标..."
                        rows={4}
                      />
                    </div>
                  </>
                )}

                <div className="annotationField">
                  <label>标注备注</label>
                  <textarea
                    className="annotationTextarea"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="补充标注说明..."
                    rows={2}
                  />
                </div>

                <button
                  className="annotationSubmitBtn"
                  onClick={submitAnnotation}
                  disabled={annotating}
                >
                  {annotating ? "提交中..." : "提交标注"}
                </button>
              </div>

              {selectedChat.annotation && (
                <div className="annotationReview">
                  <div className="annotationReviewTitle">审核操作</div>
                  <div className="annotationReviewStatus">
                    状态：{statusLabel[selectedChat.annotation.reviewStatus] || selectedChat.annotation.reviewStatus}
                  </div>
                  {selectedChat.annotation.reviewStatus === "PENDING_ANNOTATION" && (
                    <div className="annotationReviewBtns">
                      <button
                        className="annotationApproveBtn"
                        onClick={() => handleApprove(selectedChat.annotation!.id)}
                      >
                        通过入库
                      </button>
                      <button
                        className="annotationRejectBtn"
                        onClick={() => handleReject(selectedChat.annotation!.id)}
                      >
                        驳回重标
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
