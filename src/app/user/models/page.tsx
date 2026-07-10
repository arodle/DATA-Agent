import { prisma } from "@/lib/prisma";
import ModelConsoleClient from "./ModelConsoleClient";

export default async function ModelCenterPage() {
  const [models, runs] = await Promise.all([
    prisma.modelEntity.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        bindings: true,
        runs: true,
      },
    }),
    prisma.modelRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        model: true,
        dataset: true,
        recommendations: true,
      },
    }),
  ]);

  const serializedModels = models.map((m: typeof models[0]) => ({
    id: m.id,
    name: m.name,
    taskType: m.taskType,
    source: m.source,
    description: m.description,
    createdAt: m.createdAt,
    bindingCount: m.bindings.length,
    runCount: m.runs.length,
  }));

  const serializedRuns = runs.map((r: typeof runs[0]) => ({
    id: r.id,
    runName: r.runName,
    modelName: r.model.name,
    modelId: r.modelId,
    datasetName: r.dataset?.name ?? null,
    status: r.status,
    tool: r.tool,
    conclusion: r.conclusion,
    metricsJson: r.metricsJson as Record<string, unknown> | null,
    createdAt: r.createdAt,
    recommendations: r.recommendations.map((rec) => ({
      id: rec.id,
      title: rec.title,
      reason: rec.reason,
      nextDataNeed: rec.nextDataNeed,
      accepted: rec.accepted,
    })),
  }));

  return (
    <ModelConsoleClient
      models={serializedModels}
      runs={serializedRuns}
    />
  );
}
