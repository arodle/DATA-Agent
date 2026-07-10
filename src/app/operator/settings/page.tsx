"use client";

import { useState } from "react";

type SettingTab = "general" | "system" | "security" | "logs";

export default function OperatorSettings() {
  const [activeTab, setActiveTab] = useState<SettingTab>("general");

  const tabs: { key: SettingTab; label: string; icon: string }[] = [
    { key: "general", label: "通用设置", icon: "⚙️" },
    { key: "system", label: "系统配置", icon: "🔧" },
    { key: "security", label: "安全策略", icon: "🔒" },
    { key: "logs", label: "系统日志", icon: "📝" },
  ];

  return (
    <div className="settingsPage">
      <div className="settingsBanner">
        <span className="settingsIcon">⚙️</span>
        <div className="settingsInfo">
          <strong>系统设置</strong>
          <p>通用配置 · 系统参数 · 安全策略 · 审计日志</p>
        </div>
      </div>

      <div className="settingsTabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`settingsTab ${activeTab === tab.key ? "active" : ""}`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="settingsContent">
        {activeTab === "general" && (
          <div className="settingsPanel">
            <div className="settingsSection">
              <h3 className="sectionTitle">平台信息</h3>
              <div className="formGrid">
                <div className="formItem">
                  <label>平台名称</label>
                  <input type="text" defaultValue="Data Agent" />
                </div>
                <div className="formItem">
                  <label>运营邮箱</label>
                  <input type="text" defaultValue="ops@data-agent.com" />
                </div>
              </div>
            </div>
            <div className="settingsSection">
              <h3 className="sectionTitle">通知设置</h3>
              <div className="toggleList">
                <div className="toggleItem">
                  <div><strong>项目状态变更通知</strong><p>项目进入新阶段时通知运营</p></div>
                  <div className="toggleSwitch on" />
                </div>
                <div className="toggleItem">
                  <div><strong>供应商异常告警</strong><p>供应商交付延迟或质量问题时告警</p></div>
                  <div className="toggleSwitch on" />
                </div>
                <div className="toggleItem">
                  <div><strong>财务结算提醒</strong><p>账单到期前提醒</p></div>
                  <div className="toggleSwitch on" />
                </div>
              </div>
            </div>
            <div className="settingsFooter">
              <button className="ghostBtn">取消</button>
              <button className="primaryBtn">保存</button>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="settingsPanel">
            <div className="settingsSection">
              <h3 className="sectionTitle">项目默认配置</h3>
              <div className="formGrid">
                <div className="formItem">
                  <label>默认数据保留天数</label>
                  <input type="number" defaultValue={365} />
                </div>
                <div className="formItem">
                  <label>最大并发项目数</label>
                  <input type="number" defaultValue={50} />
                </div>
              </div>
            </div>
            <div className="settingsSection">
              <h3 className="sectionTitle">质检配置</h3>
              <div className="formGrid">
                <div className="formItem">
                  <label>默认抽检比例</label>
                  <input type="number" defaultValue={10} />
                </div>
                <div className="formItem">
                  <label>质检通过阈值</label>
                  <input type="number" defaultValue={95} />
                </div>
              </div>
            </div>
            <div className="settingsFooter">
              <button className="ghostBtn">重置</button>
              <button className="primaryBtn">保存</button>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="settingsPanel">
            <div className="settingsSection">
              <h3 className="sectionTitle">访问控制</h3>
              <div className="toggleList">
                <div className="toggleItem">
                  <div><strong>强制双因素认证</strong><p>所有运营人员登录需二次验证</p></div>
                  <div className="toggleSwitch off" />
                </div>
                <div className="toggleItem">
                  <div><strong>IP 白名单限制</strong><p>仅允许指定 IP 段访问运营端</p></div>
                  <div className="toggleSwitch off" />
                </div>
                <div className="toggleItem">
                  <div><strong>操作日志审计</strong><p>记录所有敏感操作</p></div>
                  <div className="toggleSwitch on" />
                </div>
              </div>
            </div>
            <div className="settingsSection">
              <h3 className="sectionTitle">密码策略</h3>
              <div className="formGrid">
                <div className="formItem">
                  <label>密码最小长度</label>
                  <input type="number" defaultValue={8} />
                </div>
                <div className="formItem">
                  <label>密码过期天数</label>
                  <input type="number" defaultValue={90} />
                </div>
              </div>
            </div>
            <div className="settingsFooter">
              <button className="ghostBtn">取消</button>
              <button className="primaryBtn">保存</button>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="settingsPanel">
            <div className="settingsSection">
              <h3 className="sectionTitle">系统操作日志</h3>
              <div className="securityLog">
                <div className="logItem">
                  <span className="logTime">2026-07-10 14:30:00</span>
                  <span className="logAction">admin 修改了质检阈值</span>
                  <span className="logIP">192.168.1.10</span>
                </div>
                <div className="logItem">
                  <span className="logTime">2026-07-10 11:15:00</span>
                  <span className="logAction">admin 创建了新供应商</span>
                  <span className="logIP">192.168.1.10</span>
                </div>
                <div className="logItem">
                  <span className="logTime">2026-07-09 16:45:00</span>
                  <span className="logAction">admin 批准了 PRJ-002 验收</span>
                  <span className="logIP">192.168.1.10</span>
                </div>
                <div className="logItem">
                  <span className="logTime">2026-07-09 09:20:00</span>
                  <span className="logAction">admin 结算了 BILL-2026-001</span>
                  <span className="logIP">192.168.1.10</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
