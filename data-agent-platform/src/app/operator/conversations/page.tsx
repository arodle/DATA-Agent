import Link from "next/link";
import { ConversationSummary, getConversationSummaries, senderTypeLabel } from "./conversation-data";

const text = {
  title: "Conversation",
  subtitle: "\u4ece\u5ba2\u6237\u56e2\u961f\u7684\u957f\u671f\u6c9f\u901a\u8fdb\u5165 Requirement \u4e0e Project \u8fd0\u8425\u7ba1\u7406\u3002",
  conversation: "\u4f1a\u8bdd",
  latest: "\u6700\u65b0\u6d88\u606f",
  ai: "AI\u5206\u6790\u72b6\u6001",
  operation: "\u8fd0\u8425\u72b6\u6001",
  req: "Requirement",
  owner: "\u8d1f\u8d23\u4eba",
  updated: "\u66f4\u65b0\u65f6\u95f4",
  empty: "\u6682\u65e0 Conversation",
  search: "\u641c\u7d22 Conversation \u540d\u79f0",
  allAi: "\u5168\u90e8 AI \u72b6\u6001",
  allOp: "\u5168\u90e8\u8fd0\u8425\u72b6\u6001",
  allOwner: "\u5168\u90e8\u8d1f\u8d23\u4eba",
  unread: "\u53ea\u770b\u672a\u8bfb",
  filter: "\u7b5b\u9009",
  reset: "\u91cd\u7f6e",
  members: "\u540d\u6210\u5458",
  unreadMark: "\u672a\u8bfb",
};

function relativeTime(date: Date) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes}\u5206\u949f\u524d`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}\u5c0f\u65f6\u524d`;
  return new Date(date).toLocaleDateString("zh-CN");
}

function fullTime(date: Date) {
  return new Date(date).toLocaleString("zh-CN", { hour12: false });
}

function getParam(searchParams: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function matches(conversation: ConversationSummary, searchParams: Record<string, string | string[] | undefined> | undefined) {
  const q = getParam(searchParams, "q").trim().toLowerCase();
  const ai = getParam(searchParams, "ai");
  const operation = getParam(searchParams, "operation");
  const owner = getParam(searchParams, "owner");
  const reqStatus = getParam(searchParams, "reqStatus");
  const unread = getParam(searchParams, "unread") === "1";

  if (q && !conversation.name.toLowerCase().includes(q)) return false;
  if (ai && conversation.aiStatus.label !== ai) return false;
  if (operation && conversation.operationStatus.label !== operation) return false;
  if (owner && conversation.owner !== owner) return false;
  if (reqStatus && !conversation.requirements.some((req) => req.status.label === reqStatus)) return false;
  if (unread && conversation.unreadCount === 0) return false;
  return true;
}

export const dynamic = "force-dynamic";

export default async function ConversationListPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const conversations = await getConversationSummaries();
  const filtered = conversations.filter((conversation) => matches(conversation, params));
  const aiOptions = Array.from(new Set(conversations.map((item) => item.aiStatus.label)));
  const operationOptions = Array.from(new Set(conversations.map((item) => item.operationStatus.label)));
  const ownerOptions = Array.from(new Set(conversations.map((item) => item.owner)));
  const reqStatusOptions = Array.from(new Set(conversations.flatMap((item) => item.requirements.map((req) => req.status.label))));

  return (
    <div className="conversationPage">
      <header className="conversationHeader">
        <div>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <strong>{filtered.length}</strong>
      </header>

      <form className="conversationFilters">
        <input name="q" defaultValue={getParam(params, "q")} placeholder={text.search} />
        <select name="ai" defaultValue={getParam(params, "ai")}><option value="">{text.allAi}</option>{aiOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select name="operation" defaultValue={getParam(params, "operation")}><option value="">{text.allOp}</option>{operationOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select name="owner" defaultValue={getParam(params, "owner")}><option value="">{text.allOwner}</option>{ownerOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select name="reqStatus" defaultValue={getParam(params, "reqStatus")}><option value="">Requirement</option>{reqStatusOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <label><input type="checkbox" name="unread" value="1" defaultChecked={getParam(params, "unread") === "1"} />{text.unread}</label>
        <button type="submit">{text.filter}</button>
        <Link href="/operator/conversations">{text.reset}</Link>
      </form>

      <section className="conversationListCard">
        <div className="conversationTable conversationHead conversationTableV2">
          <span>{text.conversation}</span>
          <span>{text.latest}</span>
          <span>{text.ai}</span>
          <span>{text.operation}</span>
          <span>{text.req}</span>
          <span>{text.owner}</span>
          <span>{text.updated}</span>
        </div>
        {filtered.map((conversation) => {
          const latest = conversation.latestMessage;
          return (
            <Link href={conversation.href} className="conversationTable conversationRow conversationTableV2" key={conversation.id}>
              <strong className="conversationNameCell">
                <i className={`conversationStatus ${conversation.communicationStatus.tone}`} />
                <span>{conversation.name}</span>
                {conversation.unreadCount > 0 && <b>{conversation.unreadCount} {text.unreadMark}</b>}
                <em>{conversation.memberCount} {text.members}</em>
              </strong>
              <span className="conversationLatestCell">
                <b>{latest ? senderTypeLabel(latest.senderType) : "-"}: {latest?.content || text.empty}</b>
                <em>{latest ? relativeTime(latest.createdAt) : "-"}</em>
              </span>
              <span><b className={`aiState ${conversation.aiStatus.tone}`}>{conversation.aiStatus.label}</b></span>
              <span><b className={`aiState ${conversation.operationStatus.tone}`}>{conversation.operationStatus.label}</b></span>
              <span className="conversationReqPreview" title={conversation.requirements.map((req) => `${req.requirementNo} ${req.title}`).join("\n")}>
                <b>{conversation.requirementCount} Requirement</b>
                {conversation.requirements.slice(0, 2).map((req) => <em key={req.id}>{req.title}</em>)}
                {conversation.requirements.length > 2 && <i>+{conversation.requirements.length - 2}</i>}
              </span>
              <span>{conversation.owner}</span>
              <span className="conversationTimeCell"><b>{relativeTime(conversation.updatedAt)}</b><em>{fullTime(conversation.updatedAt)}</em></span>
            </Link>
          );
        })}
        {filtered.length === 0 && <div className="conversationEmpty">{text.empty}</div>}
      </section>
    </div>
  );
}