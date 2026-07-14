import { prisma } from "@/lib/prisma";
import OperatorAssetsClient from "./OperatorAssetsClient";

export default async function OperatorAssets() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { datasets: { include: { versions: true } } },
    });
  } catch (e) {
    console.error("Database error:", e);
  }

  const totalDatasets = projects.reduce((sum: any, p: any) => sum + p.datasets.length, 0);
  const totalItems = projects.reduce(
    (sum: any, p: any) => sum + p.datasets.reduce((s: any, d: any) => s + (d.itemCount ?? 0), 0),
    0
  );

  const datasets = projects.flatMap((p: any) =>
    p.datasets.map((d: any) => ({
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
