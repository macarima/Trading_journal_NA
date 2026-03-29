import { useState, useMemo, useEffect, useCallback } from "react";

// Demo data for browser preview only (not real data)
const SEED_DATA = [
  { date: "2026-01-02", futures: 450, stock: 312.50, note: "샘플", rate: 1350, nasdaq: 1.25, sp500: 0.87 },
  { date: "2026-01-05", futures: -280, stock: 85.25, note: "", rate: 1350, nasdaq: -0.64, sp500: -0.32 },
  { date: "2026-01-06", futures: 620, stock: -142.30, note: "", rate: 1350, nasdaq: 0.95, sp500: 0.71 },
  { date: "2026-01-07", futures: 175, stock: 0, note: "", rate: 1350, nasdaq: 0.33, sp500: 0.18 },
  { date: "2026-01-08", futures: -95, stock: 210.75, note: "", rate: 1350, nasdaq: -1.12, sp500: -0.85 },
  { date: "2026-01-09", futures: 830, stock: 0, note: "", rate: 1350, nasdaq: 1.78, sp500: 1.20 },
  { date: "2026-01-12", futures: -410, stock: -65.40, note: "", rate: 1350, nasdaq: -0.45, sp500: -0.28 },
  { date: "2026-01-13", futures: 560, stock: 180.90, note: "", rate: 1350, nasdaq: 0.52, sp500: 0.41 },
  { date: "2026-01-14", futures: 310, stock: 0, note: "", rate: 1350, nasdaq: 0.88, sp500: 0.62 },
  { date: "2026-01-15", futures: -720, stock: 425.60, note: "", rate: 1350, nasdaq: -2.10, sp500: -1.55 },
  { date: "2026-02-02", futures: 390, stock: -110.80, note: "", rate: 1360, nasdaq: 0.73, sp500: 0.44 },
  { date: "2026-02-03", futures: -550, stock: 0, note: "", rate: 1360, nasdaq: -0.91, sp500: -0.68 },
  { date: "2026-02-04", futures: 870, stock: 245.30, note: "", rate: 1360, nasdaq: 1.36, sp500: 0.92 },
  { date: "2026-02-05", futures: 125, stock: 0, note: "", rate: 1360, nasdaq: 0.15, sp500: 0.09 },
  { date: "2026-02-06", futures: -340, stock: 190.65, note: "", rate: 1360, nasdaq: -0.57, sp500: -0.33 },
  { date: "2026-02-09", futures: 680, stock: 0, note: "", rate: 1360, nasdaq: 1.02, sp500: 0.76 },
  { date: "2026-02-10", futures: -215, stock: -88.40, note: "", rate: 1360, nasdaq: -0.38, sp500: -0.21 },
  { date: "2026-02-11", futures: 445, stock: 0, note: "", rate: 1360, nasdaq: 0.67, sp500: 0.48 },
  { date: "2026-02-12", futures: 960, stock: 155.20, note: "", rate: 1360, nasdaq: 2.05, sp500: 1.34 },
  { date: "2026-02-13", futures: -180, stock: 0, note: "", rate: 1360, nasdaq: -0.22, sp500: -0.14 },
  { date: "2026-03-02", futures: 530, stock: -75.60, note: "", rate: 1370, nasdaq: 0.89, sp500: 0.55 },
  { date: "2026-03-03", futures: -640, stock: 310.45, note: "", rate: 1370, nasdaq: -1.44, sp500: -0.98 },
  { date: "2026-03-04", futures: 290, stock: 0, note: "", rate: 1370, nasdaq: 0.42, sp500: 0.31 },
  { date: "2026-03-05", futures: 780, stock: 128.90, note: "", rate: 1370, nasdaq: 1.56, sp500: 1.08 },
  { date: "2026-03-06", futures: -150, stock: 0, note: "", rate: 1370, nasdaq: -0.33, sp500: -0.19 },
  { date: "2026-03-09", futures: 415, stock: -220.35, note: "", rate: 1370, nasdaq: 0.71, sp500: 0.52 },
  { date: "2026-03-10", futures: -580, stock: 0, note: "", rate: 1370, nasdaq: -1.88, sp500: -1.23 },
  { date: "2026-03-11", futures: 340, stock: 95.70, note: "", rate: 1370, nasdaq: 0.58, sp500: 0.39 },
  { date: "2026-03-12", futures: 195, stock: 0, note: "", rate: 1370, nasdaq: 0.26, sp500: 0.17 },
  { date: "2026-03-13", futures: -470, stock: 260.15, note: "", rate: 1370, nasdaq: -0.95, sp500: -0.62 },
];

const MONTHS_KR = { 1:"1월",2:"2월",3:"3월",4:"4월",5:"5월",6:"6월",7:"7월",8:"8월",9:"9월",10:"10월",11:"11월",12:"12월" };

function toMonthKey(d){ const [y,m]=d.split("-"); return `${y}.${parseInt(m)}`; }
function toYear(d){ return parseInt(d.split("-")[0]); }

// 부동소수점 오차 방지용 반올림
function rd(n,dec=2){ return Math.round(n*Math.pow(10,dec))/Math.pow(10,dec); }

function fmt(n,dec=1){
  if(n==null||isNaN(n))return"—";
  const s=Math.abs(n).toLocaleString("ko-KR",{minimumFractionDigits:dec,maximumFractionDigits:dec});
  return n<0?`-${s}`:n>0?`+${s}`:s;
}
function fmtKRW(n){
  if(n==null||isNaN(n))return"—";
  const s=Math.abs(n).toLocaleString("ko-KR",{minimumFractionDigits:2,maximumFractionDigits:2});
  return n<0?`-₩${s}`:n>0?`+₩${s}`:`₩${s}`;
}
function fmtPct(n){
  if(n==null||isNaN(n))return"—";
  return (n>0?"+":"")+n.toFixed(2)+"%";
}
function colorClass(n){ return n>0?"profit":n<0?"loss":"zero"; }

