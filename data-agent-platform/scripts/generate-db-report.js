const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const outputPath = path.join(__dirname, '..', '数据库打通情况与表结构.csv');

const schema = fs.readFileSync(schemaPath, 'utf-8');

// Parse models
const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/gs;
const models = [];
let match;
while ((match = modelRegex.exec(schema)) !== null) {
  const modelName = match[1];
  const body = match[2];
  const fields = [];

  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;

    // Field pattern: name Type @attributes
    const fieldMatch = trimmed.match(/^([a-zA-Z_]\w*)\s+(\w+(?:\[\])?(?:\?)?)\s*(.*)$/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      let fieldType = fieldMatch[2];
      const attrs = fieldMatch[3];

      const isOptional = fieldType.endsWith('?');
      const isList = fieldType.endsWith('[]');
      if (isOptional) fieldType = fieldType.slice(0, -1);
      if (isList) fieldType = fieldType.slice(0, -2);

      let defaultValue = '';
      const defaultMatch = attrs.match(/@default\(([^)]+)\)/);
      if (defaultMatch) defaultValue = defaultMatch[1];

      let relation = '';
      const relMatch = attrs.match(/@relation\(([^)]*)\)/);
      if (relMatch) relation = '@relation(' + relMatch[1] + ')';

      const isId = attrs.includes('@id');
      const isUnique = attrs.includes('@unique');

      let notes = [];
      if (isId) notes.push('主键');
      if (isUnique) notes.push('唯一');
      if (isList) notes.push('数组');
      if (relation) notes.push(relation);
      if (attrs.includes('@updatedAt')) notes.push('自动更新');

      fields.push({
        name: fieldName,
        type: fieldType + (isList ? '[]' : '') + (isOptional ? '?' : ''),
        required: isOptional || isList ? '否' : '是',
        defaultValue,
        notes: notes.join(', '),
      });
    }
  }

  models.push({ name: modelName, fields });
}

// Build CSV
let csv = '\uFEFF'; // BOM for Excel

// Section 1: Page connection status
csv += '【一、前端页面数据库打通情况】\n';
csv += '页面路径,页面名称,所属模块,打通状态,数据来源说明\n';

