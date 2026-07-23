import Link from "next/link";
import {
  allMessagesFor,
  getConversation,
  RequirementView,
  senderTypeLabel,
  suggestionsFor,
  timelineFor,
} from "../conversation-data";
import ConversationActionButton from "../ConversationActions";

const text = {
  back: "返回 Conversation",
  requirement: "Requirement",
  conversation: "Conversation",
  aiWorkspace: "Requirement 运营控制台",
  newRequirement: "新建 Requirement",
  all: "全部",
  currentReqOnly: "当前 Requirement",
  customerMsg: "客户消息",
  operatorMsg: "运营消息",
  aiMsg: "AI 消息",
  systemMsg: "系统记录",
  noConversation: "暂无 Conversation",
  owner: "主负责人",
  member: "成员",
  updated: "最后更新",
  pendingChange: "有待确认更新",
  relatedProject: "关联项目",
  aiProcessed: "AI 已处理",
  aiNotProcessed: "AI 未处理",
  hasChange: "产生需求变更",
  inputPlaceholder: "输入回复，AI 生成后仍需运营确认再发送",
  upload: "上传附件",
  quote: "引用历史",
  draft: "保存草稿",
  send: "发送",
  aiReply: "AI 建议回复",
  aiFollow: "AI 生成追问",
  aiPolish: "AI 优化表达",
  basic: "基本信息",
  steps: "执行步骤",
  missing: "缺失信息",
  suggestions: "AI 建议",
  changes: "待确认变更",
  projects: "项目信息",
  timeline: "Requirement Timeline",
  noProject: "当前 Requirement 尚未生成项目",
  previewProject: "生成项目预览",
  createAnnotation: "创建标注项目",
  createCollection: "创建采集项目",
  approve: "审核通过",
  reject: "退回修改",
  accept: "接受",
  modify: "修改后接受",
  ignore: "忽略",
};

function formatDate(date?: Date | null) {
  return date ? new Date(date).toLocaleDateString("zh-CN") : "-";
}

function fullTime(date?: Date | null) {
  return date ? new Date(date).toLocaleString("zh-CN", { hour12: false }) : "-";
}

function reqHref(id: string, reqId: string) {
  return `/operator/conversations/${encodeURIComponent(id)}?requirementId=${encodeURIComponent(reqId)}`;
}

function metric(value: unknown) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (value instanceof Date) return formatDate(value);
  return String(value);
}

