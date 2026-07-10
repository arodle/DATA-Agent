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
            <div className="agentModuleGrid">
              <div className="agentModuleCard">
                <div className="agentModuleHead">
                  <span className="agentModuleIcon">🎯</span>
                  <div>
                    <strong>Skill 管理</strong>
                    <p>配置 Agent 可调用的能力技能</p>
                  </div>
                </div>
                <div className="agentModuleBody">
                  <div className="moduleRow">
                    <span>已启用技能</span>
                    <strong>12 个</strong>
                  </div>
                  <div className="moduleRow">
                    <span>技能分类</span>
                    <strong>5 类</strong>
                  </div>
                  <div className="moduleRow">
                    <span>技能调用频率</span>
                    <strong>高</strong>
                  </div>
                </div>
                <div className="agentModuleFooter">
                  <button className="ghostBtn">查看技能</button>
                  <button className="primaryBtn">配置</button>
                </div>
              </div>

              <div className="agentModuleCard">
                <div className="agentModuleHead">
                  <span className="agentModuleIcon">🔗</span>
                  <div>
                    <strong>任务编排</strong>
                    <p>编排 Agent 任务执行流程</p>
                  </div>
                </div>
                <div className="agentModuleBody">
                  <div className="moduleRow">
                    <span>编排模板</span>
                    <strong>8 个</strong>
                  </div>
                  <div className="moduleRow">
                    <span>运行中流程</span>
                    <strong>3 个</strong>
                  </div>
                  <div className="moduleRow">
                    <span>节点类型</span>
                    <strong>12 种</strong>
                  </div>
                </div>
                <div className="agentModuleFooter">
                  <button className="ghostBtn">查看编排</button>
                  <button className="primaryBtn">新建</button>
                </div>
              </div>

              <div className="agentModuleCard">
                <div className="agentModuleHead">
                  <span className="agentModuleIcon">📚</span>
                  <div>
                    <strong>知识库</strong>
                    <p>管理 Agent 私有知识库</p>
                  </div>
                </div>
                <div className="agentModuleBody">
                  <div className="moduleRow">
                    <span>文档总数</span>
                    <strong>256</strong>
                  </div>
                  <div className="moduleRow">
                    <span>向量索引</span>
                    <strong>已建立</strong>
                  </div>
                  <div className="moduleRow">
                    <span>更新时间</span>
                    <strong>2026-07-10</strong>
                  </div>
                </div>
                <div className="agentModuleFooter">
                  <button className="ghostBtn">浏览文档</button>
                  <button className="primaryBtn">上传</button>
                </div>
              </div>

              <div className="agentModuleCard">
                <div className="agentModuleHead">
                  <span className="agentModuleIcon">🛠️</span>
                  <div>
                    <strong>工具调用</strong>
                    <p>管理 Agent 可调用的外部工具</p>
                  </div>
                </div>
                <div className="agentModuleBody">
                  <div className="moduleRow">
                    <span>已接入工具</span>
                    <strong>6 个</strong>
                  </div>
                  <div className="moduleRow">
                    <span>今日调用</span>
                    <strong>42 次</strong>
                  </div>
                  <div className="moduleRow">
                    <span>成功率</span>
                    <strong className="success">98.5%</strong>
                  </div>
                </div>
                <div className="agentModuleFooter">
                  <button className="ghostBtn">调用记录</button>
                  <button className="primaryBtn">添加工具</button>
                </div>
              </div>

              <div className="agentModuleCard">
                <div className="agentModuleHead">
                  <span className="agentModuleIcon">🌱</span>
                  <div>
                    <strong>经验学习</strong>
                    <p>沉淀 Agent 经验教训与最佳实践</p>
                  </div>
                </div>
                <div className="agentModuleBody">
                  <div className="moduleRow">
                    <span>经验案例</span>
                    <strong>38 条</strong>
                  </div>
                  <div className="moduleRow">
                    <span>本周新增</span>
                    <strong>5 条</strong>
                  </div>
                  <div className="moduleRow">
                    <span>应用率</span>
                    <strong>76%</strong>
                  </div>
                </div>
                <div className="agentModuleFooter">
                  <button className="ghostBtn">查看案例</button>
                  <button className="primaryBtn">添加</button>
                </div>
              </div>

              <div className="agentModuleCard">
                <div className="agentModuleHead">
                  <span className="agentModuleIcon">📋</span>
                  <div>
                    <strong>执行记录</strong>
                    <p>查看 Agent 任务执行历史</p>
                  </div>
                </div>
                <div className="agentModuleBody">
                  <div className="moduleRow">
                    <span>累计执行</span>
                    <strong>1,286 次</strong>
                  </div>
                  <div className="moduleRow">
                    <span>成功率</span>
                    <strong className="success">99.1%</strong>
                  </div>
                  <div className="moduleRow">
                    <span>平均耗时</span>
                    <strong>3.2 秒</strong>
                  </div>
                </div>
                <div className="agentModuleFooter">
                  <button className="ghostBtn">查看全部</button>
                  <button className="primaryBtn">筛选</button>
                </div>
              </div>

              <div className="agentModuleCard">
                <div className="agentModuleHead">
                  <span className="agentModuleIcon">📈</span>
                  <div>
                    <strong>能力成长</strong>
                    <p>追踪 Agent 能力成长轨迹</p>
                  </div>
                </div>
                <div className="agentModuleBody">
                  <div className="moduleRow">
                    <span>能力维度</span>
                    <strong>6 个</strong>
                  </div>
                  <div className="moduleRow">
                    <span>本月提升</span>
                    <strong className="success">+8.5%</strong>
                  </div>
                  <div className="moduleRow">
                    <span>综合得分</span>
                    <strong>87.3</strong>
                  </div>
                </div>
                <div className="agentModuleFooter">
                  <button className="ghostBtn">能力雷达</button>
                  <button className="primaryBtn">详情</button>
                </div>
              </div>
            </div>

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
                <div className="toggleItem">
                  <div>
                    <strong>经验自动沉淀</strong>
                    <p>任务执行后自动提取经验到知识库</p>
                  </div>
                  <div className="toggleSwitch on" />
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