// Y축 눈금 생성: 대칭형 (일일손익)
function niceTicks(maxAbs, steps=5) {
  if(maxAbs<=0) return [0];
  const raw=maxAbs/steps;
  const mag=Math.pow(10,Math.floor(Math.log10(raw)));
  const candidates=[1,1.5,2,2.5,3,4,5,8,10];
  const nice=candidates.find(m=>m*mag>=raw)*mag;
  const ticks=[0];
  for(let i=1;i<=steps;i++){
    const v=rd(nice*i,2);
    if(v<=maxAbs*1.15){ticks.push(v);ticks.push(-v);}
  }
  return ticks.sort((a,b)=>a-b);
}
// Y축 눈금 생성: 비대칭형 (누적수익)
function niceTicksRange(min,max,steps=5) {
  if(min===max) return [min];
  const range=max-min;
  const raw=range/steps;
  const mag=Math.pow(10,Math.floor(Math.log10(raw)));
  const candidates=[1,1.5,2,2.5,3,4,5,8,10];
  const nice=candidates.find(m=>m*mag>=raw)*mag;
  const ticks=[];
  const start=Math.floor(min/nice)*nice;
  for(let v=start;v<=max+nice*0.5;v=rd(v+nice,2)) ticks.push(rd(v,2));
  // 반드시 0을 포함
  if(!ticks.includes(0)&&min<=0&&max>=0) ticks.push(0);
  return [...new Set(ticks)].sort((a,b)=>a-b);
}
function fmtCompact(n) {
  if(n==null||isNaN(n)) return "—";
  const abs=Math.abs(n);
  const s=abs>=1000?(abs/1000).toFixed(1)+"K":abs.toFixed(0);
  return (n>0?"+":n<0?"-":"")+s;
}

function MiniBar({value,max}){
  const pct=max===0?0:Math.min(Math.abs(value)/max*100,100);
  return(
    <div style={{width:50,height:5,background:"var(--surface-2)",borderRadius:3,overflow:"hidden",flexShrink:0}}>
      <div style={{width:`${pct}%`,height:"100%",background:value>=0?"var(--green)":"var(--red)",borderRadius:3,transition:"width 0.4s ease"}}/>
    </div>
  );
}

function Modal({open,onClose,title,children}){
  if(!open)return null;
  return(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3>{title}</h3><button className="close-btn" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  );
}

function RecordForm({record,onSave,onCancel,defaultRate,isElectron}){
  const [form,setForm]=useState(record||{
    date:new Date().toISOString().slice(0,10),futures:0,stock:0,note:"",rate:defaultRate||1400,nasdaq:0,sp500:0,
  });
  const [fetching,setFetching]=useState(false);

  const daily=(parseFloat(form.futures)||0)+(parseFloat(form.stock)||0);
  const krw=daily*(parseFloat(form.rate)||0);

  async function handleFetch(){
    if(!window.api)return;
    setFetching(true);
    try{
      const d=await window.api.fetchMarketData(form.date);
      setForm(p=>({...p,
        rate:d.rate??p.rate,
        nasdaq:d.nasdaq??p.nasdaq,
        sp500:d.sp500??p.sp500,
      }));
    }catch{}
    setFetching(false);
  }

  return(
    <div className="form-body">
      <div className="form-grid">
        <label>
          <span>날짜</span>
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </label>
        <label>
          <span>환율 (₩/$)</span>
          <div style={{display:"flex",gap:6}}>
            <input type="number" step="0.01" value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} style={{flex:1}}/>
          </div>
        </label>
        <label>
          <span>선물 수익 ($)</span>
          <input type="number" step="0.1" value={form.futures} onChange={e=>setForm({...form,futures:e.target.value})}/>
        </label>
        <label>
          <span>주식 실현 수익 ($)</span>
          <input type="number" step="0.0001" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/>
        </label>
        <label>
          <span>NASDAQ 100 (%)</span>
          <input type="number" step="0.01" value={form.nasdaq} onChange={e=>setForm({...form,nasdaq:e.target.value})}/>
        </label>
        <label>
          <span>S&P 500 (%)</span>
          <input type="number" step="0.01" value={form.sp500} onChange={e=>setForm({...form,sp500:e.target.value})}/>
        </label>
        <label className="full-width">
          <span>비고</span>
          <input type="text" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="메모 입력..."/>
        </label>
      </div>
      {isElectron&&(
        <button className="btn-fetch" onClick={handleFetch} disabled={fetching}>
          {fetching?"가져오는 중...":"📡 시세 자동 입력"}
        </button>
      )}
      <div className="form-preview">
        <div className="preview-item"><span>일일 수익</span><span className={colorClass(daily)}>{fmt(daily,2)}</span></div>
        <div className="preview-item"><span>원화 환산</span><span className={colorClass(krw)}>{fmtKRW(krw)}</span></div>
      </div>
      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>취소</button>
        <button className="btn-primary" onClick={()=>onSave({
          ...form,
          futures:parseFloat(form.futures)||0,stock:parseFloat(form.stock)||0,
          rate:parseFloat(form.rate)||0,nasdaq:parseFloat(form.nasdaq)||0,sp500:parseFloat(form.sp500)||0,
        })}>저장</button>
      </div>
    </div>
  );
}

