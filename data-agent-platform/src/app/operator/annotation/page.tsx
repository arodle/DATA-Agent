import OperationProjectBoard from "../OperationProjectBoard";

export const dynamic = "force-dynamic";

export default async function OperatorAnnotation({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  return (
    <OperationProjectBoard
      mode="ANNOTATION"
      title="标注概况"
      subtitle="标注任务大盘，围绕项目 ID 筛选运营审核中、标注中、验收中、任务完成"
      tabs={["标注任务", "appen标注任务", "释义词典", "自定义工具", "包工作报表", "工作报表", "结算报表", "账单报表"]}
      searchParams={params}
    />
  );
}