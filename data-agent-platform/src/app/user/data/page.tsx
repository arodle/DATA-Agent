import { prisma } from "@/lib/prisma";
import DataAssetsClient from "./DataAssetsClient";

export default async function DataAssetsPage() {
  const datasets = await prisma.dataset.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      versions: { orderBy: { createdAt: "desc" } },
    },
  });

  const files = await prisma.fileObject.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const publicAssets = await prisma.publicAsset.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serializedDatasets = datasets.map((ds) => ({
    id: ds.id,
    name: ds.name,
    type: ds.type,
    modality: ds.modality,
    itemCount: ds.itemCount,
    format: ds.format,
    storagePath: ds.storagePath,
    version: ds.version,
    source: ds.source,
    createdAt: ds.createdAt,
    versions: ds.versions.map((v) => ({
      id: v.id,
      version: v.version,
      changeNote: v.changeNote,
      itemCount: v.itemCount,
      createdAt: v.createdAt,
    })),
  }));

  const serializedFiles = files.map((f) => ({
    id: f.id,
    filename: f.filename,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    storagePath: f.storagePath,
    checksum: f.checksum,
    assetType: f.assetType,
    createdAt: f.createdAt,
  }));

  const serializedPublicAssets = publicAssets.map((a) => ({
    id: a.id,
    type: a.type,
    name: a.name,
    source: a.source,
    license: a.license,
    modality: a.modality,
    taskType: a.taskType,
    format: a.format,
    description: a.description,
    isOfficial: a.isOfficial,
    createdAt: a.createdAt,
  }));

  return (
    <DataAssetsClient
      datasets={serializedDatasets}
      files={serializedFiles}
      publicAssets={serializedPublicAssets}
    />
  );
}
