// Simple client-side app implementing requested features
const KEYS = {
  services: "vs_services_v1",
  hours: "vs_hours_v1",
  staff: "vs_staff_v1",
  reviews: "vs_reviews_v1",
  appts: "vs_appts_v1",
  users: "vs_users_v1",
  settings: "vs_settings_v1"
};

function seed() {
  if(!localStorage.getItem(KEYS.services)){
    const services = [
      {id:"s1", name:"Corte de cabelo", durationMin:30, price:20},
      {id:"s2", name:"Arreglo de barba", durationMin:30, price:15},
      {id:"s3", name:"Corte + Barba", durationMin:45, price:30}
    ];
    localStorage.setItem(KEYS.services, JSON.stringify(services));
  }
  if(!localStorage.getItem(KEYS.hours)){
    const hours = {Monday:["10:00-21:00"], Tuesday:["10:00-21:00"], Wednesday:["10:00-21:00"], Thursday:["10:00-21:00"], Friday:["10:00-21:00"], Saturday:["10:00-20:00"], Sunday:[]};
    localStorage.setItem(KEYS.hours, JSON.stringify(hours));
  }
  if(!localStorage.getItem(KEYS.staff)){
    const staff = [
      {id:"st1", name:"Cristian Barbero", role:"barbeiro", rating:5, photo:null},
      {id:"st2", name:"Rubens Barbero", role:"barbeiro", rating:5, photo:"/images/rubens.jpg"}
    ];
    localStorage.setItem(KEYS.staff, JSON.stringify(staff));
  }
  if(!localStorage.getItem(KEYS.reviews)){
    const rev = [{id:1,name:"Filippos P",date:"2025-08-29",score:5,note:"Todo perfecto!"}];
    localStorage.setItem(KEYS.reviews, JSON.stringify(rev));
  }
  if(!localStorage.getItem(KEYS.appts)){
    const appts = []; // will be created by booking/demo
    localStorage.setItem(KEYS.appts, JSON.stringify(appts));
  }
  if(!localStorage.getItem(KEYS.users)){
    const users = [
      {username:"rubens", password:"changeMe123", role:"owner", staffId:"st2", canCreateAdmins:true},
      {username:"cristian", password:"changeMe123", role:"staff", staffId:"st1", canCreateAdmins:false}
    ];
    localStorage.setItem(KEYS.users, JSON.stringify(users));
  }
  if(!localStorage.getItem(KEYS.settings)){
    localStorage.setItem(KEYS.settings, JSON.stringify({siteName:"Barbearia (inspirado)"}));
  }
}

seed();

const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

function get(key){ return JSON.parse(localStorage.getItem(key) || "null"); }
function set(key, v){ localStorage.setItem(key, JSON.stringify(v)); }

function formatDateISO(d){ const dt = new Date(d); return dt.toLocaleString(); }
function todayISO(){ return new Date().toISOString(); }

function renderSite(){
  const services = get(KEYS.services) || [];
  const staff = get(KEYS.staff) || [];
  const hours = get(KEYS.hours) || {};
  const reviews = get(KEYS.reviews) || [];
  qs("#year").textContent = new Date().getFullYear();
  qs("#site-name").textContent = get(KEYS.settings).siteName || "Barbearia";
  const sl = qs("#services-list"); sl.innerHTML = "";
  services.forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `<div><strong>${s.name}</strong><div class="muted">${s.durationMin} min</div></div><div style="text-align:right"><div><strong>€${s.price}</strong></div><button data-svc="${s.id}" class="book-now">Agendar</button></div>`;
    sl.appendChild(li);
  });
  const slist = qs("#staff-list"); slist.innerHTML = "";
  staff.forEach(st => {
    const div = document.createElement("div");
    div.className = "staff-card";
    const img = document.createElement("img");
    img.src = st.photo || "/images/placeholder.png";
    img.alt = st.name;
    div.innerHTML = `<div><img src="${img.src}" alt="${st.name}"/></div><div><div><strong>${st.name}</strong></div><div class="muted">${st.role}</div><div>⭐ ${st.rating}</div></div>`;
    slist.appendChild(div);
  });
  const hlist = qs("#hours"); hlist.innerHTML = "";
  Object.entries(hours).forEach(([k,v]) => {
    const li = document.createElement("li");
    li.textContent = `${k}: ${v.length ? v.join(", ") : "Fechado"}`;
    hlist.appendChild(li);
  });
  const rv = qs("#reviews"); rv.innerHTML = "";
  reviews.forEach(r => {
    const d = document.createElement("div");
    d.innerHTML = `<strong>${r.name}</strong> <span class="muted">• ${r.date}</span><div>${r.note}</div>`;
    rv.appendChild(d);
  });
}

