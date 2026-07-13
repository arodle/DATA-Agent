"use client";

import { useState } from "react";

type SupplierTab = "list" | "detail";

interface SupplierTeam {
  id: string;
  name: string;
  leader: string;
  memberCount: number;
  status: "active" | "inactive";
}

interface SupplierMember {
  id: string;
  name: string;
  role: string;
  team: string;
  permissions: string[];
}

interface Supplier {
  id: string;
  name: string;
  status: string;
  statusType: "active" | "pending" | "inactive";
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  capabilityTags: string[];
  leader: string;
  manager: string;
  createdAt: string;
  teams: SupplierTeam[];
  members: SupplierMember[];
}

const mockSuppliers: Supplier[] = [
  {
    id: "SUP-001",
    name: "数据标注科技A",
    status: "已入库",
    statusType: "active",
    contactName: "张三",
    contactPhone: "138****1111",
    contactEmail: "zhangsan@datamark.com",
    capabilityTags: ["图像标注", "语音转写", "文本标注"],
    leader: "李四",
    manager: "王五",
    createdAt: "2026-01-15",
    teams: [
      { id: "T001", name: "图像标注一组", leader: "赵六", memberCount: 25, status: "active" },
      { id: "T002", name: "语音转写组", leader: "钱七", memberCount: 18, status: "active" },
      { id: "T003", name: "质检组", leader: "孙八", memberCount: 8, status: "active" },
    ],
    members: [
      { id: "M001", name: "赵六", role: "组长", team: "图像标注一组", permissions: ["标注", "审核", "提交"] },
      { id: "M002", name: "钱七", role: "组长", team: "语音转写组", permissions: ["标注", "审核", "提交"] },
      { id: "M003", name: "孙八", role: "质检负责人", team: "质检组", permissions: ["审核", "质检", "驳回"] },
    ],
  },
  {
    id: "SUP-002",
    name: "智能标注B",
    status: "已入库",
    statusType: "active",
    contactName: "刘九",
    contactPhone: "139****2222",
    contactEmail: "liujiu@smartmark.cn",
    capabilityTags: ["NLP标注", "表格标注", "视频标注"],
    leader: "周十",
    manager: "吴十一",
    createdAt: "2026-02-20",
    teams: [
      { id: "T004", name: "NLP标注组", leader: "郑十二", memberCount: 20, status: "active" },
      { id: "T005", name: "视频标注组", leader: "王十三", memberCount: 15, status: "active" },
    ],
    members: [
      { id: "M004", name: "郑十二", role: "组长", team: "NLP标注组", permissions: ["标注", "审核", "提交"] },
      { id: "M005", name: "王十三", role: "组长", team: "视频标注组", permissions: ["标注", "审核", "提交"] },
    ],
  },
  {
    id: "SUP-003",
    name: "采集服务C",
    status: "已入库",
    statusType: "active",
    contactName: "陈十四",
    contactPhone: "137****3333",
    contactEmail: "chen14@dataservice.com",
    capabilityTags: ["数据采集", "数据清洗", "数据标注"],
    leader: "林十五",
    manager: "何十六",
    createdAt: "2026-03-10",
    teams: [
      { id: "T006", name: "采集组", leader: "冯十七", memberCount: 30, status: "active" },
      { id: "T007", name: "清洗组", leader: "褚十八", memberCount: 12, status: "inactive" },
    ],
    members: [
      { id: "M006", name: "冯十七", role: "组长", team: "采集组", permissions: ["采集", "上传", "审核"] },
      { id: "M007", name: "褚十八", role: "组长", team: "清洗组", permissions: ["清洗", "审核", "提交"] },
    ],
  },
  {
    id: "SUP-004",
    name: "AI数据D",
    status: "审核中",
    statusType: "pending",
    contactName: "卫十九",
    contactPhone: "136****4444",
    contactEmail: "wei19@aidata.net",
    capabilityTags: ["AI预标注", "数据增强"],
    leader: "蒋二十",
    manager: "沈二十一",
    createdAt: "2026-06-05",
    teams: [
      { id: "T008", name: "AI预标注组", leader: "韩二十二", memberCount: 10, status: "active" },
    ],
    members: [
      { id: "M008", name: "韩二十二", role: "组长", team: "AI预标注组", permissions: ["预标注", "审核", "提交"] },
    ],
  },
];

