import OperationProjectBoard from "../OperationProjectBoard";

export const dynamic = "force-dynamic";

export default async function OperatorCollection({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  return (
    <OperationProjectBoard
      mode="COLLECTION"
      title="采集任务"
      subtitle="按项目 ID 管理采集需求、负责人、执行状态与验收状态"
      tabs={["采集任务", "供应商协作", "采集工具", "工作报表", "结算报表"]}
      searchParams={params}
    />
  );
}