renderSite();

// Booking quick demo
document.addEventListener("click", (e) => {
  if(e.target.matches(".book-now")){
    const svcId = e.target.dataset.svc;
    const staff = get(KEYS.staff) || [];
    const staffId = staff[0]?.id || null;
    const services = get(KEYS.services) || [];
    const svc = services.find(s=>s.id===svcId);
    const appts = get(KEYS.appts) || [];
    const appt = { id:`appt_${Date.now()}`, serviceId:svcId, staffId, dateISO: new Date(Date.now()+3600*1000).toISOString(), clientName:"Cliente demo", price: svc?.price || 0, paid:false, payMethod:null };
    appts.push(appt); set(KEYS.appts, appts);
    alert("Agendamento demo criado e salvo localmente.");
  }
});

// Hidden login toggle
window.addEventListener("keydown", (e) => {
  if(e.ctrlKey && e.shiftKey && (e.code === "KeyL" || e.key === "L")){
    qs("#login-modal").classList.toggle("hidden");
  }
});

// Login flow
qs("#login-btn").addEventListener("click", () => {
  const u = qs("#login-username").value.trim();
  const p = qs("#login-password").value.trim();
  const users = get(KEYS.users) || [];
  const user = users.find(x=>x.username===u && x.password===p);
  if(!user){ alert("Credenciais inválidas"); return; }
  sessionStorage.setItem("vs_current_user", JSON.stringify(user));
  qs("#login-modal").classList.add("hidden");
  showAdmin(user);
});

qs("#login-close").addEventListener("click", ()=> qs("#login-modal").classList.add("hidden"));

// Show admin drawer
function showAdmin(user){
  qs("#admin-drawer").classList.remove("hidden");
  qs("#admin-user").textContent = user.username;
  qs("#admin-role").textContent = user.role;
  populatePhotoStaffSelect(user);
  populateBillingStaffList();
  renderMyAppts();
  bindTabs();
}

// Logout
qs("#logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("vs_current_user");
  qs("#admin-drawer").classList.add("hidden");
});

// populate photo select
function populatePhotoStaffSelect(user){
  const sel = qs("#photo-staff-select");
  sel.innerHTML = "";
  const staff = get(KEYS.staff) || [];
  staff.forEach(s => {
    const opt = document.createElement("option"); opt.value = s.id; opt.textContent = s.name;
    sel.appendChild(opt);
  });
  // if user is staff, restrict select
  if(user.role === "staff"){
    sel.value = user.staffId;
    sel.disabled = true;
  } else {
    sel.value = staff[0]?.id || "";
  }
}

// photo upload
qs("#photo-input").addEventListener("change", (e) => {
  const f = e.target.files?.[0]; if(!f) return;
  const reader = new FileReader();
  const sel = qs("#photo-staff-select"); const staffId = sel.value;
  const user = JSON.parse(sessionStorage.getItem("vs_current_user")||"null");
  reader.onload = (ev) => {
    const data = ev.target.result;
    const staff = get(KEYS.staff) || [];
    // staff can only upload to own profile
    if(user.role === "staff" && user.staffId !== staffId){ alert("Você só pode subir fotos no seu próprio perfil."); return; }
    const s2 = staff.map(s => s.id===staffId? {...s, photo:data} : s);
    set(KEYS.staff, s2);
    renderSite();
    alert("Foto enviada e atribuída ao perfil.");
  };
  reader.readAsDataURL(f);
});