const pages = [
  // Auth
  { path: '/auth/signin', name: '登录页', module: 'Auth', status: 'N/A', note: '登录页，不涉及数据库查询' },
  { path: '/(root)', name: '首页', module: 'Other', status: 'N/A', note: '重定向到登录或工作台' },

  // AI Agent Console
  { path: '/operator/agent-console', name: 'Dashboard', module: 'AI Agent Console', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/agent-console/studio', name: 'Agent Studio', module: 'AI Agent Console', status: '未打通', note: '纯客户端画布交互，无数据库查询' },
  { path: '/operator/agent-console/test', name: '测试与发布', module: 'AI Agent Console', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/agent-console/monitor', name: '运行监控', module: 'AI Agent Console', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/agent-console/knowledge/operation', name: '知识运营中心', module: 'AI Agent Console', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/agent-console/knowledge/assets', name: '知识资产中心', module: 'AI Agent Console', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/agent-console/knowledge/graph', name: '知识关系图谱', module: 'AI Agent Console', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/agent-console/rag', name: 'RAG检索中心', module: 'AI Agent Console', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/agent-console/models', name: '模型服务', module: 'AI Agent Console', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/agent-console/settings', name: '权限与审计', module: 'AI Agent Console', status: '已打通', note: 'prisma直接查询' },

  // Operator
  { path: '/operator', name: '运营工作台', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/projects', name: '项目管理', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/projects/[code]', name: '项目详情', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/collection', name: '数据采集', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/annotation', name: '数据标注', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/quality', name: '质量监控', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/quality/defects', name: '缺陷库', module: 'Operator', status: '未打通', note: '静态页面，无数据库查询' },
  { path: '/operator/review', name: '项目审核', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/finance', name: '财务结算', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/suppliers', name: '供应商管理', module: 'Operator', status: '未打通', note: '纯静态模拟数据' },
  { path: '/operator/agent', name: 'Agent助手', module: 'Operator', status: '已打通', note: '调用API + prisma' },
  { path: '/operator/logs', name: '操作日志', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/assets', name: '数据资产中心', module: 'Operator', status: '已打通', note: 'prisma直接查询' },
  { path: '/operator/settings', name: '系统设置', module: 'Operator', status: '未打通', note: '纯静态页面' },
  { path: '/operator/permissions', name: '权限管理', module: 'Operator', status: '未打通', note: '纯静态模拟数据' },

  // User
  { path: '/user', name: '用户首页', module: 'User', status: 'N/A', note: '重定向到/user/workspace' },
  { path: '/user/workspace', name: '用户工作台', module: 'User', status: '已打通', note: 'prisma直接查询' },
  { path: '/user/projects/[code]', name: '项目详情', module: 'User', status: '已打通', note: 'prisma直接查询' },
  { path: '/user/projects/[code]/chat', name: '项目对话', module: 'User', status: '已打通', note: 'prisma直接查询' },
  { path: '/user/agent', name: 'Agent助手', module: 'User', status: '已打通', note: 'prisma直接查询' },
  { path: '/user/models', name: '模型中心', module: 'User', status: '已打通', note: 'prisma直接查询' },
  { path: '/user/data', name: '数据管理', module: 'User', status: '已打通', note: 'prisma直接查询' },
  { path: '/user/annotation', name: '数据标注', module: 'User', status: '已打通', note: 'prisma直接查询' },
  { path: '/user/collection', name: '数据采集', module: 'User', status: '已打通', note: 'prisma直接查询' },
  { path: '/user/compute', name: '计算资源', module: 'User', status: '未打通', note: '纯静态模拟数据' },
  { path: '/user/settings', name: '设置中心', module: 'User', status: '未打通', note: '纯静态页面' },
  { path: '/user/workflow-demo', name: '工作流演示', module: 'User', status: '未打通', note: '演示页，模拟数据' },

  // Supplier
  { path: '/supplier', name: '供应商工作台', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },
  { path: '/supplier/annotation', name: '标注工作台', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },
  { path: '/supplier/annotation/[batchId]', name: '标注详情', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },
  { path: '/supplier/chat/[projectId]', name: '供应商沟通', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },
  { path: '/supplier/delivery', name: '交付管理', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },
  { path: '/supplier/team', name: '团队管理', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },
  { path: '/supplier/quality', name: '质量管理', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },
  { path: '/supplier/split', name: '数据拆分', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },
  { path: '/supplier/rules', name: '规则中心', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },
  { path: '/supplier/settlement', name: '结算中心', module: 'Supplier', status: '未打通', note: '纯静态模拟数据' },

  // Other
  { path: '/projects/new', name: '新建项目', module: 'Other', status: '未打通', note: '纯表单页面，未连接数据库' },
];

let connected = 0, unconnected = 0, na = 0;
for (const p of pages) {
  csv += `${p.path},${p.name},${p.module},${p.status},"${p.note}"\n`;
  if (p.status === '已打通') connected++;
  else if (p.status === '未打通') unconnected++;
  else na++;
}

csv += `\n统计,已打通:${connected}页,未打通:${unconnected}页,N/A:${na}页,总页面数:${pages.length}页,打通率:${Math.round((connected / (pages.length - na)) * 100)}%\n`;

// Section 2: Database schema
csv += '\n【二、数据库表结构（Prisma Schema）】\n';
csv += '模型名（表名）,字段名,数据类型,是否必填,默认值,关系/备注\n';

for (const model of models) {
  for (const field of model.fields) {
    csv += `${model.name},${field.name},${field.type},${field.required},"${field.defaultValue}","${field.notes}"\n`;
  }
}

csv += `\n统计,模型总数:${models.length}个,总字段数:${models.reduce((s, m) => s + m.fields.length, 0)}个,,,\n`;

fs.writeFileSync(outputPath, csv, 'utf-8');
console.log('CSV generated:', outputPath);
console.log(`Pages: ${connected} connected, ${unconnected} unconnected, ${na} N/A`);
console.log(`Models: ${models.length}, Fields: ${models.reduce((s, m) => s + m.fields.length, 0)}`);
