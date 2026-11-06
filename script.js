"use strict";
const $ = id => document.getElementById(id);
const esc = s => { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; };
const KEY = "campuscare_v1";
const ADMIN_PASSWORD = "admin123";   // change before submitting
const STAGES = ["Submitted", "Under Review", "Action Taken", "Resolved"];
const COURSES = ["B.Tech", "BBA", "BCA", "B.Pharm", "D.Pharm", "M.Tech", "MCA", "Architecture"];
const sc = s => "s-" + s.replace(/\s/g, "");
const fmt = ts => new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const courseOf = c => (c.course === "B.Tech" && c.branch ? "B.Tech " + c.branch : c.course) + " \u00b7 Sem " + c.sem;

function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch(e){ return []; } }
function save(a){ try { localStorage.setItem(KEY, JSON.stringify(a)); } catch(e){} }
function toast(t){ const el = $("toast"); if(!el) return; el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2600); }

/* ---------- navbar (all pages) ---------- */
const burger = $("burger"), menu = $("menu");
if(burger){ burger.addEventListener("click", () => { const o = menu.classList.toggle("open"); burger.setAttribute("aria-expanded", o); }); }
const yr = $("year"); if(yr) yr.textContent = new Date().getFullYear();

/* ---------- home: animated live stats ---------- */
if($("st-total")){
  const d = load();
  const vals = { "st-total": d.length, "st-open": d.filter(c => c.stage !== "Resolved").length, "st-done": d.filter(c => c.stage === "Resolved").length, "st-urgent": d.filter(c => c.urgent).length };
  Object.keys(vals).forEach(id => {
    const el = $(id), end = vals[id]; let n = 0;
    const t = setInterval(() => { n += Math.max(1, Math.ceil(end / 20)); if(n >= end){ n = end; clearInterval(t); } el.textContent = n; }, 40);
    if(end === 0) el.textContent = 0;
  });
}