// My appointments view in profile tab
function renderMyAppts(){
  const cont = qs("#my-appts"); cont.innerHTML = "";
  const user = JSON.parse(sessionStorage.getItem("vs_current_user")||"null");
  if(!user) return;
  const appts = get(KEYS.appts) || [];
  const filtered = appts.filter(a => {
    if(user.role==="owner") return true;
    if(user.role==="staff") return a.staffId === user.staffId;
    return false;
  });
  filtered.slice().reverse().forEach(a => {
    const div = document.createElement("div");
    div.innerHTML = `<div><strong>${a.clientName}</strong><div class="muted">${formatDateISO(a.dateISO)} • €${a.price} • ${a.paid? "Pago":"Pendiente"}</div></div>`;
    const btn = document.createElement("button");
    if(user.role==="owner" || (user.role==="staff" && user.staffId===a.staffId)){
      btn.textContent = a.paid? "Marcar Pendiente":"Marcar Pago";
      btn.addEventListener("click", ()=> togglePaid(a.id));
      div.appendChild(btn);
    }
    cont.appendChild(div);
  });
}

// toggle paid with permission rules
function togglePaid(apptId){
  const user = JSON.parse(sessionStorage.getItem("vs_current_user")||"null");
  if(!user) return;
  const appts = get(KEYS.appts) || [];
  const idx = appts.findIndex(a=>a.id===apptId);
  if(idx<0) return;
  const appt = appts[idx];
  if(user.role==="staff" && user.staffId !== appt.staffId){ alert("Você não pode alterar esse atendimento."); return; }
  appts[idx].paid = !appts[idx].paid;
  set(KEYS.appts, appts);
  renderMyAppts();
  renderBilling(); // update billing view if open
}

// Billing UI
function populateBillingStaffList(){
  const sel = qs("#billing-staff");
  sel.innerHTML = '<option value="all">Todos</option>';
  const staff = get(KEYS.staff) || [];
  staff.forEach(s => {
    const o = document.createElement("option"); o.value = s.id; o.textContent = s.name;
    sel.appendChild(o);
  });
}

// filter billing
qs("#filter-billing").addEventListener("click", () => renderBilling());

function bindTabs(){
  qsa("#admin-tabs .tab").forEach(btn => {
    btn.addEventListener("click", () => {
      qsa("#admin-tabs .tab").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      qsa(".tab-panel").forEach(p=>p.classList.add("hidden"));
      qs(`#tab-${btn.dataset.tab}`).classList.remove("hidden");
      if(btn.dataset.tab === "billing") renderBilling();
    });
  });
}