export default function SupplierManagePage() {
  const [activeTab, setActiveTab] = useState<SupplierTab>("list");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const activeCount = mockSuppliers.filter((s) => s.statusType === "active").length;

  return (
    <div className="opWorkbench">
      <div className="agentBanner">
        <span className="agentBannerIcon">🏭</span>
        <div>
          <strong>供应商管理</strong>
          <p>供应商入库 · 团队管理 · 权限配置</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">🏭</span>
          <div>
            <strong>{mockSuppliers.length}</strong>
            <span>供应商总数</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">✅</span>
          <div>
            <strong>{activeCount}</strong>
            <span>已入库</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">⏳</span>
          <div>
            <strong>{mockSuppliers.filter((s) => s.statusType === "pending").length}</strong>
            <span>审核中</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">👥</span>
          <div>
            <strong>{mockSuppliers.reduce((sum, s) => sum + s.teams.reduce((t, team) => t + team.memberCount, 0), 0)}</strong>
            <span>总人数</span>
          </div>
        </div>
      </div>

      {activeTab === "list" && (
        <>
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">供应商列表</h3>
              <div className="opTableActions">
                <input type="text" placeholder="搜索供应商..." className="ghostBtn" style={{ width: 160 }} />
                <select className="ghostBtn">
                  <option>全部状态</option>
                  <option>已入库</option>
                  <option>审核中</option>
                  <option>已暂停</option>
                </select>
                <button className="primaryBtn">新增供应商</button>
              </div>
            </div>
            <div className="cardBody noPadding">
              <div className="projectTable">
                <div className="tableHeadRow">
                  <div>供应商编号</div>
                  <div>供应商名称</div>
                  <div>状态</div>
                  <div>联系人</div>
                  <div>负责人</div>
                  <div>项目经理</div>
                  <div>能力标签</div>
                  <div>团队数量</div>
                  <div>入库时间</div>
                  <div>操作</div>
                </div>
                {mockSuppliers.map((s) => (
                  <div className="tableDataRow" key={s.id}>
                    <div className="projectCode mono">{s.id}</div>
                    <div>
                      <strong>{s.name}</strong>
                    </div>
                    <div>
                      <span
                        className="detailStatus"
                        style={{
                          background: s.statusType === "active" ? "#0aa86620" : s.statusType === "pending" ? "#ffb54720" : "#9aa7b520",
                          color: s.statusType === "active" ? "#0aa866" : s.statusType === "pending" ? "#9b6400" : "#9aa7b5",
                        }}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div>{s.contactName}</div>
                    <div>{s.leader}</div>
                    <div>{s.manager}</div>
                    <div>
                      <div className="tagList">
                        {s.capabilityTags.slice(0, 2).map((tag) => (
                          <span key={tag} className="tinyTag">{tag}</span>
                        ))}
                        {s.capabilityTags.length > 2 && (
                          <span className="tinyTag">+{s.capabilityTags.length - 2}</span>
                        )}
                      </div>
                    </div>
                    <div>{s.teams.length}</div>
                    <div className="mono">{s.createdAt}</div>
                    <div>
                      <button className="linkBtn" onClick={() => { setSelectedSupplier(s); setActiveTab("detail"); }}>查看</button>
                      <button className="linkBtn">编辑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "detail" && selectedSupplier && (
        <div className="card">
          <div className="cardHeader">
            <h3 className="cardTitle">{selectedSupplier.name}</h3>
            <button className="ghostBtn" onClick={() => { setActiveTab("list"); setSelectedSupplier(null); }}>返回列表</button>
          </div>
          <div className="cardBody">
            <div className="supplierDetailLayout">
              <div className="supplierDetailLeft">
                <div className="detailSection">
                  <h4 className="detailSectionTitle">基本信息</h4>
                  <div className="detailGrid">
                    <div className="detailItem">
                      <span className="detailLabel">供应商编号</span>
                      <span className="detailValue mono">{selectedSupplier.id}</span>
                    </div>
                    <div className="detailItem">
                      <span className="detailLabel">供应商名称</span>
                      <span className="detailValue">{selectedSupplier.name}</span>
                    </div>
                    <div className="detailItem">
                      <span className="detailLabel">状态</span>
                      <span
                        className="detailValue"
                        style={{
                          background: selectedSupplier.statusType === "active" ? "#0aa86620" : selectedSupplier.statusType === "pending" ? "#ffb54720" : "#9aa7b520",
                          color: selectedSupplier.statusType === "active" ? "#0aa866" : selectedSupplier.statusType === "pending" ? "#9b6400" : "#9aa7b5",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        {selectedSupplier.status}
                      </span>
                    </div>
                    <div className="detailItem">
                      <span className="detailLabel">联系人</span>
                      <span className="detailValue">{selectedSupplier.contactName}</span>
                    </div>
                    <div className="detailItem">
                      <span className="detailLabel">联系电话</span>
                      <span className="detailValue">{selectedSupplier.contactPhone}</span>
                    </div>
                    <div className="detailItem">
                      <span className="detailLabel">邮箱</span>
                      <span className="detailValue">{selectedSupplier.contactEmail}</span>
                    </div>
                    <div className="detailItem">
                      <span className="detailLabel">负责人</span>
                      <span className="detailValue">{selectedSupplier.leader}</span>
                    </div>
                    <div className="detailItem">
                      <span className="detailLabel">项目经理</span>
                      <span className="detailValue">{selectedSupplier.manager}</span>
                    </div>
                    <div className="detailItem">
                      <span className="detailLabel">入库时间</span>
                      <span className="detailValue">{selectedSupplier.createdAt}</span>
                    </div>
                    <div className="detailItem">
                      <span className="detailLabel">能力标签</span>
                      <div className="tagList">
                        {selectedSupplier.capabilityTags.map((tag) => (
                          <span key={tag} className="tinyTag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detailSection">
                  <h4 className="detailSectionTitle">团队管理</h4>
                  <button className="primaryBtn" style={{ marginBottom: 12 }}>新增团队</button>
                  <div className="teamList">
                    {selectedSupplier.teams.map((team) => (
                      <div className="teamCard" key={team.id}>
                        <div className="teamCardHeader">
                          <strong>{team.name}</strong>
                          <span className={`statusBadge ${team.status === "active" ? "green" : "gray"}`}>
                            {team.status === "active" ? "活跃" : "暂停"}
                          </span>
                        </div>
                        <div className="teamCardBody">
                          <div className="teamInfo">
                            <span>负责人：{team.leader}</span>
                          </div>
                          <div className="teamInfo">
                            <span>成员数量：{team.memberCount} 人</span>
                          </div>
                        </div>
                        <div className="teamCardFooter">
                          <button className="ghostBtn">查看成员</button>
                          <button className="ghostBtn">编辑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="supplierDetailRight">
                <div className="detailSection">
                  <h4 className="detailSectionTitle">成员权限管理</h4>
                  <button className="primaryBtn" style={{ marginBottom: 12 }}>新增成员</button>
                  <div className="memberList">
                    {selectedSupplier.members.map((member) => (
                      <div className="memberCard" key={member.id}>
                        <div className="memberCardHeader">
                          <strong>{member.name}</strong>
                          <span className="memberRole">{member.role}</span>
                        </div>
                        <div className="memberCardBody">
                          <div className="memberInfo">
                            <span>所属团队：{member.team}</span>
                          </div>
                          <div className="memberPermissions">
                            <span className="permissionLabel">权限：</span>
                            <div className="permissionTags">
                              {member.permissions.map((p) => (
                                <span key={p} className="permissionTag">{p}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="memberCardFooter">
                          <button className="ghostBtn">编辑权限</button>
                          <button className="ghostBtn">移除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detailSection">
                  <h4 className="detailSectionTitle">权限配置</h4>
                  <div className="permissionConfig">
                    <div className="permissionSection">
                      <strong>标注权限</strong>
                      <div className="toggleItem">
                        <span>允许标注</span>
                        <div className="toggleSwitch on" />
                      </div>
                      <div className="toggleItem">
                        <span>允许审核</span>
                        <div className="toggleSwitch on" />
                      </div>
                      <div className="toggleItem">
                        <span>允许提交</span>
                        <div className="toggleSwitch on" />
                      </div>
                    </div>
                    <div className="permissionSection">
                      <strong>数据权限</strong>
                      <div className="toggleItem">
                        <span>允许查看数据</span>
                        <div className="toggleSwitch on" />
                      </div>
                      <div className="toggleItem">
                        <span>允许下载数据</span>
                        <div className="toggleSwitch off" />
                      </div>
                      <div className="toggleItem">
                        <span>允许上传数据</span>
                        <div className="toggleSwitch on" />
                      </div>
                    </div>
                    <div className="permissionSection">
                      <strong>管理权限</strong>
                      <div className="toggleItem">
                        <span>允许管理团队</span>
                        <div className="toggleSwitch off" />
                      </div>
                      <div className="toggleItem">
                        <span>允许查看报表</span>
                        <div className="toggleSwitch on" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
