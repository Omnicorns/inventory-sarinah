// src/App.js — Sarinah (StokKu) frontend "FULL" (Create React App)
// Memakai SEMUA endpoint stokku-api v3 (+ CorsConfig).
// Ganti seluruh isi src/App.js dengan file ini, lalu `npm start`.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:8042/api";

// Aset brand Sarinah — taruh kedua file ini di folder public/ proyek React:
//   public/sarinah.png        (logo tulisan merah, transparan)
//   public/sarinah-galeri.jpg (foto galeri untuk wallpaper login)
// process.env.PUBLIC_URL memastikan path benar walau app dilayani di sub-path /stokku
const LOGO = `${process.env.PUBLIC_URL}/sarinah.png`;
const HERO_BG = `${process.env.PUBLIC_URL}/sarinah-galeri.jpg`;

async function api(path, { method = "GET", body, token } = {}) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        let msg = `Error ${res.status}`;
        try { msg = (await res.json()).message || msg; } catch {}
        throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
:root{
  --bg:#f3f5f9;--panel:#fff;--ink:#10182b;--muted:#64748b;--faint:#94a3b8;
  --line:#e6eaf1;--line-soft:#eef1f6;
  --navy:#0d1b33;--navy2:#13264a;--blue:#2563eb;--blue2:#3b82f6;--blue-tint:#e8efff;
  --ok:#16a34a;--ok-tint:#e7f6ec;--bad:#dc2626;--bad-tint:#fdecec;
  --warn:#d97706;--warn-tint:#fdf3e3;--purple:#7c3aed;--purple-tint:#f1ebff;
  --sans:'Inter',-apple-system,'Segoe UI',sans-serif;
  --mono:'JetBrains Mono',ui-monospace,Menlo,monospace;
  --sh1:0 1px 2px rgba(16,24,43,.05),0 2px 10px rgba(16,24,43,.04);
  --sh2:0 8px 16px rgba(16,24,43,.08),0 20px 44px rgba(16,24,43,.10);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
  -webkit-font-smoothing:antialiased;line-height:1.5}
.app{display:flex;min-height:100vh;min-width:0}
.side{width:222px;flex-shrink:0;background:linear-gradient(180deg,var(--navy),var(--navy2));
  color:#cbd6ea;display:flex;flex-direction:column;padding:20px 14px;position:sticky;top:0;
  height:100vh;overflow-y:auto;z-index:40;transition:transform .25s ease,box-shadow .25s ease}
.side-close{display:none;margin-left:auto;width:34px;height:34px;border:1px solid rgba(255,255,255,.14);
  border-radius:9px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer;place-items:center;flex-shrink:0}