// render billing
let chartInstance = null;
function renderBilling(){
  const from = qs("#from-date").value ? new Date(qs("#from-date").value) : null;
  const to = qs("#to-date").value ? new Date(qs("#to-date").value) : null;
  const staffFilter = qs("#billing-staff").value;
  const appts = get(KEYS.appts) || [];
  const staff = get(KEYS.staff) || [];
  let filtered = appts.slice();
  if(from) filtered = filtered.filter(a => new Date(a.dateISO) >= from);
  if(to) filtered = filtered.filter(a => new Date(a.dateISO) <= new Date(to.getTime() + 24*3600*1000 - 1));
  if(staffFilter && staffFilter!=="all") filtered = filtered.filter(a => a.staffId === staffFilter);
  // build table
  const wrap = qs("#billing-table-wrap"); wrap.innerHTML = "";
  const table = document.createElement("table");
  const thead = document.createElement("thead"); thead.innerHTML = "<tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Forma</th><th>Valor</th></tr>";
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  let total = 0;
  filtered.forEach(a => {
    const svc = (get(KEYS.services)||[]).find(s=>s.id===a.serviceId);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${a.clientName}</td><td>${svc?svc.name:"-"}</td><td>${new Date(a.dateISO).toLocaleString()}</td><td>${a.paid? "Pago":"Pendiente"}</td><td>${a.payMethod|| "-"}</td><td>€${a.price}</td>`;
    tbody.appendChild(tr);
    total += Number(a.price || 0);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  qs("#billing-summary").textContent = `Total: €${total.toFixed(2)}`;
  // chart: monthly counts for last 6 months
  const now = new Date();
  const months = [];
  const counts = [];
  for(let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const label = d.toLocaleString('default',{month:'short', year:'numeric'});
    months.push(label);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth()+1, 1);
    const c = (get(KEYS.appts)||[]).filter(a => {
      const ad = new Date(a.dateISO);
      return ad >= start && ad < end && (staffFilter==="all" ? true : a.staffId===staffFilter);
    }).length;
    counts.push(c);
  }
  const ctx = qs("#billing-chart").getContext("2d");
  if(chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{ label: 'Atendimentos', data: counts, fill:false, borderColor:'rgba(107,122,58,1)'}]
    },
    options: { responsive:true, maintainAspectRatio:false }
  });
}

// Print PDF (Spanish)
qs("#print-pdf").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const from = qs("#from-date").value || null;
  const to = qs("#to-date").value || null;
  const staffFilter = qs("#billing-staff").value;
  const staffName = staffFilter === "all" ? "Todos" : (get(KEYS.staff)||[]).find(s=>s.id===staffFilter)?.name || "";
  const doc = new jsPDF();
  const title = `Facturación de ${staffName} — ${from||'inicio'} a ${to||'fin'}`;
  doc.setFontSize(14);
  doc.text(title, 10, 10);
  // table header
  doc.setFontSize(10);
  const appts = get(KEYS.appts) || [];
  let filtered = appts.slice();
  if(from) filtered = filtered.filter(a => new Date(a.dateISO) >= new Date(from));
  if(to) filtered = filtered.filter(a => new Date(a.dateISO) <= new Date(new Date(to).getTime()+24*3600*1000-1));
  if(staffFilter && staffFilter!=="all") filtered = filtered.filter(a => a.staffId===staffFilter);
  const startY = 20;
  let y = startY;
  doc.text("Cliente | Servicio | Fecha | Pago | Forma | Valor", 10, y); y+=6;
  let total = 0;
  filtered.forEach(a => {
    const svc = (get(KEYS.services)||[]).find(s=>s.id===a.serviceId);
    const line = `${a.clientName} | ${svc?svc.name:'-'} | ${new Date(a.dateISO).toLocaleString()} | ${a.paid? 'Pago':'Pendiente'} | ${a.payMethod||'-'} | €${a.price}`;
    if(y>280){ doc.addPage(); y=20; }
    doc.text(line, 10, y); y+=6;
    total += Number(a.price || 0);
  });
  doc.text(`Total: €${total.toFixed(2)}`, 10, y+6);
  doc.save(`factura_${Date.now()}.pdf`);
});

// view appts quick
qs("#view-appts").addEventListener("click", () => {
  const appts = get(KEYS.appts) || [];
  if(!appts.length) return alert("Nenhum agendamento");
  const list = appts.slice(-6).map(a => `${a.clientName} • ${new Date(a.dateISO).toLocaleString()}`).join("\n");
  alert(list);
});

// initialization: if session exists show admin
(function init(){
  renderSite();
  const cur = sessionStorage.getItem("vs_current_user");
  if(cur) showAdmin(JSON.parse(cur));
  // wiring: booking quick demo buttons delegated earlier; bind billing staff select
  populateBillingStaffList();
})();