/* ---------- complaint page ---------- */
if($("cform")){
  COURSES.forEach(x => $("course").add(new Option(x)));
  $("course").addEventListener("change", () => { $("branch-wrap").hidden = $("course").value !== "B.Tech"; });
  $("msg").addEventListener("input", e => { $("count").textContent = e.target.value.length + " / 800"; });
  $("date").max = new Date().toISOString().slice(0, 10);

  $("cform").addEventListener("submit", e => {
    e.preventDefault();
    document.querySelectorAll(".err").forEach(x => x.textContent = "");
    const v = k => $(k).value.trim();
    let bad = false;
    const fail = (id, m) => { $("e-" + id).textContent = m; bad = true; };
    if(v("name").length < 2) fail("name", "Naam likho.");
    if(!/^\d{4,10}$/.test(v("roll"))) fail("roll", "Valid roll number likho (digits only).");
    if(!/^[^\s@]+@saitm\.ac\.in$/i.test(v("email"))) fail("email", "College email likho (name@saitm.ac.in).");
    if(v("title").length < 4) fail("title", "Subject thoda detail mein likho.");
    if(v("msg").length < 20) fail("msg", "Kam se kam 20 characters likho.");
    if(bad){ const f = document.querySelector(".err:not(:empty)"); if(f) f.scrollIntoView({ block: "center" }); return; }

    const data = load();
    let id; do { id = "CC-" + Math.floor(100000 + Math.random() * 900000); } while(data.some(c => c.id === id));
    data.push({
      id, name: v("name"), roll: v("roll"), email: v("email"),
      course: $("course").value, sem: $("sem").value, branch: $("course").value === "B.Tech" ? $("branch").value : "",
      cat: $("cat").value, title: v("title"), msg: v("msg"), place: v("place"), when: v("date"),
      urgent: $("urgent").checked, hide: $("anon").checked,
      ts: Date.now(), stage: "Submitted", remark: ""
    });
    save(data);
    $("cform").hidden = true;
    $("newid").textContent = id;
    $("ok").classList.add("show");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------- track page ---------- */
if($("tform")){
  function showTrack(id){
    const c = load().find(x => x.id === id.toUpperCase());
    const box = $("result");
    if(!c){ box.innerHTML = '<div class="card empty">Is ID ki koi complaint nahi mili. ID dobara check karo.</div>'; return; }
    const idx = STAGES.indexOf(c.stage);
    box.innerHTML = `<div class="card">
      <div>${c.urgent ? '<span class="tag urgent">Urgent</span>' : ""}<span class="tag">${esc(c.cat)}</span><span class="tag">${esc(courseOf(c))}</span><span class="tag ${sc(c.stage)}">${esc(c.stage)}</span></div>
      <h3>${esc(c.title)}</h3>
      <p class="meta">ID ${esc(c.id)} &middot; Submitted ${fmt(c.ts)}</p>
      <p>${esc(c.msg)}</p>
      <ol class="timeline">${STAGES.map((s, i) => `<li class="${i <= idx ? "done" : ""} ${i === idx ? "now" : ""}"><span class="dot">${i <= idx ? "\u2713" : ""}</span><strong>${s}</strong></li>`).join("")}</ol>
      ${c.remark ? `<div class="reply"><strong>Admin remark:</strong> ${esc(c.remark)}</div>` : '<p class="meta">Abhi admin ka koi remark nahi hai.</p>'}
    </div>`;
  }
  $("tform").addEventListener("submit", e => { e.preventDefault(); const id = $("tid").value.trim(); if(id) showTrack(id); });
  const q = new URLSearchParams(location.search).get("id"); if(q){ $("tid").value = q; showTrack(q); }
}

/* ---------- admin page ---------- */
if($("alogin")){
  let all = [];
  COURSES.forEach(x => $("f-course").add(new Option(x)));
  const open = () => { $("alogin").hidden = true; $("dash").hidden = false; render(); };
  if(sessionStorage.getItem("cc_admin") === "1") open();

  $("lform").addEventListener("submit", e => {
    e.preventDefault();
    if($("pw").value === ADMIN_PASSWORD){ sessionStorage.setItem("cc_admin", "1"); open(); }
    else $("e-pw").textContent = "Galat password.";
  });
  $("logout").addEventListener("click", () => { sessionStorage.removeItem("cc_admin"); location.reload(); });

  function render(){
    all = load();
    const n = s => all.filter(c => c.stage === s).length;
    $("stats").innerHTML = [["Total", all.length], ["Submitted", n("Submitted")], ["In progress", n("Under Review") + n("Action Taken")], ["Resolved", n("Resolved")]]
      .map(([l, v]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");
    const f = { st: $("f-stage").value, co: $("f-course").value, se: $("f-sem").value, ca: $("f-cat").value, q: $("f-q").value.toLowerCase() };
    const list = all.filter(c => (!f.st || c.stage === f.st) && (!f.co || c.course === f.co) && (!f.se || String(c.sem) === f.se) && (!f.ca || c.cat === f.ca)
      && (!f.q || (c.title + c.msg + c.id + c.name).toLowerCase().includes(f.q)))
      .sort((a, b) => (b.urgent - a.urgent) || (b.ts - a.ts));
    $("rows").innerHTML = list.length ? list.map(c => `<tr>
      <td><strong>${esc(c.id)}</strong><br><span class="meta">${fmt(c.ts)}</span></td>
      <td>${c.urgent ? '<span class="tag urgent">Urgent</span>' : ""}<span class="tag">${esc(c.cat)}</span><br><strong>${esc(c.title)}</strong><br>${esc(c.msg)}${c.place ? `<br><span class="meta">Place: ${esc(c.place)}</span>` : ""}</td>
      <td>${c.hide ? "<em>Hidden</em>" : esc(c.name) + "<br>" + esc(c.roll)}<br><span class="meta">${esc(courseOf(c))}</span></td>
      <td><div class="act">
        <select aria-label="Stage">${STAGES.map(s => `<option${s === c.stage ? " selected" : ""}>${s}</option>`).join("")}</select>
        <input aria-label="Remark" placeholder="Remark for student" maxlength="300" value="${esc(c.remark)}">
        <button class="btn sm" data-id="${esc(c.id)}">Save</button></div></td></tr>`).join("")
      : '<tr><td colspan="4" class="empty">Koi complaint nahi mili.</td></tr>';
  }
  ["f-stage", "f-course", "f-sem", "f-cat"].forEach(k => $(k).addEventListener("change", render));
  $("f-q").addEventListener("input", render);

  $("rows").addEventListener("click", e => {
    const b = e.target.closest("button[data-id]"); if(!b) return;
    const tr = b.closest("tr"), d = load(), c = d.find(x => x.id === b.dataset.id); if(!c) return;
    c.stage = tr.querySelector("select").value; c.remark = tr.querySelector("input").value.trim();
    save(d); render(); toast("Update save ho gaya.");
  });

  $("csv").addEventListener("click", () => {
    const q = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const rows = [["ID", "Date", "Category", "Course", "Branch", "Sem", "Subject", "Message", "Place", "Urgent", "Name", "Roll", "Stage", "Remark"]]
      .concat(load().map(c => [c.id, fmt(c.ts), c.cat, c.course, c.branch, c.sem, c.title, c.msg, c.place, c.urgent ? "Yes" : "No", c.hide ? "" : c.name, c.hide ? "" : c.roll, c.stage, c.remark]));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(q).join(",")).join("\n")], { type: "text/csv" }));
    a.download = "campuscare-complaints.csv"; a.click();
  });
}
