# DataOps Agent Demo

这是一个作品集版数据标采交付 Agent Demo。

目标不是复刻任何公司内部平台，而是展示一个通用的数据服务交付工作台：

- Agent 工作台作为主入口。
- 自建数据服务平台作为业务底座。
- 使用虚构客户、虚构供应商、虚构项目和模拟质量事件。
- 保留真实业务结构：需求、任务、规则、供应商、质量、返修、结算复核。

## 当前功能

- Agent 对话区
- 创建任务草稿
- 质量返修说明
- 结算前复核
- 需求表视图
- 任务批次视图
- 质量事件视图
- 规则知识库视图
- 草稿保存到浏览器 localStorage
- 模拟确认写入平台

## 本地打开

直接双击打开：

```text
index.html
```

或用浏览器访问本目录下的 `index.html`。

## 部署到服务器

将整个目录上传到服务器：

```text
/var/www/html/agent/
```

访问：

```text
http://你的服务器IP/agent/
```

如果只想覆盖首页，可以将本目录中的所有文件复制到：

```text
/var/www/html/
```

## 服务器命令示例

上传到 `/home/ubuntu/dataops-agent-demo` 后执行：

```bash
sudo mkdir -p /var/www/html/agent
sudo cp -r /home/ubuntu/dataops-agent-demo/* /var/www/html/agent/
```

## 后续升级方向

### 1. 接入真实模型

- OpenAI API
- Dify API
- 阿里百炼 API

第一步只接“生成需求文档、任务草稿、返修说明、结算清单”。

### 2. 接入数据库

静态 `data.js` 替换为：

- SQLite
- PostgreSQL
- Supabase

### 3. 接入平台工具

先做运营确认型写入：

```text
Agent 生成建议
↓
运营确认
↓
写入平台
↓
操作留痕
```

不要一开始做全自动写入。

### 4. 权限与安全

正式版本必须做：

- 登录
- 角色权限
- 项目可见范围
- 操作日志
- 数据脱敏
- API Key 服务端保存

## 数据安全边界

作品集版不应使用：

- 真实客户名称
- 真实供应商名称
- 真实报价
- 真实合同/预算单
- 真实平台截图
- 真实飞书聊天记录
- 真实样本数据
- 内部 API Key 或 token

推荐使用：

- 虚构客户
- 虚构供应商
- 模拟价格区间
- 改写后的需求案例
- 模拟质量事件
- 模拟平台字段

