export default function ConversationDetailLoading() {
  return (
    <div className="conversationDetailPage">
      <div className="conversationSkeletonHeader" />
      <div className="conversationThreePane conversationThreePaneV2">
        <div className="conversationSkeletonPanel" />
        <div className="conversationSkeletonPanel" />
        <div className="conversationSkeletonPanel" />
      </div>
    </div>
  );
}