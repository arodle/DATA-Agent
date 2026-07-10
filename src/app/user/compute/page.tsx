"use client";

import { useState } from "react";

const subTabs = [
  { key: "recommend", label: "资源推荐" },
  { key: "cost", label: "成本估算" },
  { key: "records", label: "调用记录" },
];

const gpuProviders = [
  { id: "p1", name: "AutoDL", logo: "🟢", region: "华东/华南", gpu: "A100 80G", price: 3.2, unit: "元/卡/时", stock: 128, latency: "低", highlight: "国内延迟最低" },
  { id: "p2", name: "恒源云", logo: "🔵", region: "华北", gpu: "A100 40G", price: 2.8, unit: "元/卡/时", stock: 64, latency: "低", highlight: "性价比高" },
  { id: "p3", name: "AWS EC2", logo: "🟡", region: "us-east-1", gpu: "A100 80G", price: 4.1, unit: "元/卡/时", stock: 256, latency: "中", highlight: "弹性扩容" },
  { id: "p4", name: "Google Cloud", logo: "🔴", region: "asia-east1", gpu: "T4 16G", price: 1.6, unit: "元/卡/时", stock: 512, latency: "中", highlight: "适合推理任务" },
  { id: "p5", name: "Lambda Labs", logo: "🟣", region: "us-west-2", gpu: "H100 80G", price: 5.8, unit: "元/卡/时", stock: 32, latency: "高", highlight: "大模型训练首选" },
];

const costScenarios = [
  { id: "s1", name: "2D 框标注预训练", model: "YOLOv8-X", dataset: "142,000 帧", epochs: 50, gpuType: "A100 80G", cards: 1, hours: 6, costPerHour: 3.2, totalCost: 19.2, provider: "AutoDL" },
  { id: "s2", name: "语义分割微调", model: "SAM-ViT-H", dataset: "50,000 帧", epochs: 30, gpuType: "A100 80G", cards: 2, hours: 12, costPerHour: 3.2, totalCost: 76.8, provider: "AutoDL" },
  { id: "s3", name: "多模态大模型推理", model: "Qwen-VL-72B", dataset: "-", epochs: 1, gpuType: "H100 80G", cards: 4, hours: 2, costPerHour: 5.8, totalCost: 46.4, provider: "Lambda Labs" },
];

const callRecords = [
  { id: "r1", time: "07-10 14:32", task: "预标注运行", provider: "AutoDL", gpu: "A100 80G", cards: 1, duration: "45min", cost: 2.4, status: "completed" },
  { id: "r2", time: "07-10 11:15", task: "质检模型推理", provider: "恒源云", gpu: "A100 40G", cards: 1, duration: "22min", cost: 1.03, status: "completed" },
  { id: "r3", time: "07-09 18:40", task: "预标注运行", provider: "AutoDL", gpu: "A100 80G", cards: 1, duration: "38min", cost: 2.03, status: "completed" },
  { id: "r4", time: "07-09 10:05", task: "模型训练", provider: "AWS EC2", gpu: "A100 80G", cards: 2, duration: "3h12min", cost: 26.24, status: "completed" },
  { id: "r5", time: "07-08 16:22", task: "推理测试", provider: "Google Cloud", gpu: "T4 16G", cards: 1, duration: "15min", cost: 0.4, status: "completed" },
];

