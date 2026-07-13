import { prisma } from "@/lib/prisma";
import OperatorAssetsClient from "./OperatorAssetsClient";

export default async function OperatorAssets() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { datasets: { include: { versions: true } } },
  });

  const totalDatasets = projects.reduce((sum, p) => sum + p.datasets.length, 0);
  const totalItems = projects.reduce(
    (sum, p) => sum + p.datasets.reduce((s, d) => s + (d.itemCount ?? 0), 0),
    0
  );

  const datasets = projects.flatMap((p) =>
    p.datasets.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      itemCount: d.itemCount,
      version: d.version,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      versions: d.versions,
      projectName: p.name,
    }))
  );

  return (
    <OperatorAssetsClient
      totalDatasets={totalDatasets}
      totalItems={totalItems}
      projectCount={projects.length}
      datasets={datasets}
    />
  );
}