.side-backdrop{display:none}
.brand{display:flex;align-items:center;gap:11px;padding:4px 10px 20px}
.mark{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;
  background:linear-gradient(140deg,var(--blue),#60a5fa);color:#fff;font-weight:800;font-size:15px;
  box-shadow:0 4px 14px rgba(37,99,235,.45)}
.mark-img{background:#fff;padding:5px;box-shadow:0 4px 14px rgba(0,0,0,.18)}
.mark-img img{width:100%;height:100%;object-fit:contain;display:block}
.brand b{font-size:16.5px;font-weight:700;color:#fff;letter-spacing:-.02em}
.navsec{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#5d6f8f;
  font-weight:700;padding:14px 12px 6px}
.nav{display:flex;flex-direction:column;gap:3px}
.nav button{display:flex;align-items:center;gap:11px;width:100%;padding:9px 12px;border:none;
  border-radius:9px;background:none;cursor:pointer;font-family:var(--sans);font-size:13px;
  color:#9fb0cc;text-align:left;transition:background .18s,color .18s}
.nav button:hover{background:rgba(255,255,255,.06);color:#fff}
.nav button.active{background:var(--blue);color:#fff;font-weight:600;box-shadow:0 4px 14px rgba(37,99,235,.4)}
.nav .n{margin-left:auto;font-family:var(--mono);font-size:10px;font-weight:600;background:#fff;
  color:var(--blue);border-radius:999px;padding:1px 7px}
.side .out{margin-top:auto;display:flex;align-items:center;gap:11px;padding:9px 12px;border:none;
  border-radius:9px;background:none;cursor:pointer;font-family:var(--sans);font-size:13px;
  color:#9fb0cc;text-align:left}
.side .out:hover{background:rgba(220,38,38,.15);color:#fda4a4}
.body{flex:1;min-width:0;display:flex;flex-direction:column}
.top{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:16px;background:var(--panel);
  border-bottom:1px solid var(--line);padding:12px 26px;min-width:0}
.menu-toggle{display:none;width:40px;height:40px;border:1px solid var(--line);border-radius:10px;
  background:var(--panel);color:var(--navy);cursor:pointer;place-items:center;flex:0 0 40px}
.menu-toggle:hover{color:var(--blue);border-color:var(--blue)}
.search{flex:1;max-width:380px;display:flex;align-items:center;gap:9px;background:var(--bg);
  border:1px solid var(--line);border-radius:10px;padding:8px 13px}
.search input{border:none;outline:none;background:none;font-size:13px;width:100%;
  font-family:var(--sans);color:var(--ink)}
.search input::placeholder{color:var(--faint)}
.bell{position:relative;margin-left:auto;width:38px;height:38px;border:1px solid var(--line);
  border-radius:10px;background:var(--panel);cursor:pointer;display:grid;place-items:center;color:var(--muted)}
.bell:hover{color:var(--blue);border-color:var(--blue)}
.bell .dotn{position:absolute;top:-6px;right:-6px;min-width:17px;height:17px;border-radius:999px;
  background:var(--bad);color:#fff;font-size:10px;font-weight:700;display:grid;place-items:center;
  padding:0 4px;border:2px solid var(--panel)}
.who{display:flex;align-items:center;gap:10px}
.ava{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:12px;
  font-weight:700;color:#fff;background:linear-gradient(140deg,var(--blue),#60a5fa)}
.who small{display:block;color:var(--faint);font-size:11px}
.main{padding:26px 28px 60px;max-width:1120px;width:100%;margin:0 auto}
.greet{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-bottom:20px;
  animation:rise .5s cubic-bezier(.2,.8,.2,1) both}
.greet h1{font-size:21px;font-weight:800;margin:0;letter-spacing:-.02em}
.greet p{font-size:12.5px;color:var(--muted);margin:3px 0 0}
.chip{font-size:12px;color:var(--muted);background:var(--panel);border:1px solid var(--line);
  border-radius:9px;padding:7px 12px;white-space:nowrap}
.stagger>*{animation:rise .5s cubic-bezier(.2,.8,.2,1) both}
.stagger>*:nth-child(2){animation-delay:.05s}.stagger>*:nth-child(3){animation-delay:.1s}
.stagger>*:nth-child(4){animation-delay:.15s}
@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 18px;
  box-shadow:var(--sh1);transition:transform .22s,box-shadow .22s;display:flex;justify-content:space-between;gap:10px}
.stat:hover{transform:translateY(-3px);box-shadow:var(--sh2)}
.stat .k{font-size:12px;color:var(--muted);font-weight:600}
.stat .v{font-size:26px;font-weight:800;margin-top:4px;letter-spacing:-.02em}
.stat .t{font-size:11px;margin-top:5px;font-weight:600}
.t.up{color:var(--ok)}.t.down{color:var(--bad)}.t.flat{color:var(--faint)}
.sic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
.sic.b{background:var(--blue-tint);color:var(--blue)}.sic.g{background:var(--ok-tint);color:var(--ok)}
.sic.r{background:var(--bad-tint);color:var(--bad)}.sic.y{background:var(--warn-tint);color:var(--warn)}
.sic.p{background:var(--purple-tint);color:var(--purple)}
.grid{display:grid;grid-template-columns:1fr 320px;gap:14px;margin-bottom:14px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px 20px;
  box-shadow:var(--sh1);margin-bottom:14px}
.ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap}
.ph b{font-size:14px;font-weight:700}
.ph a{font-size:12px;color:var(--blue);text-decoration:none;cursor:pointer}
.legend{display:flex;gap:14px;font-size:11.5px;color:var(--muted)}
.legend i{width:9px;height:9px;border-radius:3px;display:inline-block;margin-right:5px;vertical-align:-1px}
.low{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;
  border-bottom:1px dashed var(--line-soft)}
.low:last-child{border-bottom:none}
.low .nm{font-size:13px;font-weight:600}.low .sku{font-family:var(--mono);font-size:10.5px;color:var(--faint)}
.low .st{font-family:var(--mono);font-size:12px;font-weight:700;color:var(--bad);white-space:nowrap}
.tbl{width:100%;border-collapse:collapse}
.tbl th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);
  font-weight:700;text-align:left;padding:10px 12px;border-bottom:1px solid var(--line)}
.tbl td{font-size:13px;padding:11px 12px;border-bottom:1px solid var(--line-soft)}
.tbl tr:last-child td{border-bottom:none}
.tbl tbody tr:hover{background:#fafbfd}
.table-scroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
.table-scroll .tbl{min-width:680px}
.num{text-align:right;font-family:var(--mono);font-size:12.5px}
.mono{font-family:var(--mono);font-size:11.5px;color:var(--faint)}
.muted{font-size:12.5px;color:var(--muted)}
.badge{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;
  letter-spacing:.03em;padding:4px 11px;border-radius:999px;font-family:var(--mono)}
.badge .dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.b-warn{color:var(--warn);background:var(--warn-tint)}.b-warn .dot{animation:pulse 1.7s ease-in-out infinite}
.b-ok{color:var(--ok);background:var(--ok-tint)}.b-bad{color:var(--bad);background:var(--bad-tint)}
.b-info{color:var(--blue);background:var(--blue-tint)}.b-stok{color:var(--purple);background:var(--purple-tint)}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(217,119,6,.4)}50%{box-shadow:0 0 0 5px rgba(217,119,6,0)}}
.btn{position:relative;overflow:hidden;background:var(--blue);color:#fff;border:none;border-radius:10px;
  padding:10px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);
  box-shadow:0 4px 14px rgba(37,99,235,.3);transition:transform .15s,box-shadow .15s;
  display:inline-flex;align-items:center;gap:7px}
.btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px rgba(37,99,235,.4)}
.btn.gold{background:var(--warn);box-shadow:0 4px 14px rgba(217,119,6,.3)}
.btn.green{background:var(--ok);box-shadow:0 4px 14px rgba(22,163,74,.3)}
.btn.ghost{background:none;border:1px solid var(--line);color:var(--muted);box-shadow:none}
.btn.ghost:hover:not(:disabled){color:var(--bad);border-color:rgba(220,38,38,.4)}
.btn.line{background:none;border:1px solid var(--blue);color:var(--blue);box-shadow:none}
.btn.sm{padding:7px 12px;font-size:12px;border-radius:9px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.cardrow{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:15px 17px;
  margin-bottom:11px;box-shadow:var(--sh1);display:flex;align-items:center;justify-content:space-between;
  gap:14px;transition:transform .22s,box-shadow .22s}
.cardrow:hover{transform:translateY(-2px);box-shadow:var(--sh2)}
.code{font-family:var(--mono);font-size:12.5px;font-weight:600}
.meta{font-size:12.5px;color:var(--muted);margin-top:3px}
.right{display:flex;align-items:center;gap:10px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end}
.lbl{font-size:11.5px;color:var(--muted);display:block;margin:14px 0 6px;font-weight:700;
  text-transform:uppercase;letter-spacing:.06em}
.in{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:13px;
  font-family:var(--sans);background:var(--panel);color:var(--ink);outline:none;
  transition:border-color .2s,box-shadow .2s}
.in:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.15)}
.in.bad{border-color:var(--bad);box-shadow:0 0 0 3px rgba(220,38,38,.12)}
.in::placeholder{color:var(--faint)}
.ckrow{display:flex;gap:10px;align-items:flex-start;margin-top:14px;cursor:pointer;
  background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:11px 13px}
.ckrow input{margin-top:2px;width:16px;height:16px;accent-color:var(--blue);cursor:pointer}
.ckrow b{font-size:13px;display:block}.ckrow small{font-size:11.5px;color:var(--muted);display:block;margin-top:1px}
.linehint{font-size:11.5px;margin:-2px 0 9px;font-family:var(--mono)}
.linehint.over{color:var(--bad)}.linehint.fine{color:var(--faint)}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.seg{display:flex;gap:8px;flex-wrap:wrap}
.seg button{border:1px solid var(--line);background:var(--panel);border-radius:9px;padding:9px 14px;
  font-size:12.5px;cursor:pointer;font-family:var(--sans);color:var(--muted);transition:all .16s}
.seg button:hover{border-color:var(--blue)}
.seg button.on{background:var(--blue-tint);border-color:var(--blue);color:var(--blue);font-weight:600}
.msg{border-radius:10px;padding:10px 13px;font-size:13px;margin:10px 0;animation:rise .3s both}
.msg.err{background:var(--bad-tint);color:var(--bad)}.msg.ok{background:var(--ok-tint);color:var(--ok)}
.skel{height:46px;border-radius:12px;margin:9px 0;
  background:linear-gradient(90deg,var(--line-soft) 25%,#fff 50%,var(--line-soft) 75%);
  background-size:400% 100%;animation:shimmer 1.3s infinite}
@keyframes shimmer{from{background-position:100% 0}to{background-position:0 0}}
.empty{font-size:13px;color:var(--faint);padding:22px;text-align:center;border:1.5px dashed var(--line);
  border-radius:14px;background:var(--panel)}
.hrow{margin-bottom:13px}
.hrow .topr{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}
.hrow .topr span:last-child{font-family:var(--mono);color:var(--muted);font-size:12px}
.hbar{height:9px;background:var(--line-soft);border-radius:999px;overflow:hidden}
.hbar>div{height:9px;border-radius:999px;transform-origin:left;animation:growX .8s cubic-bezier(.2,.8,.2,1) both}
@keyframes growX{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.login-wrap{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:var(--bg)}
.login-hero{position:relative;color:#fff;display:flex;flex-direction:column;justify-content:center;
  padding:60px 64px;overflow:hidden;
  background:linear-gradient(160deg,rgba(13,27,51,.92) 8%,rgba(16,37,77,.88) 55%,rgba(21,48,107,.85)),
    var(--hero-img) center/cover no-repeat,linear-gradient(160deg,var(--navy),#15306b)}
.login-hero .lg{display:flex;align-items:center;gap:11px;position:absolute;top:30px;left:36px}
.login-hero h1{font-size:34px;font-weight:800;letter-spacing:-.03em;margin:0 0 12px;line-height:1.2}
.login-hero p{font-size:14px;color:#b8c7e6;margin:0;max-width:380px;line-height:1.7}
.glow{position:absolute;border-radius:50%;filter:blur(70px);opacity:.35}
.glow.a{width:340px;height:340px;background:#2563eb;bottom:-120px;right:-80px}
.glow.b{width:240px;height:240px;background:#7c3aed;top:-80px;right:30%}
.hero-card{margin-top:36px;width:300px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
  border-radius:14px;padding:16px 18px;backdrop-filter:blur(8px);animation:float 5s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
.hero-card .hr{display:flex;justify-content:space-between;font-size:12px;color:#cdd9f2;padding:8px 0;
  border-bottom:1px dashed rgba(255,255,255,.14)}
.hero-card .hr:last-child{border-bottom:none}
.hero-card b{color:#7cb0ff;font-family:var(--mono);font-size:11px}
.login-side{display:grid;place-items:center;padding:40px 24px}
.login-card{width:380px;max-width:100%;background:var(--panel);border:1px solid var(--line);
  border-radius:18px;padding:34px 32px;box-shadow:var(--sh2);animation:rise .55s cubic-bezier(.2,.8,.2,1) both}
.login-card.shake{animation:shake .4s}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}
  60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
.login-card h2{font-size:21px;font-weight:800;margin:0;letter-spacing:-.02em}
.login-card .sub{font-size:13px;color:var(--muted);margin:5px 0 4px}
.overlay{position:fixed;inset:0;background:rgba(13,27,51,.5);-webkit-backdrop-filter:blur(3px);
  backdrop-filter:blur(3px);display:flex;align-items:flex-start;justify-content:center;z-index:1000;
  padding:5vh 20px;overflow-y:auto;animation:fadeIn .2s both}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{width:440px;max-width:100%;background:#fff;border-radius:16px;margin:0 auto;position:relative;
  box-shadow:0 24px 70px rgba(0,0,0,.4);animation:fadeIn .25s both;padding:24px 26px}
.modal h3{font-size:16px;font-weight:800;margin:0 28px 4px 0}
.modal .x{position:absolute;top:16px;right:16px;width:30px;height:30px;border:1px solid var(--line);
  background:#fff;border-radius:8px;font-size:16px;line-height:1;color:var(--muted);cursor:pointer;
  display:grid;place-items:center}
.modal .x:hover{color:var(--bad);border-color:rgba(220,38,38,.4)}
.slip-paper{width:430px;max-width:100%;background:#fff;border-radius:8px;margin:auto;
  box-shadow:0 24px 70px rgba(0,0,0,.45);animation:rise .35s both}
.slip-top{height:6px;background:var(--navy)}
.slip-pad{padding:26px 28px}
.slip-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding-bottom:16px;
  border-bottom:1px solid var(--line)}
.slip-kind{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);font-weight:700}
.slip-no{font-family:var(--mono);font-size:15px;font-weight:600;margin-top:3px}
.slip-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;padding:16px 0;border-bottom:1px solid var(--line)}
.slip-meta .k{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.slip-meta .v{font-size:13px;margin-top:2px}
.slip-items{width:100%;border-collapse:collapse;margin-top:14px}
.slip-items th{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;text-align:left;
  padding:0 0 7px;border-bottom:1px solid var(--line)}
.slip-items td{font-size:13px;padding:9px 0;border-bottom:1px solid var(--line-soft)}
.slip-items .qn{text-align:right;font-family:var(--mono);font-size:12.5px;white-space:nowrap}
.slip-sign{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:24px}
.slip-sign .r{font-size:10.5px;color:var(--muted)}.slip-sign .l{height:44px;border-bottom:1px solid var(--line)}
.slip-sign .n{font-size:12px;margin-top:6px}
.slip-foot{text-align:center;font-size:10px;color:var(--faint);margin-top:18px;font-family:var(--mono)}
.slip-actions{display:flex;justify-content:flex-end;gap:10px;padding:14px 28px 22px}
@media print{
  @page{size:A4 portrait;margin:12mm}
  html,body{width:100%;height:auto!important;margin:0!important;padding:0!important;
    overflow:visible!important;background:#fff!important}
  body>#root{display:none!important}
  body>.overlay{position:static!important;inset:auto!important;display:block!important;
    width:100%!important;min-height:0!important;margin:0!important;padding:0!important;
    overflow:visible!important;background:transparent!important;
    -webkit-backdrop-filter:none!important;backdrop-filter:none!important}
  .stock-card-paper,.slip-paper{position:static!important;width:100%!important;max-width:none!important;
    max-height:none!important;margin:0!important;padding:0!important;overflow:visible!important;
    border:none!important;border-radius:0!important;box-shadow:none!important;background:#fff!important}
  .stock-card-paper>.x,.stock-card-actions,.slip-actions{display:none!important}
  .stock-card-paper .frow,.stock-card-paper .stats,.stock-card-paper .stat{
    break-inside:avoid;page-break-inside:avoid}
  .stock-card-paper .tbl{width:100%!important;border-collapse:collapse}
  .stock-card-paper .tbl thead{display:table-header-group}
  .stock-card-paper .tbl tr{break-inside:avoid;page-break-inside:avoid}
  .stock-card-paper .stat{border:1px solid #dfe4ec!important;box-shadow:none!important}
  .stock-card-paper input{border:1px solid #dfe4ec!important;background:#fff!important}
  .slip-top,.slip-paper,.slip-paper *,.stock-card-paper,.stock-card-paper *{
    -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}
.toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:60;background:var(--navy);
  color:#fff;font-size:13px;padding:12px 20px;border-radius:12px;display:flex;align-items:center;gap:9px;
  box-shadow:0 14px 40px rgba(0,0,0,.35);animation:toastIn .32s both}
.toast .tdot{width:8px;height:8px;border-radius:50%;background:#7cb0ff;box-shadow:0 0 8px #7cb0ff}
@keyframes toastIn{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}
.request-info{flex:1;min-width:0}
.request-description{max-width:850px;margin-top:6px;color:var(--muted);font-size:12.5px;
  line-height:1.5;white-space:normal;overflow-wrap:anywhere}
.request-description strong,.meta strong{color:var(--ink);font-weight:600}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
@media(max-width:980px){.grid{grid-template-columns:1fr}.frow{grid-template-columns:1fr}}
@media(max-width:860px){.login-wrap{grid-template-columns:1fr}.login-hero{display:none}}
@media(max-width:800px){
  .side{display:flex;position:fixed;inset:0 auto 0 0;width:min(286px,86vw);height:100dvh;
    transform:translateX(-105%);box-shadow:none;padding-top:14px}
  .side.open{transform:translateX(0);box-shadow:18px 0 42px rgba(13,27,51,.28)}
  .side-close{display:grid}
  .side-backdrop{display:block;position:fixed;inset:0;z-index:35;border:0;padding:0;
    background:rgba(13,27,51,.48);opacity:0;visibility:hidden;pointer-events:none;
    transition:opacity .25s ease,visibility .25s ease}
  .side-backdrop.open{opacity:1;visibility:visible;pointer-events:auto}
  .menu-toggle{display:grid}
  .main{padding:20px 16px 50px}
  .top{padding:10px 16px;gap:10px}
  .search{max-width:none;min-width:0}
}
@media(max-width:700px){.cardrow{align-items:flex-start;flex-direction:column}
  .cardrow .right{width:100%;justify-content:flex-start}.request-description{max-width:100%}
  .stock-card-paper .stats{grid-template-columns:repeat(2,1fr)!important}}
@media(max-width:560px){
  .top{padding:9px 12px}
  .search{padding:8px 10px}
  .search input{font-size:12px}
  .who>div:not(.ava){display:none}
  .who{gap:0}
  .greet{align-items:flex-start;flex-direction:column}
  .chip{white-space:normal}
  .stats{grid-template-columns:1fr}
  .panel{padding:16px 14px}
  .frow{grid-template-columns:1fr}
}
  /* =========================================================
   PRODUCT TABLE
========================================================= */

.product-table-wrap {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.product-table {
  width: 100%;
  min-width: 1240px;
  table-layout: fixed;
  border-collapse: collapse;
}

.product-table th,
.product-table td {
  vertical-align: middle;
}

.product-table th:nth-child(1),
.product-table td:nth-child(1) {
  width: 8%;
}

.product-table th:nth-child(2),
.product-table td:nth-child(2) {
  width: 12%;
}

.product-table th:nth-child(3),
.product-table td:nth-child(3) {
  width: 9%;
}

.product-table th:nth-child(4),
.product-table td:nth-child(4) {
  width: 10%;
}

.product-table th:nth-child(5),
.product-table td:nth-child(5) {
  width: 7%;
}

.product-table th:nth-child(6),
.product-table td:nth-child(6) {
  width: 7%;
}

.product-table th:nth-child(7),
.product-table td:nth-child(7) {
  width: 10%;
}

.product-table th:nth-child(8),
.product-table td:nth-child(8) {
  width: 18%;
}

.product-table th:nth-child(9),
.product-table td:nth-child(9) {
  width: 19%;
}

.product-row {
  transition: background-color 0.18s ease;
}

.product-row.stock-only-row {
  background: #f8fafc;
}

.product-row.stock-only-row:hover {
  background: #f1f5f9 !important;
}

.product-name-cell {
  min-width: 0;
}

.product-name {
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.product-sku-mobile {
  display: none !important;
}

/* =========================================================
   JENIS PRODUK
========================================================= */

.product-mode {
  min-width: 0;
}

.product-mode-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
}

.product-mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  padding: 5px 10px;

  border-radius: 999px;

  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.03em;

  white-space: nowrap;
}

.product-mode-badge .mode-dot {
  width: 7px;
  height: 7px;

  flex: 0 0 7px;

  border-radius: 50%;
}

.product-mode-badge.requestable {
  color: var(--ok);
  background: var(--ok-tint);

  border: 1px solid rgba(22, 163, 74, 0.18);
}

.product-mode-badge.requestable .mode-dot {
  background: var(--ok);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}

.product-mode-badge.stock-only {
  color: #475569;
  background: #eef2f7;

  border: 1px solid #dce3ec;
}

.product-mode-badge.stock-only .mode-dot {
  background: #64748b;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.12);
}

.product-mode-badge.unknown {
  color: var(--bad);
  background: var(--bad-tint);
  border: 1px solid rgba(220, 38, 38, 0.22);
}

.product-mode-badge.unknown .mode-dot {
  background: var(--bad);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}

.product-mode-hint {
  display: block;

  max-width: 190px;
  margin: 0;

  color: var(--muted);

  font-size: 11px;
  line-height: 1.4;

  white-space: normal;
  overflow-wrap: anywhere;
}

/* =========================================================
   AKSI PRODUK
========================================================= */

.product-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  width: 100%;

  white-space: nowrap;
}

.mode-toggle-btn {
  min-width: 150px;

  justify-content: center;

  box-shadow: none !important;
}

.mode-toggle-btn.to-stock {
  color: #475569;
  background: #ffffff;

  border: 1px solid #dce3ec;
}

.mode-toggle-btn.to-stock:hover:not(:disabled) {
  color: #334155;
  background: #f8fafc;

  border-color: #94a3b8;

  box-shadow: none !important;
  transform: none !important;
}

.mode-toggle-btn.to-request {
  color: #15803d;
  background: var(--ok-tint);

  border: 1px solid rgba(22, 163, 74, 0.3);
}

.mode-toggle-btn.to-request:hover:not(:disabled) {
  color: #166534;
  background: #dcfce7;

  border-color: var(--ok);

  box-shadow: none !important;
  transform: none !important;
}

.product-card-btn {
  min-width: 105px;
  justify-content: center;
}

@media (max-width: 1100px) {
  .product-table {
    min-width: 1000px;
  }

  .product-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .mode-toggle-btn,
  .product-card-btn {
    width: 100%;
  }
}

@media (max-width: 800px) {
  .product-table {
    min-width: 940px;
  }
}
  
`;

const BADGE = { MENUNGGU: "b-warn", DISETUJUI: "b-ok", DITOLAK: "b-bad", DISERAHKAN: "b-info" };
const Badge = ({ st }) => <span className={`badge ${BADGE[st] || "b-info"}`}><span className="dot" />{st}</span>;
const Skeleton = ({ n = 3 }) => <>{Array.from({ length: n }).map((_, i) => <div className="skel" key={i} />)}</>;
const fmtDate = (iso, t = true) => {
    if (!iso) return "-";
    try { return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", ...(t ? { hour: "2-digit", minute: "2-digit" } : {}) }); }
    catch { return iso; }
};
const rupiah = (n) => "Rp " + (Number(n) || 0).toLocaleString("id-ID");

// Logo Sarinah — gambar di kotak putih membulat; fallback ke huruf "S" bila gambar gagal load
function Mark({ size = 34, radius = 9 }) {
    const [ok, setOk] = useState(true);
    if (!ok) return <div className="mark" style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.44 }}>S</div>;
    return (
        <div className="mark mark-img" style={{ width: size, height: size, borderRadius: radius }}>
            <img src={LOGO} alt="Sarinah" onError={() => setOk(false)} />
        </div>
    );
}

function CountUp({ value, className, style }) {
    const [n, setN] = useState(0); const prev = useRef(0);
    useEffect(() => {
        const from = prev.current, to = Number(value) || 0, t0 = performance.now(), dur = 650; let raf;
        const step = (t) => { const k = Math.min(1, (t - t0) / dur);
            setN(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
            if (k < 1) raf = requestAnimationFrame(step); else prev.current = to; };
        raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
    }, [value]);
    return <div className={`v ${className || ""}`} style={style}>{n}</div>;
}

/* Modal lewat portal ke body -> lepas dari overflow/stacking sidebar, tidak kepotong */
function Modal({ children, onClose, width = 440, className = "" }) {
    useEffect(() => {
        const onEsc = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onEsc);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onEsc); document.body.style.overflow = prev; };
    }, [onClose]);
    return createPortal(
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`modal ${className}`.trim()} style={{ width }}>
                <button className="x" onClick={onClose} aria-label="Tutup">{"\u00d7"}</button>
                {children}
            </div>
        </div>,
        document.body
    );
}

const I = {
    menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
    close: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
    dash: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg>,
    check: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12l5 5 11-11"/></svg>,
    box: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/></svg>,
    form: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M12 17v-6"/></svg>,
    inbox: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.5L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.5-6.5A2 2 0 0017 4H7a2 2 0 00-1.5.5z"/></svg>,
    adjust: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>,
    report: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
    users: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>,
    bell: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></svg>,
    doc: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l4 4v16H6z"/><path d="M15 2v5h4M9 13h6M9 17h6"/></svg>,
    out: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
    up: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
    down: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>,
    alert: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>,
    plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>,
    cash: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>,
};

function FlowChart({ movements }) {
    const data = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            days.push({ key: d.toISOString().slice(0, 10),
                label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }), in: 0, out: 0 });
        }
        (movements || []).forEach((m) => {
            const day = days.find((d) => d.key === (m.createdAt || "").slice(0, 10));
            if (!day) return;
            if (m.quantity > 0) day.in += m.quantity; else day.out += Math.abs(m.quantity);
        });
        return days;
    }, [movements]);
    const W = 620, H = 170, P = 28;
    const max = Math.max(4, ...data.map((d) => Math.max(d.in, d.out)));
    const x = (i) => P + (i * (W - 2 * P)) / (data.length - 1);
    const y = (v) => H - P - (v / max) * (H - 2 * P);
    const path = (k) => data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[k])}`).join(" ");
    const area = `${path("in")} L${x(data.length - 1)},${H - P} L${x(0)},${H - P} Z`;
    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
                <defs><linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity=".22" /><stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                </linearGradient></defs>
                {[0.25, 0.5, 0.75, 1].map((k) => <line key={k} x1={P} x2={W - P} y1={y(max * k)} y2={y(max * k)} stroke="#eef1f6" strokeWidth="1" />)}
                <path d={area} fill="url(#gIn)" />
                <path d={path("in")} fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" />
                <path d={path("out")} fill="none" stroke="#dc2626" strokeWidth="2.4" strokeLinecap="round" />
                {data.map((d, i) => (<g key={d.key}>
                    <circle cx={x(i)} cy={y(d.in)} r="3.4" fill="#fff" stroke="#16a34a" strokeWidth="2" />
                    <circle cx={x(i)} cy={y(d.out)} r="3.4" fill="#fff" stroke="#dc2626" strokeWidth="2" />
                    <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#94a3b8" fontFamily="JetBrains Mono, monospace">{d.label}</text>
                </g>))}
            </svg>
            {data.every((d) => !d.in && !d.out) && <p className="muted" style={{ textAlign: "center", marginTop: 4 }}>Belum ada pergerakan stok 7 hari terakhir.</p>}
        </div>
    );
}

function Login({ onLogin }) {
    const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
    const [show, setShow] = useState(false); const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false); const [shake, setShake] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        if (!email || !password) { setErr("Isi email dan password dulu."); return; }
        setErr(""); setLoading(true);
        try { const d = await api("/auth/login", { method: "POST", body: { email, password } }); onLogin(d.token, d.user); }
        catch (ex) { setErr(ex.message === "Error 401" ? "Email atau password salah." : ex.message); setShake(true); setTimeout(() => setShake(false), 450); }
        finally { setLoading(false); }
    };
    return (
        <div className="login-wrap">
            <div className="login-hero" style={{ "--hero-img": `url(${HERO_BG})` }}>
                <div className="glow a" /><div className="glow b" />
                <div className="lg"><Mark size={32} /><b style={{ fontSize: 17 }}>Sarinah</b></div>
                <h1>Kelola Inventory<br />Lebih Mudah</h1>
                <p>Pantau stok, proses permintaan antar-divisi, catat barang masuk & penyesuaian, dan terbitkan bukti pengeluaran — semua tercatat real-time.</p>

            </div>
            <div className="login-side">
                <form className={`login-card ${shake ? "shake" : ""}`} onSubmit={submit}>
                    <h2>Selamat datang 👋</h2><p className="sub">Masuk untuk melanjutkan ke portal Sarinah.</p>
                    {err && <div className="msg err">{err}</div>}
                    <label className="lbl">Email</label>
                    <input className="in" type="email" autoComplete="username" autoFocus placeholder="nama@perusahaan.co.id" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <label className="lbl">Password</label>
                    <div style={{ position: "relative" }}>
                        <input className="in" type={show ? "text" : "password"} autoComplete="current-password" placeholder="********" style={{ paddingRight: 64 }} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 8, top: 6, border: "none", background: "none", color: "var(--blue)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: "6px 8px", fontFamily: "var(--sans)" }}>{show ? "Sembunyikan" : "Lihat"}</button>
                    </div>
                    <button className="btn" style={{ width: "100%", marginTop: 22, justifyContent: "center" }} disabled={loading}>{loading ? "Memeriksa..." : "Masuk"}</button>
                </form>
            </div>
        </div>
    );
}

function SlipModal({ slip, onClose }) {
    const totalQty = slip.items.reduce((s, i) => s + i.quantity, 0);
    useEffect(() => {
        const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);
    return createPortal(
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="slip-paper">
                <div className="slip-top" />
                <div className="slip-pad">
                    <div className="slip-head">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Mark size={30} radius={8} />
                            <div><div style={{ fontWeight: 800, fontSize: 15 }}>Sarinah</div><div style={{ fontSize: 10.5, color: "var(--muted)" }}>Thamrin</div></div>
                        </div>
                        <div style={{ textAlign: "right" }}><div className="slip-kind">Bukti Pengeluaran Barang</div><div className="slip-no">{slip.code}</div></div>
                    </div>
                    <div className="slip-meta">
                        <div><div className="k">No. Permintaan</div><div className="v" style={{ fontFamily: "var(--mono)" }}>{slip.requestCode}</div></div>
                        <div><div className="k">Tanggal keluar</div><div className="v">{fmtDate(slip.issuedAt)}</div></div>
                        <div><div className="k">Diserahkan oleh</div><div className="v">{slip.issuedBy || "-"}</div></div>
                        <div><div className="k">Penerima</div><div className="v">{slip.receivedBy || "-"}</div></div>
                    </div>
                    <table className="slip-items">
                        <thead><tr><th>Barang</th><th className="qn">Jumlah</th><th className="qn">Satuan</th></tr></thead>
                        <tbody>
                        {slip.items.map((i, idx) => (<tr key={idx}><td>{i.name}<div className="mono">{i.sku}</div></td><td className="qn">{i.quantity}</td><td className="qn">{i.unit}</td></tr>))}
                        <tr><td style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--muted)" }}>Total item</td><td className="qn" style={{ fontWeight: 700 }}>{totalQty}</td><td className="qn">unit</td></tr>
                        </tbody>
                    </table>
                    <div className="slip-sign">
                        <div><div className="r">Petugas Gudang</div><div className="l" /><div className="n">( {slip.issuedBy || "___________"} )</div></div>
                        <div><div className="r">Penerima</div><div className="l" /><div className="n">( {slip.receivedBy || "___________"} )</div></div>
                    </div>
                    <div className="slip-foot">Dicetak otomatis oleh Sarinah · {slip.code}</div>
                </div>
                <div className="slip-actions"><button className="btn ghost sm" onClick={onClose}>Tutup</button><button className="btn sm" onClick={() => window.print()}>Cetak / PDF</button></div>
            </div>
        </div>,
        document.body
    );
}

function Requests({ token, isAdmin, refreshKey, onChanged, toast, pendingOnly, openSlip }) {
    const [items, setItems] = useState(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(null);
    const load = useCallback(() => { api("/requests", { token }).then(setItems).catch((e) => { setErr(e.message); setItems([]); }); }, [token]);
    useEffect(() => { load(); }, [load, refreshKey]);
    const act = async (r, action, label) => {
        setErr(""); setBusy(r.id + action);
        try { const result = await api(`/requests/${r.id}/${action}`, { method: "POST", token }); toast(`${r.code} ${label}`);
            if (action === "deliver" && result?.code) openSlip(result); load(); onChanged?.(); }
        catch (e) { setErr(e.message); } finally { setBusy(null); }
    };
    const showSlip = async (r) => { try { openSlip(await api(`/requests/${r.id}/slip`, { token })); } catch (e) { setErr(e.message); } };
    const shown = items === null ? null : pendingOnly ? items.filter((r) => ["MENUNGGU", "DISETUJUI"].includes(r.status)) : items;
    return (
        <div>
            {err && <div className="msg err">{err}</div>}
            {shown === null ? <Skeleton n={3} /> : shown.length === 0 ? (
                <div className="empty">{pendingOnly ? "Semua permintaan sudah diputuskan" : "Belum ada permintaan."}</div>
            ) : shown.map((r) => (
                <div className="cardrow" key={r.id}>
                    <div className="request-info">
                        <div><span className="code">{r.code}</span> <span className="muted">· {r.requesterName} · {r.division || "Pusat"}</span></div>
                        <div className="meta"><strong>Barang:</strong> {r.items.map((i) => `${i.requestedQty}x ${i.productName}`).join(", ")}</div>
                        <div className="request-description"><strong>Deskripsi:</strong> {r.purpose?.trim() || "Tidak ada deskripsi"}</div>
                    </div>
                    <div className="right">
                        <Badge st={r.status} />
                        {r.status === "DISERAHKAN" && <button className="btn line sm" onClick={() => showSlip(r)}>{I.doc} Struk</button>}
                        {isAdmin && r.status === "MENUNGGU" && (<>
                            <button className="btn ghost sm" disabled={busy === r.id + "reject"} onClick={() => act(r, "reject", "ditolak")}>Tolak</button>
                            <button className="btn sm" disabled={busy === r.id + "approve"} onClick={() => act(r, "approve", "disetujui - stok dialokasikan")}>Setujui</button>
                        </>)}
                        {isAdmin && r.status === "DISETUJUI" && <button className="btn gold sm" disabled={busy === r.id + "deliver"} onClick={() => act(r, "deliver", "diserahkan - struk terbit")}>Serahkan</button>}
                    </div>
                </div>
            ))}
        </div>
    );
}

function NewRequest({ token, onCreated, toast }) {
    const [products, setProducts] = useState([]); const [lines, setLines] = useState([]);
    const [purpose, setPurpose] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
    // Halaman user hanya boleh menerima produk requestable=true.
    useEffect(() => {
        api("/products/requestable", { token })
            .then((p) => {
                setProducts(p);
                const f = p.find((x) => x.available > 0);
                setLines([{ productId: f?.id ?? "", qty: 1 }]);
            })
            .catch(() => {
                setProducts([]);
                setLines([{ productId: "", qty: 1 }]);
            });
    }, [token]);
    const byId = (id) => products.find((p) => p.id === Number(id));
    const setLine = (i, f, v) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [f]: v } : l)));
    const totals = lines.reduce((m, l) => { if (l.productId) m[l.productId] = (m[l.productId] || 0) + (Number(l.qty) || 0); return m; }, {});
    const lineState = lines.map((l) => {
        const p = byId(l.productId); if (!p) return { invalid: true, note: "Pilih produk" };
        const q = Number(l.qty) || 0; if (q < 1) return { invalid: true, note: "Jumlah minimal 1" };
        const total = totals[l.productId];
        if (total > p.available) return { invalid: true, note: `Melebihi stok - total ${total}, tersedia ${p.available}` };
        return { invalid: false, note: `Tersedia ${p.available} · sisa setelah ini ${p.available - total}` };
    });
    const hasInvalid = lines.length === 0 || lineState.some((s) => s.invalid);
    const submit = async () => {
        setErr(""); setBusy(true);
        try { const body = { purpose, items: lines.map((l) => ({ productId: Number(l.productId), qty: Number(l.qty) })) };
            const r = await api("/requests", { method: "POST", body, token }); toast(`${r.code} terkirim - menunggu persetujuan`);
            const f = products.find((x) => x.available > 0); setPurpose(""); setLines([{ productId: f?.id ?? "", qty: 1 }]); onCreated?.(); }
        catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    return (
        <div className="panel">
            <div className="ph"><b>Ajukan permintaan</b></div>
            {err && <div className="msg err">{err}</div>}
            <label className="lbl" style={{ marginTop: 0 }}>Daftar barang</label>
            {lines.map((l, i) => (
                <div key={i}>
                    <div style={{ display: "flex", gap: 9, marginBottom: 6 }}>
                        <select className={`in ${lineState[i].invalid ? "bad" : ""}`} style={{ flex: 1 }} value={l.productId} onChange={(e) => setLine(i, "productId", e.target.value)}>
                            <option value="">-- pilih produk --</option>
                            {products.map((p) => (<option key={p.id} value={p.id} disabled={p.available <= 0}>{p.name}{p.available <= 0 ? " - habis" : ` - tersedia ${p.available}`}</option>))}
                        </select>
                        <input className={`in ${lineState[i].invalid ? "bad" : ""}`} style={{ width: 86 }} type="number" min="1" max={byId(l.productId)?.available || undefined} value={l.qty} onChange={(e) => setLine(i, "qty", e.target.value)} />
                        {lines.length > 1 && <button className="btn ghost sm" style={{ width: 38, padding: 0, justifyContent: "center" }} onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}>x</button>}
                    </div>
                    <div className={`linehint ${lineState[i].invalid ? "over" : "fine"}`}>{lineState[i].note}</div>
                </div>
            ))}
            <button className="btn line sm" style={{ borderStyle: "dashed" }} onClick={() => { const f = products.find((x) => x.available > 0); setLines((ls) => [...ls, { productId: f?.id ?? "", qty: 1 }]); }}>+ Tambah barang</button>
            <label className="lbl">Keperluan</label>
            <input className="in" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Contoh: penggantian perangkat tim" />
            <button className="btn" style={{ marginTop: 18 }} onClick={submit} disabled={busy || hasInvalid}>{busy ? "Mengirim..." : "Kirim permintaan"}</button>
            <p className="muted" style={{ marginTop: 10, fontSize: 11.5 }}>{hasInvalid && lines.length > 0 ? "Perbaiki baris merah dulu - jumlah tidak boleh melebihi stok tersedia." : "Stok belum berkurang saat dikirim - baru dialokasikan setelah admin menyetujui."}</p>
        </div>
    );
}

function genSku(name, existing = []) {
    // Prefix 3 huruf pertama nama (huruf saja), fallback "SKU", + suffix unik
    const letters = (name || "").toUpperCase().replace(/[^A-Z]/g, "");
    const prefix = (letters.slice(0, 3) || "SKU").padEnd(3, "X");
    const taken = new Set(existing.map((s) => (s || "").toUpperCase()));
    for (let i = 0; i < 9999; i++) {
        const candidate = `${prefix}-${String(Date.now()).slice(-4)}${i ? "-" + i : ""}`;
        if (!taken.has(candidate)) return candidate;
    }
    return `${prefix}-${Date.now()}`;
}

// Normalisasi nilai requestable dari API.
// Mendukung boolean, string, dan angka agar status admin tidak salah terbaca.
function getRequestableValue(product) {
    const value = product?.requestable;

    if (value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true") {
        return true;
    }

    if (value === false || value === 0 || value === "0" || String(value).toLowerCase() === "false") {
        return false;
    }

    // null berarti field requestable tidak dikirim backend.
    return null;
}

function AddProductModal({ token, cats, divs, userDivisionId, existingSkus = [], onClose, onDone }) {
    const mustSelectDivision = !userDivisionId;
    const [f, setF] = useState({ name: "", categoryId: "", divisionId: userDivisionId || "", unit: "unit", price: "", stock: 0, minStock: 0, requestable: true });
    const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
    const sku = useMemo(() => genSku(f.name, existingSkus), [f.name, existingSkus]);
    const save = async () => {
        setErr(""); setBusy(true);
        try {
            await api("/products", { method: "POST", token, body: {
                    sku, name: f.name, categoryId: f.categoryId ? Number(f.categoryId) : null,
                    divisionId: f.divisionId ? Number(f.divisionId) : null,
                    unit: f.unit, price: Number(f.price) || 0, stock: Number(f.stock) || 0,
                    minStock: Number(f.minStock) || 0, requestable: f.requestable } });
            onDone();
        } catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    return (
        <Modal onClose={onClose}>
            <h3>Tambah produk</h3>
            <p className="muted" style={{ marginTop: 0 }}>Master barang baru untuk gudang.</p>
            {err && <div className="msg err">{err}</div>}
            <label className="lbl">Nama produk</label>
            <input className="in" autoFocus value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Contoh: Stapler besar" />
            <div className="frow">
                <div><label className="lbl">SKU (otomatis)</label>
                    <div className="in" style={{ background: "var(--bg)", fontFamily: "var(--mono)", color: f.name ? "var(--ink)" : "var(--faint)" }}>{f.name ? sku : "ketik nama dulu"}</div></div>
                <div><label className="lbl">Satuan</label><input className="in" value={f.unit} onChange={(e) => set("unit", e.target.value)} /></div>
            </div>
            <label className="lbl">Kategori</label>
            <select className="in" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">-- tanpa kategori --</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="lbl">Divisi pemilik stok</label>
            {mustSelectDivision ? (
                <select className={`in ${!f.divisionId ? "bad" : ""}`} value={f.divisionId} onChange={(e) => set("divisionId", e.target.value)}>
                    <option value="">-- pilih divisi --</option>
                    {divs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            ) : (
                <div className="in" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                    {divs.find((d) => d.id === Number(userDivisionId))?.name || "Divisi akun aktif"}
                </div>
            )}
            <label className="lbl">Harga (Rp)</label>
            <input className="in" type="number" min="0" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="0" />
            <div className="frow"><div><label className="lbl">Stok awal</label><input className="in" type="number" value={f.stock} onChange={(e) => set("stock", e.target.value)} /></div>
                <div><label className="lbl">Stok minimum</label><input className="in" type="number" value={f.minStock} onChange={(e) => set("minStock", e.target.value)} /></div></div>
            <label className="ckrow"><input type="checkbox" checked={f.requestable} onChange={(e) => set("requestable", e.target.checked)} />
                <span><b>Bisa diminta pemohon</b><small>Matikan untuk barang yang hanya dicatat di stok (aset / cadangan).</small></span></label>
            <button className="btn" style={{ marginTop: 18, width: "100%", justifyContent: "center" }} disabled={busy || !f.name || (mustSelectDivision && !f.divisionId)} onClick={save}>{busy ? "Menyimpan..." : "Simpan produk"}</button>
        </Modal>
    );
}
function ProductsTab({
                         token,
                         isAdmin,
                         q,
                         refreshKey,
                         onChanged,
                         toast,
                         openCard,
                         userDivisionId,
                     }) {
    const [items, setItems] = useState(null);
    const [cats, setCats] = useState([]);
    const [divs, setDivs] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [toggling, setToggling] = useState(null);

    const load = useCallback(() => {
        // Admin melihat seluruh produk; user hanya produk requestable=true.
        const endpoint = isAdmin ? "/products" : "/products/requestable";

        api(endpoint, { token })
            .then(setItems)
            .catch(() => setItems([]));
    }, [token, isAdmin]);

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    useEffect(() => {
        if (!isAdmin) {
            return;
        }

        Promise.all([
            api("/categories", { token }),
            api("/divisions", { token }),
        ]).then(([categoryRows, divisionRows]) => {
            setCats(categoryRows);
            setDivs(divisionRows);
        }).catch(() => {});
    }, [token, isAdmin]);

    const keyword = (q || "").trim().toLowerCase();

    const filteredProducts = (items || []).filter((product) => {
        const name = String(product.name || "").toLowerCase();
        const sku = String(product.sku || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();
        const division = String(product.division || "").toLowerCase();

        return (
            name.includes(keyword) ||
            sku.includes(keyword) ||
            category.includes(keyword) ||
            division.includes(keyword)
        );
    });

    const toggleRequestable = async (product) => {
        const currentlyRequestable =
            getRequestableValue(product) === true;

        const newRequestable =
            !currentlyRequestable;

        setToggling(product.id);

        try {
            await api(`/products/${product.id}`, {
                method: "PATCH",
                token,
                body: {
                    requestable: newRequestable,
                },
            });

            toast(
                newRequestable
                    ? `${product.name} sekarang bisa diminta oleh pemohon`
                    : `${product.name} sekarang menjadi produk stok saja`
            );

            load();
            onChanged?.();
        } catch (error) {
            toast(
                error?.message ||
                "Gagal mengubah jenis produk"
            );
        } finally {
            setToggling(null);
        }
    };

    return (
        <div className="panel">
            <div className="ph">
                <b>
                    {isAdmin
                        ? "Produk & ketersediaan"
                        : "Cek stok"}
                </b>

                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
          <span className="muted">
            {filteredProducts.length} barang
          </span>

                    {isAdmin && (
                        <button
                            className="btn sm"
                            onClick={() => setShowAdd(true)}
                        >
                            {I.plus}
                            Tambah produk
                        </button>
                    )}
                </div>
            </div>

            {items === null ? (
                <Skeleton n={5} />
            ) : (
                <div className="product-table-wrap">
                    <table className="tbl product-table">
                        <thead>
                        <tr>
                            <th>SKU</th>

                            <th>Nama</th>

                            <th>Kategori</th>

                            <th>Divisi</th>

                            <th className="num">
                                Fisik
                            </th>

                            <th className="num">
                                Tersedia
                            </th>

                            <th>Status Stok</th>

                            <th>Jenis Produk</th>

                            {isAdmin && (
                                <th
                                    style={{
                                        textAlign: "right",
                                    }}
                                >
                                    Aksi
                                </th>
                            )}
                        </tr>
                        </thead>

                        <tbody>
                        {filteredProducts.map(
                            (product) => {
                                const requestable =
                                    getRequestableValue(product);

                                const stockStatusClass =
                                    product.status === "HABIS"
                                        ? "b-bad"
                                        : product.status ===
                                        "MENIPIS"
                                            ? "b-warn"
                                            : "b-ok";

                                return (
                                    <tr
                                        key={product.id}
                                        className={`product-row ${
                                            requestable === true
                                                ? ""
                                                : "stock-only-row"
                                        }`}
                                    >
                                        <td className="mono">
                                            {product.sku}
                                        </td>

                                        <td className="product-name-cell">
                                            <div className="product-name">
                                                {product.name}
                                            </div>
                                        </td>

                                        <td className="muted">
                                            {product.category || "-"}
                                        </td>

                                        <td className="muted">
                                            {product.division || "-"}
                                        </td>

                                        <td className="num">
                                            {product.stock ?? 0}
                                        </td>

                                        <td className="num">
                                            {product.available ?? 0}
                                        </td>

                                        <td>
                        <span
                            className={`badge ${stockStatusClass}`}
                        >
                          <span className="dot" />

                            {product.status ||
                                "AMAN"}
                        </span>
                                        </td>

                                        <td className="product-mode">
                                            <div className="product-mode-content">
                          <span
                              className={`product-mode-badge ${
                                  requestable === true
                                      ? "requestable"
                                      : requestable === false
                                          ? "stock-only"
                                          : "unknown"
                              }`}
                          >
                            <span className="mode-dot" />

                              {requestable === true
                                  ? "TRUE · BISA DIMINTA"
                                  : requestable === false
                                      ? "FALSE · STOK SAJA"
                                      : "FIELD TIDAK ADA"}
                          </span>

                                                <span className="product-mode-hint">
                            {requestable === true
                                ? "Tampil pada form permintaan user"
                                : requestable === false
                                    ? "Hanya tampil pada halaman admin"
                                    : "Backend belum mengirim field requestable"}
                          </span>
                                            </div>
                                        </td>

                                        {isAdmin && (
                                            <td>
                                                <div className="product-actions">
                                                    <button
                                                        className={`btn sm mode-toggle-btn ${
                                                            requestable
                                                                ? "to-stock"
                                                                : "to-request"
                                                        }`}
                                                        disabled={
                                                            toggling ===
                                                            product.id
                                                        }
                                                        onClick={() =>
                                                            toggleRequestable(
                                                                product
                                                            )
                                                        }
                                                    >
                                                        {toggling ===
                                                        product.id
                                                            ? "Mengubah..."
                                                            : requestable === true
                                                                ? "Nonaktifkan permintaan"
                                                                : "Aktifkan permintaan"}
                                                    </button>

                                                    <button
                                                        className="btn line sm product-card-btn"
                                                        onClick={() =>
                                                            openCard(product)
                                                        }
                                                    >
                                                        Kartu stok
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            }
                        )}

                        {filteredProducts.length ===
                            0 && (
                                <tr>
                                    <td
                                        colSpan={
                                            isAdmin ? 9 : 8
                                        }
                                        style={{
                                            padding: 28,
                                            textAlign: "center",
                                            color:
                                                "var(--faint)",
                                        }}
                                    >
                                        Tidak ada produk yang
                                        ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showAdd && (
                <AddProductModal
                    token={token}
                    cats={cats}
                    divs={divs}
                    userDivisionId={userDivisionId}
                    existingSkus={(items || []).map(
                        (product) => product.sku
                    )}
                    onClose={() =>
                        setShowAdd(false)
                    }
                    onDone={() => {
                        setShowAdd(false);
                        load();
                        onChanged?.();

                        toast(
                            "Produk baru ditambahkan"
                        );
                    }}
                />
            )}
        </div>
    );
}

function IncomingTab({ token, refreshKey, onChanged, toast }) {
    const [products, setProducts] = useState([]); const [pid, setPid] = useState(""); const [qty, setQty] = useState(10);
    const [note, setNote] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
    useEffect(() => { api("/products", { token }).then((p) => { setProducts(p); setPid(p[0]?.id ?? ""); }).catch(() => {}); }, [token, refreshKey]);
    const cur = products.find((p) => p.id === Number(pid));
    const save = async () => {
        setErr(""); setBusy(true);
        try { await api("/stock/incoming", { method: "POST", token, body: { productId: Number(pid), quantity: Number(qty), note } });
            toast(`Barang masuk dicatat: +${qty} ${cur?.name || ""}`); setQty(10); setNote(""); onChanged?.(); }
        catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    return (
        <div className="panel" style={{ maxWidth: 560 }}>
            <div className="ph"><b>Barang masuk dari supplier</b></div>
            {err && <div className="msg err">{err}</div>}
            <label className="lbl" style={{ marginTop: 0 }}>Produk</label>
            <select className="in" value={pid} onChange={(e) => setPid(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - stok kini {p.stock}</option>)}</select>
            <div className="frow"><div><label className="lbl">Jumlah masuk</label><input className="in" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
                <div><label className="lbl">Stok setelah</label><div className="in" style={{ background: "var(--bg)", fontFamily: "var(--mono)", fontWeight: 700 }}>{(cur?.stock || 0) + (Number(qty) || 0)}</div></div></div>
            <label className="lbl">Catatan (no. PO / supplier)</label><input className="in" value={note} onChange={(e) => setNote(e.target.value)} placeholder="opsional" />
            <button className="btn green" style={{ marginTop: 18 }} disabled={busy || !pid || Number(qty) < 1} onClick={save}>{busy ? "Menyimpan..." : "Catat barang masuk"}</button>
            <p className="muted" style={{ marginTop: 10, fontSize: 11.5 }}>Tercatat sebagai pergerakan MASUK di kartu stok dan menaikkan stok fisik.</p>
        </div>
    );
}

function AdjustTab({ token, refreshKey, onChanged, toast }) {
    const [products, setProducts] = useState([]); const [pid, setPid] = useState(""); const [type, setType] = useState("TAMBAH");
    const [qty, setQty] = useState(1); const [reason, setReason] = useState("Stok opname"); const [note, setNote] = useState("");
    const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
    useEffect(() => { api("/products", { token }).then((p) => { setProducts(p); setPid(p[0]?.id ?? ""); }).catch(() => {}); }, [token, refreshKey]);
    const cur = products.find((p) => p.id === Number(pid)); const c = cur?.stock || 0; const q = Number(qty) || 0;
    const result = type === "TAMBAH" ? c + q : type === "KURANGI" ? Math.max(0, c - q) : q;
    const delta = result - c;
    const save = async () => {
        setErr(""); setBusy(true);
        try { await api("/adjustments", { method: "POST", token, body: { productId: Number(pid), type, quantity: q, reason, note } });
            toast(`Penyesuaian ${cur?.sku || ""} tersimpan (${delta >= 0 ? "+" : ""}${delta})`); setNote(""); onChanged?.(); }
        catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    return (
        <div className="panel" style={{ maxWidth: 560 }}>
            <div className="ph"><b>Penyesuaian stok</b></div>
            {err && <div className="msg err">{err}</div>}
            <label className="lbl" style={{ marginTop: 0 }}>Produk</label>
            <select className="in" value={pid} onChange={(e) => setPid(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - stok kini {p.stock}</option>)}</select>
            <label className="lbl">Jenis</label>
            <div className="seg">{["TAMBAH", "KURANGI", "SET"].map((t) => <button key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{t === "TAMBAH" ? "Tambah" : t === "KURANGI" ? "Kurangi" : "Set jumlah"}</button>)}</div>
            <div className="frow"><div><label className="lbl">Jumlah</label><input className="in" type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
                <div><label className="lbl">Hasil</label><div className="in" style={{ background: "var(--bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontFamily: "var(--mono)" }}>{result}</b>
                    <span className="badge" style={{ background: delta > 0 ? "var(--ok-tint)" : delta < 0 ? "var(--bad-tint)" : "var(--line-soft)", color: delta > 0 ? "var(--ok)" : delta < 0 ? "var(--bad)" : "var(--muted)" }}>{delta >= 0 ? "+" : ""}{delta}</span>
                </div></div></div>
            <label className="lbl">Alasan</label>
            <select className="in" value={reason} onChange={(e) => setReason(e.target.value)}><option>Stok opname</option><option>Barang rusak</option><option>Barang hilang</option><option>Koreksi data</option></select>
            <label className="lbl">Catatan</label><input className="in" value={note} onChange={(e) => setNote(e.target.value)} placeholder="opsional" />
            <button className="btn gold" style={{ marginTop: 18 }} disabled={busy || !pid} onClick={save}>{busy ? "Menyimpan..." : "Simpan penyesuaian"}</button>
        </div>
    );
}

function ReportsTab({ token }) {
    const [sum, setSum] = useState(null); const [monthly, setMonthly] = useState([]);
    const [top, setTop] = useState([]); const [divs, setDivs] = useState([]);
    useEffect(() => {
        api("/reports/summary", { token }).then(setSum).catch(() => {});
        api("/reports/outgoing-monthly", { token }).then(setMonthly).catch(() => {});
        api("/reports/top-products", { token }).then(setTop).catch(() => {});
        api("/reports/by-division", { token }).then(setDivs).catch(() => {});
    }, [token]);
    const mMax = Math.max(1, ...monthly.map((m) => m.total));
    const tMax = Math.max(1, ...top.map((t) => t.total));
    return (
        <>
            <div className="stats">
                <div className="stat"><div><div className="k">Nilai stok</div><div className="v" style={{ fontSize: 19 }}>{sum ? rupiah(sum.stockValue) : "..."}</div><div className="t flat">total aset gudang</div></div><div className="sic b">{I.cash}</div></div>
                <div className="stat"><div><div className="k">Total produk</div><CountUp value={sum?.totalProducts || 0} /><div className="t flat">item terdaftar</div></div><div className="sic b">{I.box}</div></div>
                <div className="stat"><div><div className="k">Stok menipis</div><CountUp value={sum?.lowStock || 0} style={{ color: "var(--warn)" }} /><div className="t flat">{sum?.outOfStock || 0} habis</div></div><div className="sic y">{I.alert}</div></div>
                <div className="stat"><div><div className="k">Keluar hari ini</div><CountUp value={sum?.outgoingToday || 0} /><div className="t flat">{sum?.pendingRequests || 0} menunggu approval</div></div><div className="sic r">{I.up}</div></div>
            </div>
            <div className="panel">
                <div className="ph"><b>Barang keluar per bulan</b></div>
                {monthly.length === 0 ? <p className="muted">Belum ada data.</p> : monthly.map((m, i) => (
                    <div className="hrow" key={i}><div className="topr"><span>{m.month}</span><span>{m.total}</span></div>
                        <div className="hbar"><div style={{ width: `${Math.round(m.total / mMax * 100)}%`, background: "linear-gradient(90deg,#2563eb,#60a5fa)", animationDelay: `${i * 50}ms` }} /></div></div>
                ))}
            </div>
            <div className="grid">
                <div className="panel">
                    <div className="ph"><b>Produk paling sering diminta</b></div>
                    {top.length === 0 ? <p className="muted">Belum ada data.</p> : top.map((t, i) => (
                        <div className="hrow" key={i}><div className="topr"><span>{t.name} <span className="mono">{t.sku}</span></span><span>{t.total}</span></div>
                            <div className="hbar"><div style={{ width: `${Math.round(t.total / tMax * 100)}%`, background: "linear-gradient(90deg,#16a34a,#4ade80)", animationDelay: `${i * 50}ms` }} /></div></div>
                    ))}
                </div>
                <div className="panel">
                    <div className="ph"><b>Pemakaian per divisi</b></div>
                    {divs.length === 0 ? <p className="muted">Belum ada data.</p> : divs.map((d, i) => (
                        <div className="hrow" key={i}><div className="topr"><span>{d.division}</span><span>{Math.round(d.percent)}% · {d.requests}</span></div>
                            <div className="hbar"><div style={{ width: `${d.percent}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", animationDelay: `${i * 50}ms` }} /></div></div>
                    ))}
                </div>
            </div>
        </>
    );
}

function StockCardModal({ token, product, onClose }) {
    const today = new Date().toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const [from, setFrom] = useState(monthAgo); const [to, setTo] = useState(today);
    const [card, setCard] = useState(null); const [err, setErr] = useState("");
    const load = useCallback(() => {
        setCard(null); setErr("");
        api(`/reports/stock-card?productId=${product.id}&from=${from}&to=${to}`, { token })
            .then(setCard).catch((e) => setErr(e.message));
    }, [token, product.id, from, to]);
    useEffect(() => { load(); }, [load]);
    return (
        <Modal onClose={onClose} width={640} className="stock-card-paper">
            <h3>Kartu stok - {product.name}</h3>
            <p className="muted" style={{ marginTop: 0 }}>{product.sku} · saldo awal + pergerakan</p>
            <div className="frow" style={{ marginBottom: 12 }}>
                <div><label className="lbl" style={{ marginTop: 0 }}>Dari</label><input className="in" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                <div><label className="lbl" style={{ marginTop: 0 }}>Sampai</label><input className="in" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </div>
            {err && <div className="msg err">{err}</div>}
            {!card ? <Skeleton n={4} /> : (
                <>
                    <div className="stats" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 12 }}>
                        <div className="stat" style={{ padding: "10px 12px" }}><div><div className="k">Saldo awal</div><div className="v" style={{ fontSize: 18 }}>{card.openingBalance}</div></div></div>
                        <div className="stat" style={{ padding: "10px 12px" }}><div><div className="k">Masuk</div><div className="v" style={{ fontSize: 18, color: "var(--ok)" }}>{card.totalIn}</div></div></div>
                        <div className="stat" style={{ padding: "10px 12px" }}><div><div className="k">Keluar</div><div className="v" style={{ fontSize: 18, color: "var(--bad)" }}>{card.totalOut}</div></div></div>
                        <div className="stat" style={{ padding: "10px 12px" }}><div><div className="k">Saldo akhir</div><div className="v" style={{ fontSize: 18 }}>{card.closingBalance}</div></div></div>
                    </div>
                    <div className="table-scroll"><table className="tbl">
                        <thead><tr><th>Tanggal</th><th>Jenis</th><th className="num">Masuk</th><th className="num">Keluar</th><th className="num">Saldo</th></tr></thead>
                        <tbody>
                        {card.rows.length === 0 ? <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--faint)" }}>Tidak ada pergerakan pada periode ini</td></tr> :
                            card.rows.map((r, i) => (
                                <tr key={i}><td className="mono" style={{ color: "var(--muted)" }}>{fmtDate(r.date)}</td>
                                    <td className="muted">{r.reason || r.type}</td>
                                    <td className="num" style={{ color: "var(--ok)" }}>{r.in || ""}</td>
                                    <td className="num" style={{ color: "var(--bad)" }}>{r.out || ""}</td>
                                    <td className="num" style={{ fontWeight: 700 }}>{r.balance}</td></tr>
                            ))}
                        </tbody>
                    </table></div>
                </>
            )}
            <div className="stock-card-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button className="btn ghost sm" onClick={onClose}>Tutup</button>
                <button className="btn sm" onClick={() => window.print()}>Cetak</button>
            </div>
        </Modal>
    );
}

function AddUserModal({ token, divs, onClose, onDone }) {
    const [f, setF] = useState({ name: "", email: "", password: "", role: "STAFF", divisionId: "" });
    const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
    const save = async () => {
        setErr(""); setBusy(true);
        try { await api("/users", { method: "POST", token, body: { name: f.name, email: f.email, password: f.password, role: f.role, divisionId: f.divisionId ? Number(f.divisionId) : null } }); onDone(); }
        catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    return (
        <Modal onClose={onClose}>
            <h3>Tambah user</h3>
            <p className="muted" style={{ marginTop: 0 }}>Akun internal - tidak ada self-register.</p>
            {err && <div className="msg err">{err}</div>}
            <label className="lbl">Nama</label><input className="in" value={f.name} onChange={(e) => set("name", e.target.value)} />
            <label className="lbl">Email</label><input className="in" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
            <label className="lbl">Password (min. 8 karakter)</label><input className="in" type="password" value={f.password} onChange={(e) => set("password", e.target.value)} />
            <div className="frow">
                <div><label className="lbl">Peran</label><select className="in" value={f.role} onChange={(e) => set("role", e.target.value)}><option value="STAFF">STAFF (pemohon)</option><option value="ADMIN">ADMIN (gudang)</option></select></div>
                <div><label className="lbl">Divisi</label><select className="in" value={f.divisionId} onChange={(e) => set("divisionId", e.target.value)}><option value="">-- tanpa divisi --</option>{divs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            </div>
            <button className="btn" style={{ marginTop: 18, width: "100%", justifyContent: "center" }} disabled={busy || !f.name || !f.email || f.password.length < 8} onClick={save}>{busy ? "Menyimpan..." : "Simpan user"}</button>
        </Modal>
    );
}

function UsersTab({ token, toast }) {
    const [users, setUsers] = useState(null); const [divs, setDivs] = useState([]); const [show, setShow] = useState(false);
    const load = useCallback(() => { api("/users", { token }).then(setUsers).catch(() => setUsers([])); }, [token]);
    useEffect(() => { load(); api("/divisions", { token }).then(setDivs).catch(() => {}); }, [token]);
    return (
        <div className="panel">
            <div className="ph"><b>Manajemen user</b><button className="btn sm" onClick={() => setShow(true)}>{I.plus} Tambah user</button></div>
            {users === null ? <Skeleton n={4} /> : (
                <div className="table-scroll"><table className="tbl">
                    <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Divisi</th></tr></thead>
                    <tbody>
                    {users.map((u) => (<tr key={u.id}><td style={{ fontWeight: 600 }}>{u.name}</td><td className="muted">{u.email}</td>
                        <td><span className={`badge ${u.role === "ADMIN" ? "b-info" : "b-ok"}`}>{u.role}</span></td>
                        <td className="muted">{u.division?.name || u.divisionName || "Pusat"}</td></tr>))}
                    </tbody>
                </table></div>
            )}
            {show && <AddUserModal token={token} divs={divs} onClose={() => setShow(false)} onDone={() => { setShow(false); load(); toast("User baru ditambahkan"); }} />}
        </div>
    );
}

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem("stokku_token"));
    const [user, setUser] = useState(null); const [tab, setTab] = useState("dash");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); const [toastMsg, setToastMsg] = useState(null);
    const [slip, setSlip] = useState(null); const [cardProduct, setCardProduct] = useState(null);
    const [q, setQ] = useState(""); const [reqs, setReqs] = useState([]); const [prods, setProds] = useState([]); const [moves, setMoves] = useState([]);

    useEffect(() => { if (!token) return; api("/auth/me", { token }).then(setUser).catch(() => { localStorage.removeItem("stokku_token"); setToken(null); }); }, [token]);
    useEffect(() => { if (!token || !user) return;
        api("/requests", { token }).then(setReqs).catch(() => {});
        api("/products", { token }).then(setProds).catch(() => {});
        api("/movements", { token }).then(setMoves).catch(() => {});
    }, [token, user, refreshKey]);
    useEffect(() => {
        if (!sidebarOpen) return undefined;
        const closeOnEscape = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
        const previousOverflow = document.body.style.overflow;
        if (window.matchMedia("(max-width: 800px)").matches) document.body.style.overflow = "hidden";
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("keydown", closeOnEscape);
            document.body.style.overflow = previousOverflow;
        };
    }, [sidebarOpen]);

    const toast = (text) => { setToastMsg(text); clearTimeout(toast._t); toast._t = setTimeout(() => setToastMsg(null), 2400); };
    const login = (t, u) => { localStorage.setItem("stokku_token", t); setToken(t); setUser(u); setTab("dash"); };
    const logout = () => { localStorage.removeItem("stokku_token"); setToken(null); setUser(null); };
    const bump = () => setRefreshKey((k) => k + 1);

    if (!token || !user) return (<><style>{CSS}</style><Login onLogin={login} /></>);

    const isAdmin = user.role === "ADMIN";
    const pending = reqs.filter((r) => r.status === "MENUNGGU").length;
    const approved = reqs.filter((r) => ["DISETUJUI", "DISERAHKAN"].includes(r.status)).length;
    const rejected = reqs.filter((r) => r.status === "DITOLAK").length;
    const low = prods.filter((p) => p.status !== "AMAN");
    const totalIn = moves.filter((m) => m.quantity > 0).reduce((s, m) => s + m.quantity, 0);
    const totalOut = moves.filter((m) => m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0);

    const adminTabs = [
        { sec: "Utama", items: [["dash", "Dashboard", I.dash], ["new", "Ajukan permintaan", I.form], ["appr", "Persetujuan", I.check, pending]] },
        { sec: "Gudang", items: [["prod", "Produk", I.box], ["incoming", "Barang masuk", I.inbox], ["adjust", "Penyesuaian", I.adjust]] },
        { sec: "Laporan & Admin", items: [["reports", "Laporan", I.report], ["users", "User", I.users]] },
    ];
    const staffTabs = [{ sec: "Menu", items: [["dash", "Dashboard", I.dash], ["new", "Ajukan permintaan", I.form], ["prod", "Cek stok", I.box]] }];
    const groups = isAdmin ? adminTabs : staffTabs;

    const titleMap = {
        dash: [`Selamat datang kembali, ${user.name.split(" ")[0]}! 👋`, "Ringkasan inventory hari ini"],
        appr: ["Persetujuan", "Putuskan permintaan masuk"], new: ["Ajukan permintaan", "Stok dialokasikan setelah disetujui"],
        prod: [isAdmin ? "Produk & stok" : "Cek stok", "Ketersediaan barang di gudang"],
        incoming: ["Barang masuk", "Catat penerimaan dari supplier"], adjust: ["Penyesuaian stok", "Opname · rusak · hilang · koreksi"],
        reports: ["Laporan", "Ringkasan & analisis"], users: ["Manajemen user", "Akun & hak akses"],
    };

    return (
        <div>
            <style>{CSS}</style>
            <div className="app">
                <aside className={`side ${sidebarOpen ? "open" : ""}`} aria-label="Navigasi backoffice">
                    <div className="brand"><Mark /><b>Sarinah</b>
                        <button className="side-close" type="button" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)}>{I.close}</button>
                    </div>
                    {groups.map((g) => (
                        <div key={g.sec}>
                            <div className="navsec">{g.sec}</div>
                            <nav className="nav">
                                {g.items.map(([id, label, icon, badge]) => (
                                    <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setSidebarOpen(false); }}>
                                        {icon}{label}{badge > 0 && <span className="n">{badge}</span>}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    ))}
                    <button className="out" onClick={logout}>{I.out}Logout</button>
                </aside>
                <button className={`side-backdrop ${sidebarOpen ? "open" : ""}`} type="button" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} />

                <div className="body">
                    <div className="top">
                        <button className="menu-toggle" type="button" aria-label="Buka menu" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}>{I.menu}</button>
                        <div className="search">{I.search}
                            <input placeholder="Cari barang / SKU..." value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value) setTab("prod"); }} />
                        </div>
                        <button className="bell" title="Permintaan menunggu" onClick={() => { if (isAdmin) setTab("appr"); setSidebarOpen(false); }}>
                            {I.bell}{isAdmin && pending > 0 && <span className="dotn">{pending}</span>}
                        </button>
                        <div className="who">
                            <div className="ava">{user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                            <div><div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                                <small>{isAdmin ? "Admin Gudang" : (user.division?.name || "Pemohon")}</small></div>
                        </div>
                    </div>

                    <main className="main">
                        <div className="greet">
                            <div><h1>{titleMap[tab][0]}</h1><p>{titleMap[tab][1]}</p></div>
                            <span className="chip">📅 {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>

                        <div className="stagger" key={tab + refreshKey}>
                            {tab === "dash" && (<>
                                <div className="stats">
                                    {isAdmin ? (<>
                                        <div className="stat"><div><div className="k">Total Barang</div><CountUp value={prods.length} /><div className="t flat">semua produk</div></div><div className="sic b">{I.box}</div></div>
                                        <div className="stat"><div><div className="k">Stok Masuk</div><CountUp value={totalIn} /><div className="t up">20 transaksi terakhir</div></div><div className="sic g">{I.down}</div></div>
                                        <div className="stat"><div><div className="k">Stok Keluar</div><CountUp value={totalOut} /><div className="t down">20 transaksi terakhir</div></div><div className="sic r">{I.up}</div></div>
                                        <div className="stat"><div><div className="k">Stok Menipis</div><CountUp value={low.length} style={{ color: "var(--warn)" }} /><div className="t flat">perlu perhatian</div></div><div className="sic y">{I.alert}</div></div>
                                    </>) : (<>
                                        <div className="stat"><div><div className="k">Menunggu</div><CountUp value={pending} style={{ color: "var(--warn)" }} /><div className="t flat">perlu persetujuan admin</div></div><div className="sic y">{I.alert}</div></div>
                                        <div className="stat"><div><div className="k">Disetujui</div><CountUp value={approved} style={{ color: "var(--ok)" }} /><div className="t up">siap / sudah diserahkan</div></div><div className="sic g">{I.check}</div></div>
                                        <div className="stat"><div><div className="k">Ditolak</div><CountUp value={rejected} /><div className="t flat">permintaan ditolak</div></div><div className="sic r">{I.alert}</div></div>
                                    </>)}
                                </div>
                                {isAdmin && <div className="grid">
                                    <div className="panel"><div className="ph"><b>Grafik Transaksi (7 Hari Terakhir)</b>
                                        <div className="legend"><span><i style={{ background: "#16a34a" }} />Stok Masuk</span><span><i style={{ background: "#dc2626" }} />Stok Keluar</span></div></div>
                                        <FlowChart movements={moves} /></div>
                                    <div className="panel"><div className="ph"><b>Stok Menipis</b><a onClick={() => setTab("prod")}>Lihat semua</a></div>
                                        {low.length === 0 ? <p className="muted">Semua stok aman 🎉</p> : low.slice(0, 6).map((p) => (
                                            <div className="low" key={p.id}><div><div className="nm">{p.name}</div><div className="sku">{p.sku}</div></div><div className="st">Stok: {p.stock}</div></div>))}</div>
                                </div>}
                                <div className="panel"><div className="ph"><b>{isAdmin ? "Transaksi Terakhir" : "Permintaan saya"}</b></div>
                                    {isAdmin ? (moves.length === 0 ? <p className="muted">Belum ada transaksi.</p> : (
                                        <div className="table-scroll"><table className="tbl"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Barang</th><th className="num">Jumlah</th><th>Keterangan</th><th>Oleh</th></tr></thead>
                                            <tbody>{moves.slice(0, 8).map((m) => (<tr key={m.id}>
                                                <td className="mono" style={{ color: "var(--muted)" }}>{fmtDate(m.createdAt)}</td>
                                                <td><span className={`badge ${m.quantity > 0 ? "b-ok" : "b-bad"}`}>{m.quantity > 0 ? "MASUK" : "KELUAR"}</span></td>
                                                <td>{m.productName}<div className="mono">{m.sku}</div></td>
                                                <td className="num" style={{ fontWeight: 700, color: m.quantity > 0 ? "var(--ok)" : "var(--bad)" }}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                                                <td className="muted">{m.reason || "-"}</td><td className="muted">{m.by || "-"}</td></tr>))}</tbody></table></div>
                                    )) : <Requests token={token} isAdmin={false} refreshKey={refreshKey} onChanged={bump} toast={toast} openSlip={setSlip} />}
                                </div>
                            </>)}

                            {tab === "appr" && isAdmin && <Requests token={token} isAdmin refreshKey={refreshKey} onChanged={bump} toast={toast} openSlip={setSlip} />}
                            {tab === "new" && <NewRequest token={token} toast={toast} onCreated={() => { bump(); setTab("dash"); }} />}
                            {tab === "prod" && <ProductsTab token={token} isAdmin={isAdmin} q={q} refreshKey={refreshKey} onChanged={bump} toast={toast} openCard={setCardProduct} userDivisionId={user.division?.id} />}
                            {tab === "incoming" && isAdmin && <IncomingTab token={token} refreshKey={refreshKey} onChanged={bump} toast={toast} />}
                            {tab === "adjust" && isAdmin && <AdjustTab token={token} refreshKey={refreshKey} onChanged={bump} toast={toast} />}
                            {tab === "reports" && isAdmin && <ReportsTab token={token} />}
                            {tab === "users" && isAdmin && <UsersTab token={token} toast={toast} />}
                        </div>
                    </main>
                </div>
            </div>

            {slip && <SlipModal slip={slip} onClose={() => setSlip(null)} />}
            {cardProduct && <StockCardModal token={token} product={cardProduct} onClose={() => setCardProduct(null)} />}
            {toastMsg && <div className="toast"><span className="tdot" />{toastMsg}</div>}
        </div>
    );
}