function fieldRows(req: RequirementView): Array<[string, unknown]> {
  return [
    ["Requirement", req.requirementNo],
    ["类型", req.projectType],
    ["状态", req.status.label],
    ["数据模态", req.modality],
    ["数据来源", req.dataSource],
    ["数据数量", req.dataCount?.toLocaleString()],
    ["交付时间", req.deliveryTime],
    ["质量要求", req.qualityRequirement],
    ["预算", req.budget],
    ["保密要求", req.confidentialityRequirement],
    ["需要采集", req.needCollection],
    ["需要标注", req.needAnnotation],
    ["涉及供应商", req.needSupplier],
    ["负责人", req.owner],
  ];
}

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ requirementId?: string; messageType?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const conversation = await getConversation(decodeURIComponent(id));

  if (!conversation) {
    return <div className="conversationPage"><div className="conversationEmpty">{text.noConversation}</div></div>;
  }

  const activeReq = conversation.requirements.find((req) => req.id === query?.requirementId) || conversation.requirements[0];
  const activeProject = activeReq.projects[0];
  const messages = allMessagesFor(conversation.projects).filter((message) => !query?.messageType || query.messageType === "ALL" || message.senderType === query.messageType);
  const suggestions = suggestionsFor(activeProject, activeReq);
  const timeline = timelineFor(activeProject, activeReq);
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "PENDING");

  return (
    <div className="conversationDetailPage">
      <div className="conversationDetailTop conversationDetailTopV2">
        <Link href="/operator/conversations">{text.back}</Link>
        <strong>{conversation.name}</strong>
        <span>{conversation.requirementCount} Requirement</span>
        <span>{text.owner}: {conversation.owner}</span>
        <span>{text.member}: {conversation.memberCount}</span>
        <b className={`aiState ${conversation.operationStatus.tone}`}>{conversation.operationStatus.label}</b>
        <span>{text.updated}: {fullTime(conversation.updatedAt)}</span>
      </div>

      <div className="conversationThreePane conversationThreePaneV2">
        <aside className="reqPane">
          <div className="reqPaneHead">
            <h2>{text.requirement}</h2>
            <ConversationActionButton kind="createRequirement" conversationId={conversation.id} label={text.newRequirement} primary />
          </div>
          <div className="reqFilters"><button>{text.all}</button></div>
          <div className="reqListScroll">
            {conversation.requirements.map((req) => (
              <Link href={reqHref(conversation.id, req.id)} className={`reqItem reqItemV2 ${req.id === activeReq.id ? "active" : ""}`} key={req.id}>
                <span className="reqDot" />
                <strong>{req.title}</strong>
                <em>{req.requirementNo}</em>
                <b className={`aiState ${req.status.tone}`}>{req.status.label}</b>
                <small>{req.projectType} / {text.relatedProject} {req.projectCount}</small>
                {req.hasPendingAiChange && <i>{text.pendingChange}</i>}
                <time>{formatDate(req.updatedAt)}</time>
              </Link>
            ))}
          </div>
        </aside>

        <main className="conversationPane conversationPaneV2">
          <div className="conversationPaneHead">
            <h2>{text.conversation}</h2>
            <div>
              {[["ALL", text.all], ["CUSTOMER", text.customerMsg], ["OPERATOR", text.operatorMsg], ["AI", text.aiMsg], ["SYSTEM", text.systemMsg]].map(([value, label]) => (
                <Link key={value} href={`/operator/conversations/${encodeURIComponent(conversation.id)}?requirementId=${encodeURIComponent(activeReq.id)}&messageType=${value}`}>{label}</Link>
              ))}
              <Link href={reqHref(conversation.id, activeReq.id)}>{text.currentReqOnly}</Link>
            </div>
          </div>
          <div className="messageStream messageStreamV2">
            <div className="requirementDivider">Requirement: {activeReq.title}</div>
            {messages.map((message) => {
              const related = message.requirementIds.includes(activeReq.id);
              return (
                <div className={`messageBlock messageBlockV2 ${message.senderType.toLowerCase()} ${related ? "related" : ""}`} id={related ? `req-${activeReq.id}` : undefined} key={message.id}>
                  <time>{fullTime(message.createdAt)}</time>
                  <div>
                    <header>
                      <strong>{message.senderName}</strong>
                      <span>{senderTypeLabel(message.senderType)}</span>
                      {message.aiProcessed ? <b>{text.aiProcessed}</b> : <b>{text.aiNotProcessed}</b>}
                      {message.hasChange && <em>{text.hasChange}</em>}
                    </header>
                    <p>{message.content}</p>
                    {message.attachments.length > 0 && <footer>{message.attachments.map((file) => <a key={file.name}>{file.name}</a>)}</footer>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="messageComposer">
            <textarea placeholder={text.inputPlaceholder} rows={2} />
            <div>
              <button>{text.upload}</button><button>@</button><button>{text.quote}</button><button>{text.aiReply}</button><button>{text.aiFollow}</button><button>{text.aiPolish}</button><button>{text.draft}</button><button className="primary">{text.send}</button>
            </div>
          </div>
        </main>

        <aside className="aiPane aiPaneV2">
          <div className="aiPaneHead"><h2>{text.aiWorkspace}</h2><span className={`aiState ${conversation.aiStatus.tone}`}>{conversation.aiStatus.label}</span></div>
          <section>
            <h3>{text.basic}</h3>
            <h4>{activeReq.title}</h4>
            <dl>{fieldRows(activeReq).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{metric(value)}</dd></div>)}</dl>
          </section>
          <section>
            <h3>{text.steps}</h3>
            {activeReq.steps.map((step) => <div className="reqStep" key={step.id}><b>Step {step.sortOrder}</b><strong>{step.stepName}</strong><span>{step.taskType} / {step.toolName || "-"}</span></div>)}
            <button className="ghostAction">+ AI 推荐步骤</button>
          </section>
          <section>
            <h3>{text.missing}</h3>
            {activeReq.missingFields.length === 0 ? <p>-</p> : activeReq.missingFields.map((field) => <div className="missingItem" key={field}><span>{field}</span><button>{text.aiFollow}</button><button>{text.ignore}</button></div>)}
          </section>
          <section>
            <h3>{text.suggestions}</h3>
            {suggestions.map((suggestion) => <SuggestionActions key={suggestion.id} conversationId={conversation.id} requirementId={activeReq.id} suggestion={suggestion} />)}
          </section>
          <section>
            <h3>{text.changes}</h3>
            {pendingSuggestions.length === 0 ? <p>-</p> : pendingSuggestions.map((suggestion) => <SuggestionActions key={suggestion.id} conversationId={conversation.id} requirementId={activeReq.id} suggestion={suggestion} compact />)}
          </section>
          <section>
            <h3>{text.projects}</h3>
            {activeReq.projects.length === 0 ? <p>{text.noProject}</p> : activeReq.projects.map((project: any) => <div className="linkedProject" key={project.id}><strong>{project.code}</strong><span>{project.name}</span><Link href={`/operator/projects/${project.code}`}>查看项目</Link></div>)}
            <div className="aiMainActions"><ConversationActionButton kind="preview" conversationId={conversation.id} requirementId={activeReq.id} action="PREVIEW" label={text.previewProject} primary /><ConversationActionButton kind="preview" conversationId={conversation.id} requirementId={activeReq.id} action="ANNOTATION" label={text.createAnnotation} /><ConversationActionButton kind="preview" conversationId={conversation.id} requirementId={activeReq.id} action="COLLECTION" label={text.createCollection} /></div>
          </section>
          <section>
            <h3>{text.timeline}</h3>
            <div className="reqTimeline">{timeline.map((item) => <div key={item.id}><time>{fullTime(item.createdAt)}</time><strong>{item.actionType}</strong><p>{item.description}</p></div>)}</div>
          </section>
          <div className="aiStickyActions"><ConversationActionButton kind="review" conversationId={conversation.id} requirementId={activeReq.id} action="APPROVE" label={text.approve} primary /><ConversationActionButton kind="review" conversationId={conversation.id} requirementId={activeReq.id} action="REJECT" label={text.reject} /><ConversationActionButton kind="preview" conversationId={conversation.id} requirementId={activeReq.id} action="PREVIEW" label={text.previewProject} /></div>
        </aside>
      </div>
    </div>
  );
}

function SuggestionActions({ conversationId, requirementId, suggestion, compact = false }: { conversationId: string; requirementId: string; suggestion: { id: string; type: string; title: string; content: string; reason: string; confidence: number }; compact?: boolean }) {
  return (
    <div className={compact ? "pendingChange" : "aiSuggestion"}>
      {!compact && <strong>{suggestion.title}</strong>}
      <p>{suggestion.content}</p>
      {!compact && <small>{suggestion.reason} / {suggestion.confidence}%</small>}
      <div>
        <ConversationActionButton kind="suggestion" conversationId={conversationId} suggestionId={suggestion.id} requirementId={requirementId} suggestionType={suggestion.type} suggestionTitle={suggestion.title} suggestionContent={suggestion.content} action="ACCEPT" label={text.accept} primary />
        <ConversationActionButton kind="suggestion" conversationId={conversationId} suggestionId={suggestion.id} requirementId={requirementId} suggestionType={suggestion.type} suggestionTitle={suggestion.title} suggestionContent={suggestion.content} action="MODIFY_ACCEPT" label={text.modify} />
        <ConversationActionButton kind="suggestion" conversationId={conversationId} suggestionId={suggestion.id} requirementId={requirementId} suggestionType={suggestion.type} suggestionTitle={suggestion.title} suggestionContent={suggestion.content} action="REJECT" label={text.ignore} />
      </div>
    </div>
  );
}
