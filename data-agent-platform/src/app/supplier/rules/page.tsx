"use client";

import { useSupplierRole } from "../SupplierRoleContext";

interface AnnotRule {
  id: string;
  content: string;
  category: string;
  source: string;
}

const defaultRules: AnnotRule[] = [
  { id: "er1", content: "车辆被遮挡超过50% → 标记为 truncated（非 occluded）", category: "遮挡分类", source: "对话提取" },
  { id: "er2", content: "夜间车灯亮但车身看不清 → truncated", category: "遮挡分类", source: "对话提取" },
  { id: "er3", content: "小目标框可放大10%容差", category: "框精度", source: "对话提取" },
  { id: "er4", content: "放大后的框不能与相邻目标框重叠超过20%", category: "框精度", source: "对话提取" },
  { id: "er5", content: "交通标志牌作为整体框，不单独标文字", category: "标注范围", source: "手动添加" },
  { id: "er6", content: "PNG格式图片需转换为JPEG后标注", category: "格式规范", source: "手动添加" },
];

const categoryColors: Record<string, string> = {
  "遮挡分类": "#60a5fa",
  "框精度": "#34d399",
  "标注范围": "#d4a853",
  "格式规范": "#a78bfa",
  "质量要求": "#f87171",
  "其他": "#94a3b8",
};

export default function RulesPage() {
  const { role } = useSupplierRole();
  const rules = defaultRules;

  const grouped = rules.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, AnnotRule[]>);

  return (
    <div className="rulesPage">
      <div className="rulesHeader">
        <div>
          <h2>标注规则库</h2>
          <p>
            {role === "manager"
              ? "管理标注规则，从需求方对话中提取并增强后下发给标注员"
              : "由项目经理从需求方对话中提取和增强的标注规则"}
          </p>
        </div>
        <span className="rulesTotal">{rules.length} 条规则</span>
      </div>

      <div className="rulesGrid">
        {Object.entries(grouped).map(([category, catRules]) => (
          <div key={category} className="rulesCategory">
            <div className="rulesCatHead">
              <span className="rulesCatDot" style={{ background: categoryColors[category] || "#94a3b8" }} />
              <strong>{category}</strong>
              <span className="rulesCatCount">{catRules.length}</span>
            </div>
            <div className="rulesCatBody">
              {catRules.map((rule) => (
                <div key={rule.id} className="rulesItem">
                  <div className="rulesItemContent">{rule.content}</div>
                  <span className="rulesItemSource">{rule.source}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {role === "manager" && (
        <div className="rulesImport">
          <div className="rulesImportTitle">📥 导入规则文件</div>
          <p>将导出的 .txt 规则文件拖入此处，或点击上传。导入后标注员的Agent将自动加载最新规则。</p>
          <div className="rulesImportZone">
            <span>拖拽 .txt 文件到此处</span>
          </div>
        </div>
      )}
    </div>
  );
}