export default function ComputePage() {
  const [subTab, setSubTab] = useState("recommend");

  const totalCost = callRecords.reduce((sum, r) => sum + r.cost, 0);

  return (
    <>
      <header className="roleTopbar">
        <div>
          <p className="crumb">用户视角 / 算力资源连接器</p>
          <h1>算力资源连接器</h1>
        </div>
        <div className="topbarRight">
          <span className="statusTag">平台不提供 GPU，帮您对接外部算力</span>
          <button className="primaryBtn">接入新资源</button>
        </div>
      </header>

      <div className="computeBanner">
        <span className="computeBannerIcon">🔌</span>
        <div>
          <strong>平台不直接提供算力</strong>
          <p>我们帮您对接第三方 GPU 云服务商，提供资源推荐、成本估算和调用追踪，按需选择最优方案</p>
        </div>
      </div>

      <div className="subTabBar">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            className={subTab === tab.key ? "subTabItem active" : "subTabItem"}
            onClick={() => setSubTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "recommend" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>GPU 资源推荐</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <select className="computeFilter">
                <option>全部 GPU 型号</option>
                <option>A100 80G</option>
                <option>A100 40G</option>
                <option>H100 80G</option>
                <option>T4 16G</option>
              </select>
              <select className="computeFilter">
                <option>全部区域</option>
                <option>国内</option>
                <option>海外</option>
              </select>
            </div>
          </div>
          <div className="gpuCardGrid">
            {gpuProviders.map((p) => (
              <div className="gpuCard" key={p.id}>
                <div className="gpuCardHead">
                  <span className="gpuLogo">{p.logo}</span>
                  <strong className="gpuName">{p.name}</strong>
                  <span className="gpuRegion">{p.region}</span>
                </div>
                <div className="gpuCardBody">
                  <div className="gpuSpec">
                    <span className="gpuSpecLabel">GPU</span>
                    <strong>{p.gpu}</strong>
                  </div>
                  <div className="gpuSpec">
                    <span className="gpuSpecLabel">价格</span>
                    <strong className="gpuPrice">¥{p.price}<span className="gpuPriceUnit">/{p.unit.slice(p.unit.indexOf("元/") + 2)}</span></strong>
                  </div>
                  <div className="gpuSpec">
                    <span className="gpuSpecLabel">可用卡数</span>
                    <strong>{p.stock}</strong>
                  </div>
                  <div className="gpuSpec">
                    <span className="gpuSpecLabel">延迟</span>
                    <strong>{p.latency}</strong>
                  </div>
                </div>
                <div className="gpuHighlight">{p.highlight}</div>
                <div className="gpuCardActions">
                  <button className="cloudBtn primary">选择并连接</button>
                  <button className="linkBtn">查看详情</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "cost" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>成本估算</h3>
            <button className="outlineBtn">新建估算</button>
          </div>
          <div className="costTable">
            <div className="costRow costHead">
              <span>场景</span>
              <span>模型</span>
              <span>数据集</span>
              <span>GPU</span>
              <span>卡数</span>
              <span>预估时长</span>
              <span>单价</span>
              <span>预估总费用</span>
              <span>推荐供应商</span>
            </div>
            {costScenarios.map((s) => (
              <div className="costRow" key={s.id}>
                <span className="costScenario">{s.name}</span>
                <span className="mono">{s.model}</span>
                <span>{s.dataset}</span>
                <span><span className="versionBadge">{s.gpuType}</span></span>
                <span>{s.cards}</span>
                <span>{s.hours}h</span>
                <span>¥{s.costPerHour}/卡/时</span>
                <span className="costTotal">¥{s.totalCost}</span>
                <span>{s.provider}</span>
              </div>
            ))}
          </div>
          <div className="costSummary">
            <div className="costSummaryCard">
              <span className="costSummaryLabel">本周已用</span>
              <strong className="costSummaryValue">¥{totalCost.toFixed(2)}</strong>
            </div>
            <div className="costSummaryCard">
              <span className="costSummaryLabel">本月预算</span>
              <strong className="costSummaryValue">¥500.00</strong>
            </div>
            <div className="costSummaryCard">
              <span className="costSummaryLabel">剩余预算</span>
              <strong className="costSummaryValue warn">¥{(500 - totalCost).toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}

      {subTab === "records" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>调用记录</h3>
            <button className="outlineBtn">导出</button>
          </div>
          <div className="recordTable">
            <div className="recordRow recordHead">
              <span>时间</span>
              <span>任务</span>
              <span>供应商</span>
              <span>GPU</span>
              <span>卡数</span>
              <span>时长</span>
              <span>费用</span>
              <span>状态</span>
            </div>
            {callRecords.map((r) => (
              <div className="recordRow" key={r.id}>
                <span className="mono">{r.time}</span>
                <span>{r.task}</span>
                <span>{r.provider}</span>
                <span><span className="versionBadge">{r.gpu}</span></span>
                <span>{r.cards}</span>
                <span>{r.duration}</span>
                <span className="costTotal">¥{r.cost.toFixed(2)}</span>
                <span><span className="statusBadge" style={{ background: "#e9fbf3", color: "#0aa866" }}>已完成</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
