export type StorageAssetOption = {
  id: string;
  name: string;
  modality: string;
  itemCount: number;
  format: string;
  source: string;
  storagePath: string;
  description: string;
};

export const storageAssetOptions: StorageAssetOption[] = [
  {
    id: "storage-vehicle-6996",
    name: "城市道路样例图像",
    modality: "图像",
    itemCount: 6996,
    format: "jpg",
    source: "用户已上传数据资产",
    storagePath: "/storage/demo/vehicle-6996",
    description: "6996 张城市道路图片，适合车辆、行人、骑行人 2D 框标注。",
  },
  {
    id: "storage-coco-vehicle-500",
    name: "COCO 车辆公开样例",
    modality: "图像",
    itemCount: 500,
    format: "COCO JSON",
    source: "公共数据库检索资产",
    storagePath: "/storage/public/coco-vehicle-500",
    description: "从 COCO 中筛选的车辆类公开样例，用于格式转换和教学演示。",
  },
  {
    id: "storage-school-waste-300",
    name: "校园垃圾分类样例",
    modality: "图像",
    itemCount: 300,
    format: "jpg",
    source: "教育模式样例资产",
    storagePath: "/storage/education/waste-300",
    description: "可回收物、厨余、其他垃圾三类教学图像。",
  },
  {
    id: "storage-ocr-ticket-120",
    name: "OCR 票据样例",
    modality: "图像",
    itemCount: 120,
    format: "image+txt",
    source: "公共样例资产",
    storagePath: "/storage/public/ocr-ticket-120",
    description: "用于 OCR 框选、转写和质检脚本演示。",
  },
];

export function getStorageAssetOption(id: string) {
  return storageAssetOptions.find((asset) => asset.id === id) ?? storageAssetOptions[0];
}