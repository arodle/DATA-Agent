"use client";

import { useState } from "react";

type SettingTab = "profile" | "notification" | "agent" | "integrations" | "security";

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState<SettingTab>("profile");

  const tabs: { key: SettingTab; label: string; icon: string }[] = [
    { key: "profile", label: "个人信息", icon: "👤" },
    { key: "notification", label: "通知设置", icon: "🔔" },
    { key: "agent", label: "Agent 设置", icon: "🤖" },
    { key: "integrations", label: "集成配置", icon: "🔗" },
    { key: "security", label: "安全设置", icon: "🔒" },
  ];

  return (
    <div className="settingsPage">
      <div className="settingsBanner">
        <span className="settingsIcon">⚙️</span>
        <div className="settingsInfo">
          <strong>设置中心</strong>
          <p>个人信息 · 通知偏好 · Agent 配置 · 安全管理</p>
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
        {activeTab === "profile" && (
          <div className="settingsPanel">
            <div className="settingsSection">
              <h3 className="sectionTitle">基本信息</h3>
              <div className="formGrid">
                <div className="formItem">
                  <label>用户名</label>
                  <input type="text" defaultValue="李仁轩" disabled />
                </div>
                <div className="formItem">
                  <label>邮箱</label>
                  <input type="text" defaultValue="lirenxuan@example.com" disabled />
                </div>
                <div className="formItem">
                  <label>手机号</label>
                  <input type="text" defaultValue="138****8888" disabled />
                </div>
                <div className="formItem">
                  <label>所属组织</label>
                  <input type="text" defaultValue="Data Agent 团队" disabled />
                </div>
              </div>
            </div>

            <div className="settingsSection">
              <h3 className="sectionTitle">显示设置</h3>
              <div className="formGrid">
                <div className="formItem">
                  <label>主题模式</label>
                  <select defaultValue="light">
                    <option>浅色模式</option>
                    <option>深色模式</option>
                    <option>跟随系统</option>
                  </select>
                </div>
                <div className="formItem">
                  <label>语言</label>
                  <select defaultValue="zh">
                    <option>中文</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settingsFooter">
              <button className="ghostBtn">取消</button>
              <button className="primaryBtn">保存设置</button>
            </div>
          </div>
        )}

        {activeTab === "notification" && (
          <div className="settingsPanel">
            <div className="settingsSection">
              <h3 className="sectionTitle">消息通知</h3>
              <div className="toggleList">
                <div className="toggleItem">
                  <div>
                    <strong>项目进度通知</strong>
                    <p>项目状态变更、阶段完成时发送通知</p>
                  </div>
                  <div className="toggleSwitch on" />
                </div>
                <div className="toggleItem">
                  <div>
                    <strong>审核结果通知</strong>
                    <p>审核通过或驳回时发送通知</p>
                  </div>
                  <div className="toggleSwitch on" />
                </div>
                <div className="toggleItem">
                  <div>
                    <strong>Agent 授权提醒</strong>
                    <p>Agent 需要授权执行动作时发送提醒</p>
                  </div>
                  <div className="toggleSwitch on" />
                </div>
                <div className="toggleItem">
                  <div>
                    <strong>质量告警通知</strong>
                    <p>质检发现质量问题时发送告警</p>
                  </div>
                  <div className="toggleSwitch on" />
                </div>
                <div className="toggleItem">
                  <div>
                    <strong>邮件通知</strong>
                    <p>将重要通知发送到邮箱</p>
                  </div>
                  <div className="toggleSwitch off" />
                </div>
              </div>
            </div>

            <div className="settingsFooter">
              <button className="ghostBtn">恢复默认</button>
              <button className="primaryBtn">保存设置</button>
            </div>
          </div>
        )}

        {activeTab === "agent" && (
          <div className="settingsPanel">
            <div className="settingsSection">
              <h3 className="sectionTitle">Agent 行为设置</h3>
              <div className="toggleList">
                <div className="toggleItem">
                  <div>
                    <strong>自动执行低风险动作</strong>
                    <p>允许 Agent 自动执行无需人工确认的操作</p>
                  </div>
                  <div className="toggleSwitch on" />
                </div>
                <div className="toggleItem">
                  <div>
                    <strong>启用知识记忆</strong>
                    <p>允许 Agent 记住会话历史和偏好</p>
                  </div>
                  <div className="toggleSwitch on" />
                </div>
                <div className="toggleItem">
                  <div>
                    <strong>自动生成工具配置</strong>
                    <p>根据需求自动生成标注工具配置</p>
                  </div>
                  <div className="toggleSwitch off" />
                </div>
              </div>
            </div>

            <div className="settingsSection">
              <h3 className="sectionTitle">Agent 能力限制</h3>
              <div className="formGrid">
                <div className="formItem">
                  <label>每日最大调用次数</label>
                  <input type="number" defaultValue="100" />
                </div>
                <div className="formItem">
                  <label>单次执行超时</label>
                  <select defaultValue="30">
                    <option>15 分钟</option>
                    <option>30 分钟</option>
                    <option>60 分钟</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settingsFooter">
              <button className="ghostBtn">重置</button>
              <button className="primaryBtn">保存设置</button>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="settingsPanel">
            <div className="settingsSection">
              <h3 className="sectionTitle">云存储集成</h3>
              <div className="integrationList">
                <div className="integrationItem">
                  <div className="integrationIcon">☁️</div>
                  <div>
                    <strong>阿里云 OSS</strong>
                    <p>已连接 · bucket: data-agent-prod</p>
                  </div>
                  <button className="ghostBtn">配置</button>
                </div>
                <div className="integrationItem">
                  <div className="integrationIcon">☁️</div>
                  <div>
                    <strong>腾讯云 COS</strong>
                    <p>未连接</p>
                  </div>
                  <button className="primaryBtn">连接</button>
                </div>
              </div>
            </div>

            <div className="settingsSection">
              <h3 className="sectionTitle">模型服务集成</h3>
              <div className="integrationList">
                <div className="integrationItem">
                  <div className="integrationIcon">🤖</div>
                  <div>
                    <strong>OpenAI API</strong>
                    <p>已连接 · gpt-4o</p>
                  </div>
                  <button className="ghostBtn">配置</button>
                </div>
                <div className="integrationItem">
                  <div className="integrationIcon">🧠</div>
                  <div>
                    <strong>智谱 AI</strong>
                    <p>已连接 · glm-4</p>
                  </div>
                  <button className="ghostBtn">配置</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="settingsPanel">
            <div className="settingsSection">
              <h3 className="sectionTitle">账号安全</h3>
              <div className="formGrid">
                <div className="formItem">
                  <label>当前密码</label>
                  <input type="password" placeholder="请输入当前密码" />
                </div>
                <div className="formItem">
                  <label>新密码</label>
                  <input type="password" placeholder="请输入新密码" />
                </div>
              </div>
            </div>

            <div className="settingsSection">
              <h3 className="sectionTitle">登录安全</h3>
              <div className="toggleList">
                <div className="toggleItem">
                  <div>
                    <strong>双因素认证</strong>
                    <p>登录时需要手机验证码</p>
                  </div>
                  <div className="toggleSwitch off" />
                </div>
              </div>
            </div>

            <div className="settingsSection">
              <h3 className="sectionTitle">安全日志</h3>
              <div className="securityLog">
                <div className="logItem">
                  <span className="logTime">2026-07-10 10:30:00</span>
                  <span className="logAction">登录成功</span>
                  <span className="logIP">192.168.1.100</span>
                </div>
                <div className="logItem">
                  <span className="logTime">2026-07-09 15:20:00</span>
                  <span className="logAction">修改密码</span>
                  <span className="logIP">192.168.1.100</span>
                </div>
                <div className="logItem">
                  <span className="logTime">2026-07-08 09:45:00</span>
                  <span className="logAction">登录失败 (密码错误)</span>
                  <span className="logIP">10.0.0.50</span>
                </div>
              </div>
            </div>

            <div className="settingsFooter">
              <button className="primaryBtn">修改密码</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
