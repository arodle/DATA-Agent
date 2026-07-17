import Link from "next/link";
import { createDraftProject } from "@/app/actions";
import DataConnectionSelector from "@/components/DataConnectionSelector";

const currentUser = {
  name: "林同学",
  organization: "AutoLab",
  department: "感知算法组",
  email: "lirenxuan@example.com",
};

export default function NewProjectPage() {
  return (
    <main className="formPage">
      <section className="formPanel compactFormPanel">
        <div className="formHeader">
          <div>
            <p className="crumb">项目创建 / 系统已绑定当前用户与数据存储层</p>
            <h1>新建数据标采项目草稿</h1>
          </div>
          <Link className="secondaryLink" href="/">返回项目列表</Link>
        </div>

        <section className="boundUserCard" aria-label="当前用户">
          <div>
            <span>当前用户</span>
            <strong>{currentUser.name}</strong>
          </div>
          <div>
            <span>组织 / 部门</span>
            <strong>{currentUser.organization} / {currentUser.department}</strong>
          </div>
          <div>
            <span>联系方式</span>
            <strong>{currentUser.email}</strong>
          </div>
        </section>

        <form action={createDraftProject} className="formGrid compactGrid">
          <label className="field span2">
            <span>任务名称</span>
            <input name="projectName" required placeholder="例如：城市道路车辆 2D 框标注" />
          </label>

          <label className="field">
            <span>需求类型</span>
            <select name="demandType" defaultValue="标注">
              <option>采集</option>
              <option>标注</option>
              <option>清洗</option>
              <option>质检</option>
              <option>公开数据检索</option>
            </select>
          </label>

          <label className="field">
            <span>项目模式</span>
            <select name="mode" defaultValue="PROFESSIONAL">
              <option value="PROFESSIONAL">专业项目</option>
              <option value="EDUCATION">教育项目</option>
            </select>
          </label>

          <div className="field span2">
            <span>选择数据连接</span>
            <DataConnectionSelector />
          </div>

          <label className="field span2">
            <span>目标模型或用途</span>
            <input name="modelName" placeholder="例如：训练 YOLOv8n 车辆检测 / 做课程演示 / 暂未绑定" />
          </label>

          <label className="field span2">
            <span>一句话描述需求</span>
            <textarea name="scenario" rows={4} placeholder="说清楚要做什么、用于什么模型或结论。数据量、格式、路径由已选数据资产自动带出。" />
          </label>

          <label className="field span2">
            <span>验收关注点</span>
            <textarea name="acceptanceCriteria" rows={3} placeholder="例如：重点检查漏标、框偏移、类别错误；或先让 Agent 生成建议。" />
          </label>

          <div className="formActions span2">
            <p>提交后只创建草稿和 Agent 授权预览，不会直接进入正式执行，也不会分配供应商。</p>
            <button className="primaryBtn" type="submit">创建草稿</button>
          </div>
        </form>
      </section>
    </main>
  );
}