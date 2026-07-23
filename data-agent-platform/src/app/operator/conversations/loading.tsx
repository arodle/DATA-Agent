export default function ConversationLoading() {
  return (
    <div className="conversationPage">
      <div className="conversationSkeletonHeader" />
      <div className="conversationListCard">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="conversationSkeletonRow" key={index} />
        ))}
      </div>
    </div>
  );
}