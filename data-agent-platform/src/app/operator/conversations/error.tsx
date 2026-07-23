"use client";

export default function ConversationError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="conversationPage">
      <div className="conversationErrorState">
        <h2>Conversation 加载失败</h2>
        <p>{error.message || "请稍后重试"}</p>
        <button onClick={() => reset()}>重试</button>
      </div>
    </div>
  );
}