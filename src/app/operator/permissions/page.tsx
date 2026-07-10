const permissionCards = [
  {
    title: "运营权限",
    icon: "🔧",
    rows: [
      { label: "项目审核", on: true },
      { label: "供应商分配", on: true },
      { label: "质量监控查看", on: true },
      { label: "操作日志查看", on: false },
      { label: "权限配置", on: false },
    ],
  },
  {
    title: "供应商权限",
    icon: "🏭",
    rows: [
      { label: "任务领取", on: true },
      { label: "批次提交", on: true },
      { label: "质检反馈查看", on: true },
      { label: "返修处理", on: false },
    ],
  },
  {
    title: "用户权限",
    icon: "👤",
    rows: [
      { label: "项目创建", on: true },
      { label: "需求文档编辑", on: true },
      { label: "数据集管理", on: true },
      { label: "Agent调用", on: true },
      { label: "项目删除", on: false },
    ],
  },
  {
    title: "Agent权限",
    icon: "🤖",
    rows: [
      { label: "工具配置读取", on: true },
      { label: "自动标注执行", on: true },
      { label: "数据导出", on: false },
      { label: "跨项目访问", on: false },
    ],
  },
];

export default function PermissionManagePage() {
  return (
    <div className="opWorkbench">
      <div className="agentBanner">
        <span className="agentBannerIcon">🔒</span>
        <div>
          <strong>权限管理</strong>
          <p>角色权限 · 数据权限 · 操作权限</p>
        </div>
      </div>

      <div className="permGrid">
        {permissionCards.map((card) => (
          <div className="permCard" key={card.title}>
            <div className="permCardHead">
              <span>{card.icon}</span>
              <strong>{card.title}</strong>
            </div>
            <div className="permCardBody">
              {card.rows.map((row) => (
                <div className="permRow" key={row.label}>
                  <span>{row.label}</span>
                  <span className={`permToggle ${row.on ? "on" : "off"}`}>
                    {row.on ? "已开启" : "已关闭"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