// ── PDF Report HTML Generator ──
function buildReportHTML(year, yearRecords, grouped, months, yearStats, taxStats) {
  const fmtR=(n,d=1)=>{if(n==null||isNaN(n))return"—";const s=Math.abs(n).toLocaleString("ko-KR",{minimumFractionDigits:d,maximumFractionDigits:d});return n<0?`-${s}`:n>0?`+${s}`:s;};
  const fmtK=(n)=>{if(n==null||isNaN(n))return"—";const s=Math.abs(n).toLocaleString("ko-KR",{minimumFractionDigits:2,maximumFractionDigits:2});return n<0?`-₩${s}`:n>0?`+₩${s}`:`₩${s}`;};
  const col=(n)=>n>0?"#16a34a":n<0?"#dc2626":"#666";

  // Build daily bar chart SVG
  function buildBarSVG(recs, title) {
    if(!recs.length) return "";
    const W=700,H=180,pl=50,pr=15,pt=25,pb=25;
    const iW=W-pl-pr, iH=H-pt-pb;
    const dailys=recs.map(r=>r.futures+r.stock);
    const maxA=Math.max(...dailys.map(Math.abs),1);
    const n=recs.length;
    const bW=Math.min(iW/n*0.7,20);
    const gap=iW/n;
    const yS=v=>pt+iH/2-(v/maxA)*(iH/2);
    const zY=pt+iH/2;

    let bars="";
    recs.forEach((r,i)=>{
      const d=dailys[i];
      const x=pl+gap*i+gap/2-bW/2;
      const top=d>=0?yS(d):zY;
      const h=Math.abs(yS(d)-zY);
      bars+=`<rect x="${x}" y="${top}" width="${bW}" height="${Math.max(h,1)}" rx="2" fill="${d>=0?"#16a34a":"#dc2626"}" opacity="0.85"/>`;
    });

    return `<div style="margin:12px 0"><div style="font-size:11px;font-weight:600;color:#444;margin-bottom:6px">${title}</div><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto"><line x1="${pl}" x2="${W-pr}" y1="${zY}" y2="${zY}" stroke="#ddd" stroke-width="1"/><text x="${pl-6}" y="${yS(maxA*0.5)}" fill="#999" font-size="9" text-anchor="end" dominant-baseline="middle">${(maxA*0.5).toFixed(0)}</text><text x="${pl-6}" y="${zY}" fill="#999" font-size="9" text-anchor="end" dominant-baseline="middle">0</text><text x="${pl-6}" y="${yS(-maxA*0.5)}" fill="#999" font-size="9" text-anchor="end" dominant-baseline="middle">${(-maxA*0.5).toFixed(0)}</text>${bars}</svg></div>`;
  }

  // Build cumulative line SVG
  function buildCumSVG(recs, title) {
    if(!recs.length) return "";
    const W=700,H=160,pl=50,pr=15,pt=20,pb=20;
    const iW=W-pl-pr, iH=H-pt-pb;
    let cum=0;
    const cums=recs.map(r=>{cum+=r.futures+r.stock;return cum;});
    const maxC=Math.max(...cums.map(Math.abs),1);
    const yS=v=>pt+iH/2-(v/maxC)*(iH/2);
    const xS=i=>pl+(i/(cums.length-1||1))*iW;
    const zY=yS(0);
    const pts=cums.map((v,i)=>`${xS(i).toFixed(1)},${yS(v).toFixed(1)}`);
    const pathD=pts.map((p,i)=>(i===0?"M":"L")+p).join(" ");
    const last=cums[cums.length-1];
    const lc=last>=0?"#16a34a":"#dc2626";

    return `<div style="margin:12px 0"><div style="font-size:11px;font-weight:600;color:#444;margin-bottom:6px">${title}</div><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto"><line x1="${pl}" x2="${W-pr}" y1="${zY}" y2="${zY}" stroke="#ddd" stroke-width="1"/><path d="${pathD}" fill="none" stroke="${lc}" stroke-width="2" stroke-linecap="round"/><circle cx="${xS(cums.length-1)}" cy="${yS(last)}" r="3" fill="${lc}"/><text x="${xS(cums.length-1)+6}" y="${yS(last)}" fill="${lc}" font-size="10" font-weight="600" dominant-baseline="middle">${fmtR(last,1)}</text></svg></div>`;
  }

  // Month tables
  let monthsHTML = "";
  months.forEach(m => {
    const recs = grouped[m] || [];
    if (!recs.length) return;
    const mNum = m.split(".")[1];
    const mName = MONTHS_KR[parseInt(mNum)] || m;
    const tF = rd(recs.reduce((s,r)=>s+r.futures,0),4);
    const tS = rd(recs.reduce((s,r)=>s+r.stock,0),4);
    const tD = rd(tF+tS,4);
    const lastRate = recs[recs.length-1].rate;
    const tK = rd(rd(tD,2)*lastRate,2);

    let rows = recs.map(r => {
      const d = rd(r.futures+r.stock,4);
      const k = rd(d*r.rate,2);
      return `<tr>
        <td style="text-align:left">${r.date.slice(5)}</td>
        <td style="color:${col(r.futures)}">${fmtR(r.futures)}</td>
        <td style="color:${col(r.stock)}">${fmtR(r.stock,4)}</td>
        <td style="color:${col(d)};font-weight:600">${fmtR(d,2)}</td>
        <td style="color:${col(k)}">${fmtK(k)}</td>
        <td style="color:${col(r.nasdaq)}">${r.nasdaq!=null?fmtR(r.nasdaq,2)+"%":"—"}</td>
        <td style="color:${col(r.sp500)}">${r.sp500!=null?fmtR(r.sp500,2)+"%":"—"}</td>
        <td style="text-align:left;color:#888">${r.note||""}</td>
      </tr>`;
    }).join("");

    rows += `<tr style="font-weight:700;border-top:2px solid #333;background:#f8f8f8">
      <td style="text-align:left">합계</td>
      <td style="color:${col(tF)}">${fmtR(tF)}</td>
      <td style="color:${col(tS)}">${fmtR(tS,4)}</td>
      <td style="color:${col(tD)}">${fmtR(tD,2)}</td>
      <td style="color:${col(tK)}">${fmtK(tK)}</td>
      <td></td><td></td><td></td>
    </tr>`;

    monthsHTML += `
      <div style="page-break-inside:avoid;margin-top:24px">
        <h3 style="font-size:14px;margin-bottom:8px;color:#333;border-bottom:2px solid #333;padding-bottom:4px">${mName}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:10px">
          <thead><tr style="background:#f0f0f0">
            <th style="text-align:left;padding:5px 6px">날짜</th>
            <th style="padding:5px 6px">선물($)</th>
            <th style="padding:5px 6px">주식($)</th>
            <th style="padding:5px 6px">일일수익</th>
            <th style="padding:5px 6px">원화수익</th>
            <th style="padding:5px 6px">NDX</th>
            <th style="padding:5px 6px">SPX</th>
            <th style="text-align:left;padding:5px 6px">비고</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${buildBarSVG(recs, mName + " 일일 손익")}
        ${buildCumSVG(recs, mName + " 누적 수익")}
      </div>`;
  });

  const winRate = (yearStats.totalWin+yearStats.totalLoss)>0
    ? (yearStats.totalWin/(yearStats.totalWin+yearStats.totalLoss)*100).toFixed(1)+"%"
    : "—";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#222;padding:32px 36px;font-size:11px;line-height:1.5}
  h1{font-size:20px;font-weight:700;margin-bottom:4px}
  h2{font-size:13px;font-weight:600;color:#555;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}
  th,td{padding:5px 6px;text-align:right;border-bottom:1px solid #e0e0e0}
  th{font-size:9px;text-transform:uppercase;color:#888;letter-spacing:0.3px}
  .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
  .summary-card{border:1px solid #ddd;border-radius:8px;padding:12px}
  .summary-card .label{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.3px}
  .summary-card .value{font-size:17px;font-weight:700;margin-top:2px}
  .summary-card .sub{font-size:9px;color:#888;margin-top:1px}
  .tax-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
  .tax-card{border:1px solid #ddd;border-radius:8px;padding:10px;background:#fafafa}
  .tax-card .label{font-size:9px;color:#888;text-transform:uppercase}
  .tax-card .value{font-size:14px;font-weight:700;margin-top:2px}
  svg text{font-family:-apple-system,sans-serif}
</style></head><body>
  <h1>Trading Journal — ${year}년 매매 보고서</h1>
  <h2>생성일: ${new Date().toISOString().slice(0,10)}</h2>

  <div class="summary-grid">
    <div class="summary-card"><div class="label">연간 총 수익</div><div class="value" style="color:${col(yearStats.totalDaily)}">${fmtR(yearStats.totalDaily,2)}</div><div class="sub">USD</div></div>
    <div class="summary-card"><div class="label">원화 환산</div><div class="value" style="color:${col(yearStats.totalKRW)}">${fmtK(yearStats.totalKRW)}</div><div class="sub">KRW</div></div>
    <div class="summary-card"><div class="label">승률</div><div class="value" style="color:#4f46e5">${winRate}</div><div class="sub">${yearStats.totalWin}W / ${yearStats.totalLoss}L</div></div>
    <div class="summary-card"><div class="label">거래일수</div><div class="value">${yearStats.totalWin+yearStats.totalLoss}</div><div class="sub">총 ${months.length}개월</div></div>
  </div>

  <div class="tax-grid">
    <div class="tax-card"><div class="label">선물 예상 세액</div><div class="value" style="color:#dc2626">${fmtK(taxStats.futuresTax)}</div><div class="sub">수익 ${fmtK(taxStats.futuresKRW)} × 11%</div></div>
    <div class="tax-card"><div class="label">주식 예상 세액</div><div class="value" style="color:#dc2626">${fmtK(taxStats.stockTax)}</div><div class="sub">수익 ${fmtK(taxStats.stockKRW)} × 22%</div></div>
    <div class="tax-card"><div class="label">합계 예상 세액</div><div class="value" style="color:#dc2626">${fmtK(taxStats.totalTax)}</div></div>
  </div>

  ${buildBarSVG(yearRecords, "연간 일일 손익 (USD)")}
  ${buildCumSVG(yearRecords, "연간 누적 수익 (USD)")}

  ${monthsHTML}
</body></html>`;
}

// ══════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════
export default function TradingJournal() {
  const [records,setRecords]=useState([]);
  const [loading,setLoading]=useState(true);
  const [activeYear,setActiveYear]=useState(new Date().getFullYear());
  const [activeMonth,setActiveMonth]=useState(null);
  const [modalOpen,setModalOpen]=useState(false);
  const [editIdx,setEditIdx]=useState(null);
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const [view,setView]=useState("table");
  const [pdfExporting,setPdfExporting]=useState(false);

  const isElectron=typeof window!=="undefined"&&!!window.api;

  // ── Load ──
  useEffect(()=>{
    (async()=>{
      try{
        if(isElectron){const l=await window.api.loadTrades();setRecords(l);}
        else setRecords(SEED_DATA);
      }catch{setRecords([]);}
      setLoading(false);
    })();
  },[]);

  const persist=useCallback((next)=>{
    setRecords(next);
    if(isElectron)window.api.saveTrades(next).catch(()=>{});
  },[isElectron]);

  // ── Year / Month grouping ──
  const years=useMemo(()=>{
    const s=new Set(records.map(r=>toYear(r.date)));
    s.add(new Date().getFullYear());
    return[...s].sort();
  },[records]);

  const yearRecords=useMemo(()=>
    records.filter(r=>r.date.startsWith(`${activeYear}-`)).sort((a,b)=>a.date.localeCompare(b.date)),
  [records,activeYear]);

  const grouped=useMemo(()=>{
    const m={};
    yearRecords.forEach(r=>{const k=toMonthKey(r.date);if(!m[k])m[k]=[];m[k].push(r);});
    Object.values(m).forEach(a=>a.sort((a,b)=>a.date.localeCompare(b.date)));
    return m;
  },[yearRecords]);

  const months=useMemo(()=>Object.keys(grouped).sort(),[grouped]);

  useEffect(()=>{
    if(!loading&&months.length) setActiveMonth(months[months.length-1]);
    else if(!loading) setActiveMonth(null);
  },[loading,activeYear,months.length]);

  const monthRecords=grouped[activeMonth]||[];
  const defaultRate=monthRecords.length?monthRecords[monthRecords.length-1].rate:yearRecords.length?yearRecords[yearRecords.length-1].rate:1400;

  // ── Stats ──
  const stats=useMemo(()=>{
    const dp=monthRecords.map(r=>rd(r.futures+r.stock,4));
    const tF=rd(monthRecords.reduce((s,r)=>s+r.futures,0),4);
    const tS=rd(monthRecords.reduce((s,r)=>s+r.stock,0),4);
    const tD=rd(tF+tS,4);
    const lastRate=monthRecords.length?monthRecords[monthRecords.length-1].rate:0;
    // 표시되는 달러(소수점2자리)와 원화가 일치하도록 반올림 후 곱셈
    const tK=rd(rd(tD,2)*lastRate,2);
    const w=dp.filter(d=>d>0).length, l=dp.filter(d=>d<0).length;
    const maxA=Math.max(...dp.map(Math.abs),1);
    let c=0;const cum=monthRecords.map(r=>{c=rd(c+r.futures+r.stock,4);return c;});
    // 복리 월간 등락폭
    let ndxCum=1,spxCum=1;
    monthRecords.forEach(r=>{
      if(r.nasdaq) ndxCum*=(1+r.nasdaq/100);
      if(r.sp500) spxCum*=(1+r.sp500/100);
    });
    const monthNdx=rd((ndxCum-1)*100,2);
    const monthSpx=rd((spxCum-1)*100,2);
    return{totalFutures:tF,totalStock:tS,totalDaily:tD,totalKRW:tK,lastRate,winDays:w,lossDays:l,maxAbs:maxA,cumulative:cum,monthNdx,monthSpx};
  },[monthRecords]);

  const yearStats=useMemo(()=>{
    let tD=0,tF=0,tS=0,tW=0,tL=0;
    yearRecords.forEach(r=>{
      tF=rd(tF+r.futures,4); tS=rd(tS+r.stock,4);
      const d=rd(r.futures+r.stock,4); tD=rd(tD+d,4);
      if(d>0)tW++; if(d<0)tL++;
    });
    const lastRate=yearRecords.length?yearRecords[yearRecords.length-1].rate:0;
    return{totalDaily:tD,totalKRW:rd(rd(tD,2)*lastRate,2),lastRate,totalFutures:tF,totalStock:tS,totalWin:tW,totalLoss:tL};
  },[yearRecords]);

  const taxStats=useMemo(()=>{
    // 매일 원화 수익을 각각 합산 (일일 달러 × 당일 환율), 매 단계 반올림
    let fK=0,sK=0;
    yearRecords.forEach(r=>{
      fK=rd(fK+rd(r.futures*r.rate,2),2);
      sK=rd(sK+rd(r.stock*r.rate,2),2);
    });
    const fT=rd(Math.max(0,fK-2500000)*0.11,2);
    const sT=rd(Math.max(0,sK-2500000)*0.22,2);
    return{futuresKRW:fK,stockKRW:sK,futuresTax:fT,stockTax:sT,totalTax:rd(fT+sT,2)};
  },[yearRecords]);

  // ── Handlers ──
  function handleSave(record){
    const next=[...records];
    if(editIdx!==null){
      const target=monthRecords[editIdx];
      const gi=next.findIndex(r=>r===target);
      if(gi>=0)next[gi]=record;
    }else next.push(record);
    next.sort((a,b)=>a.date.localeCompare(b.date));
    persist(next);
    setModalOpen(false);setEditIdx(null);
    setActiveYear(toYear(record.date));
    setActiveMonth(toMonthKey(record.date));
  }

  function handleDelete(mi){
    const target=monthRecords[mi];
    persist(records.filter(r=>r!==target));
    setDeleteConfirm(null);
  }

  async function handlePDF(){
    if(!isElectron)return;
    setPdfExporting(true);
    try{
      const html=buildReportHTML(activeYear,yearRecords,grouped,months,yearStats,taxStats);
      await window.api.exportPDF(html);
    }catch{}
    setPdfExporting(false);
  }

  async function handleImport(){
    if(!isElectron)return;
    const imported=await window.api.importTsv();
    if(imported===null)return; // cancelled
    setRecords(imported);
    if(imported.length){
      const lastYear=toYear(imported[imported.length-1].date);
      setActiveYear(lastYear);
    }
  }

  const [bulkFetching,setBulkFetching]=useState(false);
  const [bulkProgress,setBulkProgress]=useState("");
  const [monthlyIndex,setMonthlyIndex]=useState({}); // { "2026.3": {nasdaq:-7.32, sp500:-7.41} }

  async function handleBulkFetch(){
    if(!isElectron||!activeMonth)return;
    setBulkFetching(true);
    const next=[...records];
    const targets=monthRecords;
    let done=0;
    for(const rec of targets){
      setBulkProgress(`${++done} / ${targets.length+1}`);
      try{
        const d=await window.api.fetchMarketData(rec.date);
        const gi=next.findIndex(x=>x===rec);
        if(gi>=0){
          const updated={...next[gi]};
          if(d.rate!=null) updated.rate=d.rate;
          if(d.nasdaq!=null) updated.nasdaq=d.nasdaq;
          if(d.sp500!=null) updated.sp500=d.sp500;
          next[gi]=updated;
        }
      }catch{}
      await new Promise(resolve=>setTimeout(resolve,300));
    }
    persist(next);
    // Fetch actual monthly index change via API
    setBulkProgress(`월간 지수...`);
    try{
      const [y,m]=activeMonth.split(".");
      const mi=await window.api.fetchMonthlyIndex(parseInt(y),parseInt(m));
      if(mi){
        setMonthlyIndex(prev=>({...prev,[activeMonth]:mi}));
      }
    }catch{}
    setBulkFetching(false);
    setBulkProgress("");
  }

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0a0e17",color:"#64748b",fontFamily:"'DM Sans',sans-serif"}}>불러오는 중...</div>
  );

  const chartW=700,chartH=240,pad={t:20,r:20,b:30,l:65};

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,300&family=JetBrains+Mono:wght@400;500;600&display=swap');
        :root{--bg:#0a0e17;--surface:#111827;--surface-2:#1e293b;--surface-3:#293548;--border:#2a3444;--text:#e2e8f0;--text-2:#94a3b8;--text-3:#64748b;--green:#22c55e;--green-bg:rgba(34,197,94,0.08);--red:#ef4444;--red-bg:rgba(239,68,68,0.08);--accent:#6366f1;--accent-dim:rgba(99,102,241,0.15);--yellow:#eab308;}
        *{margin:0;padding:0;box-sizing:border-box}
        body,#root{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
        .drag-bar{position:fixed;top:0;left:0;right:0;height:38px;-webkit-app-region:drag;z-index:200}
        .app{max-width:1040px;margin:0 auto;padding:24px 16px 60px;padding-top:44px}
        .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;padding-top:8px;border-bottom:1px solid var(--border)}
        .header-left h1{font-size:20px;font-weight:700;letter-spacing:-0.5px;background:linear-gradient(135deg,#e2e8f0,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .header-left p{font-size:11px;color:var(--text-3);margin-top:1px;font-family:'JetBrains Mono',monospace}
        .header-right{display:flex;gap:8px;align-items:center}

        .year-tabs{display:flex;gap:4px;margin-bottom:12px}
        .ytab{padding:6px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;background:transparent;color:var(--text-3);transition:all 0.2s;font-family:'DM Sans',sans-serif}
        .ytab:hover{background:var(--surface-2);color:var(--text)}
        .ytab.active{background:var(--surface);color:var(--text);border-color:var(--border)}

        .year-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
        .year-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px}
        .year-card .label{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;font-weight:500}
        .year-card .value{font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace;margin-top:3px;letter-spacing:-0.5px}
        .year-card .sub{font-size:10px;color:var(--text-3);margin-top:1px;font-family:'JetBrains Mono',monospace}

        .tax-bar{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
        .tax-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px}
        .tax-card .label{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;font-weight:500}
        .tax-card .value{font-size:15px;font-weight:700;font-family:'JetBrains Mono',monospace;margin-top:3px;color:var(--red)}
        .tax-card .sub{font-size:10px;color:var(--text-3);margin-top:1px;font-family:'JetBrains Mono',monospace}

        .tabs-row{display:flex;gap:4px;align-items:center;margin-bottom:12px;overflow-x:auto;padding-bottom:4px}
        .tab{padding:7px 16px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid transparent;background:transparent;color:var(--text-3);transition:all 0.2s;white-space:nowrap;font-family:'DM Sans',sans-serif}
        .tab:hover{background:var(--surface-2);color:var(--text)}
        .tab.active{background:var(--accent-dim);color:var(--accent);border-color:rgba(99,102,241,0.3)}

        .month-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--border);border-radius:10px;overflow:hidden;margin-bottom:12px}
        .mstat{background:var(--surface);padding:10px 12px;text-align:center}
        .mstat .label{font-size:9px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px}
        .mstat .val{font-size:14px;font-weight:600;font-family:'JetBrains Mono',monospace;margin-top:2px}

        .view-toggle{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:12px}
        .vtbtn{padding:6px 14px;font-size:11px;font-weight:500;cursor:pointer;border:none;background:transparent;color:var(--text-3);font-family:'DM Sans',sans-serif;transition:all 0.15s}
        .vtbtn.active{background:var(--accent-dim);color:var(--accent)}

        .table-wrap{border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--surface)}
        .table-scroll{overflow-x:auto}
        table{width:100%;border-collapse:collapse;font-size:12px}
        thead th{background:var(--surface-2);padding:8px 8px;text-align:right;font-size:10px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.3px;white-space:nowrap;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:1}
        thead th:first-child{text-align:left}
        tbody td{padding:7px 8px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:11.5px;border-bottom:1px solid var(--border);white-space:nowrap;transition:background 0.15s}
        tbody td:first-child{text-align:left;color:var(--text-2);font-weight:500}
        tbody tr:hover td{background:rgba(99,102,241,0.04)}
        tbody tr:last-child td{border-bottom:none}
        .profit{color:var(--green)} .loss{color:var(--red)} .zero{color:var(--text-3)}
        td.note-cell{font-family:'DM Sans',sans-serif;color:var(--text-3);font-size:11px;max-width:100px;overflow:hidden;text-overflow:ellipsis}
        .row-actions{display:flex;gap:3px;justify-content:flex-end}
        .row-btn{width:24px;height:24px;border-radius:5px;border:none;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;background:var(--surface-2);color:var(--text-3)}
        .row-btn:hover{background:var(--surface-3);color:var(--text)}
        .row-btn.del:hover{background:var(--red-bg);color:var(--red)}
        .total-row td{background:var(--surface-2)!important;font-weight:700;font-size:12px;border-top:2px solid var(--border)}

        .chart-area{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;overflow-x:auto}
        .chart-title{font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:12px}

        .btn-primary{padding:7px 16px;border-radius:8px;border:none;background:var(--accent);color:white;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s}
        .btn-primary:hover{filter:brightness(1.15)}
        .btn-secondary{padding:7px 16px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-2);font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s}
        .btn-secondary:hover{border-color:var(--text-3);color:var(--text)}
        .btn-sm{padding:5px 12px;font-size:11px}
        .btn-pdf{padding:7px 16px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text-2);font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s}
        .btn-pdf:hover{border-color:var(--accent);color:var(--accent)}
        .btn-pdf:disabled{opacity:0.5;cursor:default}
        .btn-fetch{width:100%;margin-top:12px;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text-2);font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s}
        .btn-fetch:hover{border-color:var(--accent);color:var(--accent)}
        .btn-fetch:disabled{opacity:0.5;cursor:default}

        .save-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--text-3);font-family:'JetBrains Mono',monospace;padding:3px 8px;background:var(--surface);border:1px solid var(--border);border-radius:6px}
        .save-badge .dot{width:5px;height:5px;border-radius:50%;background:var(--green)}

        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;animation:fadeIn 0.15s ease}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .modal-content{background:var(--surface);border:1px solid var(--border);border-radius:14px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto;animation:slideUp 0.2s ease}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        .modal-header{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--border)}
        .modal-header h3{font-size:15px;font-weight:600}
        .close-btn{width:28px;height:28px;border-radius:6px;border:none;background:transparent;color:var(--text-3);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center}
        .close-btn:hover{background:var(--surface-2)}

        .form-body{padding:18px}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .form-grid label{display:flex;flex-direction:column;gap:4px}
        .form-grid label.full-width{grid-column:1/-1}
        .form-grid label span{font-size:10px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.3px}
        .form-grid input{padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:12px;font-family:'JetBrains Mono',monospace;outline:none;transition:border-color 0.15s}
        .form-grid input[type="text"]{font-family:'DM Sans',sans-serif}
        .form-grid input:focus{border-color:var(--accent)}
        .form-preview{display:flex;gap:20px;margin-top:14px;padding:12px 14px;background:var(--surface-2);border-radius:8px}
        .preview-item{display:flex;flex-direction:column;gap:1px}
        .preview-item>span:first-child{font-size:9px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.3px}
        .preview-item>span:last-child{font-size:15px;font-weight:600;font-family:'JetBrains Mono',monospace}
        .form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}

        .delete-confirm{display:flex;flex-direction:column;align-items:center;padding:24px 18px;gap:14px;text-align:center}
        .delete-confirm .icon{width:44px;height:44px;border-radius:50%;background:var(--red-bg);display:flex;align-items:center;justify-content:center;font-size:20px}
        .delete-confirm p{color:var(--text-2);font-size:13px}
        .delete-confirm .actions{display:flex;gap:8px}
        .btn-danger{padding:7px 16px;border-radius:8px;border:none;background:var(--red);color:white;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}

        .empty{padding:40px 20px;text-align:center;color:var(--text-3)}
        .empty .icon{font-size:32px;margin-bottom:10px}
        .empty p{font-size:13px;margin-bottom:14px}

        @media(max-width:640px){.year-bar{grid-template-columns:repeat(2,1fr)}.tax-bar{grid-template-columns:1fr}.month-stats{grid-template-columns:repeat(3,1fr)}.header{flex-direction:column;gap:10px;align-items:flex-start}}
      `}</style>

      <div className="drag-bar"/>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <h1>Trading Journal</h1>
            <p>Futures & Equity — {activeYear}</p>
          </div>
          <div className="header-right">
            {isElectron&&<div className="save-badge"><span className="dot"/>TSV</div>}
            {isElectron&&<button className="btn-pdf" onClick={handleImport}>📂 불러오기</button>}
            {isElectron&&<button className="btn-pdf" onClick={handlePDF} disabled={pdfExporting}>{pdfExporting?"생성 중...":"📄 PDF"}</button>}
            <button className="btn-primary" onClick={()=>{setEditIdx(null);setModalOpen(true)}}>+ 기록</button>
          </div>
        </div>

        {/* Year tabs */}
        <div className="year-tabs">
          {years.map(y=>(
            <button key={y} className={`ytab ${y===activeYear?"active":""}`} onClick={()=>setActiveYear(y)}>{y}년</button>
          ))}
        </div>

        {/* Year summary */}
        <div className="year-bar">
          <div className="year-card"><div className="label">연간 총 수익</div><div className={`value ${colorClass(yearStats.totalDaily)}`}>{fmt(yearStats.totalDaily,2)}</div><div className="sub">USD</div></div>
          <div className="year-card"><div className="label">원화 환산</div><div className={`value ${colorClass(yearStats.totalKRW)}`}>{fmtKRW(yearStats.totalKRW)}</div><div className="sub">KRW</div></div>
          <div className="year-card"><div className="label">승률</div><div className="value" style={{color:"var(--accent)"}}>{yearStats.totalWin+yearStats.totalLoss>0?(yearStats.totalWin/(yearStats.totalWin+yearStats.totalLoss)*100).toFixed(1)+"%":"—"}</div><div className="sub">{yearStats.totalWin}W / {yearStats.totalLoss}L</div></div>
          <div className="year-card"><div className="label">거래일수</div><div className="value" style={{color:"var(--text)"}}>{yearStats.totalWin+yearStats.totalLoss}</div><div className="sub">총 {months.length}개월</div></div>
        </div>

        {/* Tax estimation */}
        <div className="tax-bar">
          <div className="tax-card"><div className="label">선물 예상 세액 (11%)</div><div className="value">{fmtKRW(taxStats.futuresTax)}</div><div className="sub">수익 {fmtKRW(taxStats.futuresKRW)}</div></div>
          <div className="tax-card"><div className="label">주식 예상 세액 (22%)</div><div className="value">{fmtKRW(taxStats.stockTax)}</div><div className="sub">수익 {fmtKRW(taxStats.stockKRW)}</div></div>
          <div className="tax-card"><div className="label">합계 예상 세액</div><div className="value">{fmtKRW(taxStats.totalTax)}</div><div className="sub">공제 각 250만원</div></div>
        </div>

        {/* Month tabs */}
        <div className="tabs-row">
          {months.map(m=>{
            const mn=m.split(".")[1];
            return <button key={m} className={`tab ${m===activeMonth?"active":""}`} onClick={()=>setActiveMonth(m)}>{MONTHS_KR[parseInt(mn)]||m}</button>;
          })}
        </div>

        {/* Month stats */}
        {activeMonth&&monthRecords.length>0&&(
          <div className="month-stats">
            <div className="mstat"><div className="label">선물</div><div className={`val ${colorClass(stats.totalFutures)}`}>{fmt(stats.totalFutures)}</div></div>
            <div className="mstat"><div className="label">주식</div><div className={`val ${colorClass(stats.totalStock)}`}>{fmt(stats.totalStock,2)}</div></div>
            <div className="mstat"><div className="label">월간 합계</div><div className={`val ${colorClass(stats.totalDaily)}`}>{fmt(stats.totalDaily,2)}</div></div>
            <div className="mstat"><div className="label">원화</div><div className={`val ${colorClass(stats.totalKRW)}`}>{fmtKRW(stats.totalKRW)}</div></div>
            <div className="mstat"><div className="label">승/패</div><div className="val" style={{color:"var(--text)"}}>{stats.winDays} / {stats.lossDays}</div></div>
          </div>
        )}

        {/* View toggle */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div className="view-toggle">
            <button className={`vtbtn ${view==="table"?"active":""}`} onClick={()=>setView("table")}>테이블</button>
            <button className={`vtbtn ${view==="chart"?"active":""}`} onClick={()=>setView("chart")}>차트</button>
          </div>
          {isElectron&&monthRecords.length>0&&(
            <button className="btn-pdf" onClick={handleBulkFetch} disabled={bulkFetching} style={{fontSize:11}}>
              {bulkFetching?`📡 ${bulkProgress}`:"📡 시세 일괄 입력"}
            </button>
          )}
        </div>

        {/* Table */}
        {view==="table"&&(
          <div className="table-wrap"><div className="table-scroll">
            {monthRecords.length===0?(
              <div className="empty"><div className="icon">📊</div><p>기록이 없습니다</p><button className="btn-primary btn-sm" onClick={()=>{setEditIdx(null);setModalOpen(true)}}>첫 기록 추가</button></div>
            ):(
              <table>
                <thead><tr>
                  <th>날짜</th><th>선물($)</th><th>주식($)</th><th>일일수익</th><th></th><th>원화수익</th><th>NDX</th><th>SPX</th><th>비고</th><th></th>
                </tr></thead>
                <tbody>
                  {monthRecords.map((r,i)=>{
                    const d=rd(r.futures+r.stock,4);const k=rd(d*r.rate,2);
                    return(
                      <tr key={i}>
                        <td>{r.date.slice(5).replace("-","/")}</td>
                        <td className={colorClass(r.futures)}>{fmt(r.futures)}</td>
                        <td className={colorClass(r.stock)}>{fmt(r.stock,4)}</td>
                        <td className={colorClass(d)}>{fmt(d,2)}</td>
                        <td style={{width:50,padding:"7px 3px"}}><MiniBar value={d} max={stats.maxAbs}/></td>
                        <td className={colorClass(k)}>{fmtKRW(k)}</td>
                        <td className={colorClass(r.nasdaq)}>{fmtPct(r.nasdaq)}</td>
                        <td className={colorClass(r.sp500)}>{fmtPct(r.sp500)}</td>
                        <td className="note-cell" style={{textAlign:"left"}}>{r.note||""}</td>
                        <td style={{width:56}}>
                          <div className="row-actions">
                            <button className="row-btn" onClick={()=>{setEditIdx(i);setModalOpen(true)}} title="수정">✎</button>
                            <button className="row-btn del" onClick={()=>setDeleteConfirm(i)} title="삭제">✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(()=>{
                    const mi=monthlyIndex[activeMonth];
                    const ndx=mi?.nasdaq??stats.monthNdx;
                    const spx=mi?.sp500??stats.monthSpx;
                    return(
                      <tr className="total-row">
                        <td>합계</td>
                        <td className={colorClass(stats.totalFutures)}>{fmt(stats.totalFutures)}</td>
                        <td className={colorClass(stats.totalStock)}>{fmt(stats.totalStock,4)}</td>
                        <td className={colorClass(stats.totalDaily)}>{fmt(stats.totalDaily,2)}</td>
                        <td></td>
                        <td className={colorClass(stats.totalKRW)}>{fmtKRW(stats.totalKRW)}</td>
                        <td className={colorClass(ndx)}>{fmtPct(ndx)}</td>
                        <td className={colorClass(spx)}>{fmtPct(spx)}</td>
                        <td></td><td></td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            )}
          </div></div>
        )}

        {/* Charts */}
        {view==="chart"&&monthRecords.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="chart-area">
              <div className="chart-title">일일 손익 (USD)</div>
              <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} style={{width:"100%",height:"auto"}}>
                {(()=>{
                  const n=monthRecords.length;const iW=chartW-pad.l-pad.r;const iH=chartH-pad.t-pad.b;
                  const bW=Math.min(iW/n*0.7,22);const gap=iW/n;const mV=stats.maxAbs;
                  const ticks=niceTicks(mV,4);
                  const tickMax=Math.max(...ticks.map(Math.abs),mV);
                  const yS=v=>pad.t+iH/2-(v/tickMax)*(iH/2);const zY=pad.t+iH/2;
                  return(<g>
                    {ticks.map((t,i)=>(
                      <g key={i}>
                        <line x1={pad.l} x2={chartW-pad.r} y1={yS(t)} y2={yS(t)} stroke="var(--border)" strokeWidth={t===0?1:0.5} strokeDasharray={t===0?"none":"4,4"}/>
                        <text x={pad.l-8} y={yS(t)} fill="var(--text-3)" fontSize={9} textAnchor="end" dominantBaseline="middle" fontFamily="JetBrains Mono">{fmtCompact(t)}</text>
                      </g>
                    ))}
                    {monthRecords.map((r,i)=>{
                      const d=r.futures+r.stock;const x=pad.l+gap*i+gap/2-bW/2;
                      const top=d>=0?yS(d):zY;const h=Math.abs(yS(d)-zY);
                      return(<g key={i}>
                        <rect x={x} y={top} width={bW} height={Math.max(h,1)} rx={2} fill={d>=0?"var(--green)":"var(--red)"} opacity={0.85}><title>{r.date}: ${d.toFixed(2)}</title></rect>
                        {i%Math.ceil(n/12)===0&&<text x={x+bW/2} y={chartH-8} fill="var(--text-3)" fontSize={8} textAnchor="middle" fontFamily="JetBrains Mono">{r.date.slice(8)}</text>}
                      </g>);
                    })}
                  </g>);
                })()}
              </svg>
            </div>

            <div className="chart-area">
              <div className="chart-title">누적 수익 (USD)</div>
              <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} style={{width:"100%",height:"auto"}}>
                {(()=>{
                  const cum=stats.cumulative;const n=cum.length;const iW=chartW-pad.l-pad.r;const iH=chartH-pad.t-pad.b;
                  const cumMin=Math.min(0,...cum);const cumMax=Math.max(0,...cum);
                  const ticks=niceTicksRange(cumMin,cumMax,4);
                  const tMin=Math.min(...ticks);const tMax=Math.max(...ticks);
                  const range=tMax-tMin||1;
                  const yS=v=>pad.t+iH-(v-tMin)/range*iH;
                  const xS=i=>pad.l+(i/(n-1||1))*iW;
                  const zY=yS(0);
                  const pathD=cum.map((v,i)=>`${i===0?"M":"L"}${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(" ");
                  const areaD=pathD+` L${xS(n-1).toFixed(1)},${zY} L${xS(0)},${zY} Z`;
                  const last=cum[cum.length-1];const lc=last>=0?"var(--green)":"var(--red)";
                  return(<g>
                    {ticks.map((t,i)=>(
                      <g key={i}>
                        <line x1={pad.l} x2={chartW-pad.r} y1={yS(t)} y2={yS(t)} stroke="var(--border)" strokeWidth={t===0?1:0.5} strokeDasharray={t===0?"none":"4,4"}/>
                        <text x={pad.l-8} y={yS(t)} fill="var(--text-3)" fontSize={9} textAnchor="end" dominantBaseline="middle" fontFamily="JetBrains Mono">{fmtCompact(t)}</text>
                      </g>
                    ))}
                    <defs><linearGradient id="cG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={last>=0?"var(--green)":"var(--red)"} stopOpacity={0.2}/><stop offset="100%" stopColor={last>=0?"var(--green)":"var(--red)"} stopOpacity={0}/></linearGradient></defs>
                    <path d={areaD} fill="url(#cG)"/><path d={pathD} fill="none" stroke={lc} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx={xS(n-1)} cy={yS(last)} r={4} fill={lc}/>
                    <text x={Math.min(xS(n-1)+8,chartW-pad.r-50)} y={Math.max(yS(last),pad.t+12)} fill={lc} fontSize={10} fontWeight={600} dominantBaseline="middle" fontFamily="JetBrains Mono">{fmtCompact(last)}</text>
                  </g>);
                })()}
              </svg>
            </div>
          </div>
        )}

        {/* Modals */}
        <Modal open={modalOpen} onClose={()=>{setModalOpen(false);setEditIdx(null)}} title={editIdx!==null?"기록 수정":"새 기록 추가"}>
          <RecordForm record={editIdx!==null?monthRecords[editIdx]:null} defaultRate={defaultRate} isElectron={isElectron} onSave={handleSave} onCancel={()=>{setModalOpen(false);setEditIdx(null)}}/>
        </Modal>

        <Modal open={deleteConfirm!==null} onClose={()=>setDeleteConfirm(null)} title="기록 삭제">
          <div className="delete-confirm">
            <div className="icon">⚠️</div>
            <p>이 거래 기록을 삭제하시겠습니까?</p>
            <div className="actions">
              <button className="btn-secondary" onClick={()=>setDeleteConfirm(null)}>취소</button>
              <button className="btn-danger" onClick={()=>handleDelete(deleteConfirm)}>삭제</button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
