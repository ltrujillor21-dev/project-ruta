/* ---------- script.js - lógica completa ---------- */

const sampleData = [
  { id:1, title:"Ruta 101 - Medellín → Bogotá", driver:"Carlos Pérez", vehicle:"Camión C-45", eta:"3 días", state:"enruta", img:"img/placeholder3.svg", progress:80, notes:"Carga: 12 pallets café." },
  { id:2, title:"Ruta 202 - Cali → Barranquilla", driver:"Ana Gómez", vehicle:"Camión T-12", eta:"1 día", state:"pendiente", img:"img/placeholder2.svg", progress:10, notes:"Revisar documentación." },
  { id:3, title:"Ruta 330 - Barranquilla → Cartagena", driver:"Luis Martínez", vehicle:"Camión L-88", eta:"6 horas", state:"entregado", img:"img/placeholder1.svg", progress:100, notes:"Entrega completada." }
];

document.addEventListener('DOMContentLoaded', () => {
  // ---------- LOGIN ----------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const u = document.getElementById('user').value.trim();
      const p = document.getElementById('pass').value.trim();
      if (u === 'admin' && p === '1234') {
        sessionStorage.setItem('lr_user','admin');
        if (!localStorage.getItem('lr_routes')) {
          localStorage.setItem('lr_routes', JSON.stringify(sampleData));
        }
        location.href = 'dashboard.html';
      } else {
        alert('Usuario o contraseña inválidos. Prueba admin / 1234');
      }
    });

    document.getElementById('helpBtn').addEventListener('click', ()=> {
      alert('Usuario demo: admin / Contraseña: 1234\nPara presentar, abre index.html e inicia sesión.');
    });

    return; // stop further dashboard code when on login page
  }

  // ---------- DASHBOARD PROTECTION ----------
  if (!sessionStorage.getItem('lr_user')) {
    location.href = 'index.html';
    return;
  }

  // ---------- ELEMENTS ----------
  const logoutBtn = document.getElementById('logoutBtn');
  const newRouteBtn = document.getElementById('newRouteBtn');
  const routesList = document.getElementById('routesList');
  const filterState = document.getElementById('filterState');
  const globalSearch = document.getElementById('globalSearch');

  // modal
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  const closeModal = document.getElementById('closeModal');

  // stats
  const totalRoutesEl = document.getElementById('totalRoutes');
  const onRouteEl = document.getElementById('onRoute');
  const deliveredEl = document.getElementById('delivered');
  const pendingEl = document.getElementById('pending');

  // canvas chart
  const sparkCanvas = document.getElementById('sparkChart');

  // Retrieve routes from storage
  let rutas = JSON.parse(localStorage.getItem('lr_routes')) || sampleData;

  // ---------- UTILIDADES ----------
  function save() {
    localStorage.setItem('lr_routes', JSON.stringify(rutas));
  }

  function renderStats() {
    const total = rutas.length;
    const onroute = rutas.filter(r => r.state === 'enruta').length;
    const delivered = rutas.filter(r => r.state === 'entregado').length;
    const pending = rutas.filter(r => r.state === 'pendiente').length;

    totalRoutesEl.textContent = total;
    onRouteEl.textContent = onroute;
    deliveredEl.textContent = delivered;
    pendingEl.textContent = pending;
  }

  function renderRoutes(list) {
    routesList.innerHTML = '';
    if (list.length === 0) {
      routesList.innerHTML = '<div class="muted">No se encontraron rutas.</div>';
      return;
    }
    list.forEach(r => {
      const div = document.createElement('div');
      div.className = 'route-card';
      div.innerHTML = `
        <div class="route-thumb"><img src="${r.img}" alt="${r.title}"></div>
        <div class="route-info">
          <h5>${r.title}</h5>
          <div class="muted">${r.driver} · ${r.vehicle} · ETA: ${r.eta}</div>
          <div class="route-actions">
            <span class="badge ${r.state}">${r.state}</span>
            <button class="btn small view" data-id="${r.id}">Ver</button>
            <button class="btn small ghost edit" data-id="${r.id}">Editar</button>
          </div>
        </div>
      `;
      routesList.appendChild(div);
    });

    // attach handlers
    document.querySelectorAll('.view').forEach(b => {
      b.addEventListener('click', () => {
        const id = +b.dataset.id;
        const item = rutas.find(x => x.id === id);
        openDetailModal(item);
      });
    });
    document.querySelectorAll('.edit').forEach(b => {
      b.addEventListener('click', () => {
        const id = +b.dataset.id;
        openEditModal(id);
      });
    });
  }

  function openDetailModal(item) {
    modalContent.innerHTML = `
      <h3>${item.title}</h3>
      <img src="${item.img}" alt="${item.title}" style="width:100%;max-height:260px;object-fit:cover;border-radius:8px;margin-top:10px">
      <p style="margin-top:8px">${item.notes}</p>
      <ul style="margin-top:8px;color:var(--muted)">
        <li><strong>Conductor:</strong> ${item.driver}</li>
        <li><strong>Vehículo:</strong> ${item.vehicle}</li>
        <li><strong>ETA:</strong> ${item.eta}</li>
        <li><strong>Estado:</strong> ${item.state}</li>
        <li><strong>Progreso:</strong> ${item.progress}%</li>
      </ul>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
        <button id="modalEdit" class="btn ghost">Editar</button>
        <button id="modalClose" class="btn">Cerrar</button>
      </div>
    `;
    modal.classList.remove('hidden');

    document.getElementById('modalClose').addEventListener('click', ()=> modal.classList.add('hidden'));
    document.getElementById('modalEdit').addEventListener('click', ()=> {
      modal.classList.add('hidden');
      openEditModal(item.id);
    });
  }

  function openEditModal(id) {
    const item = rutas.find(x => x.id === id);
    modalContent.innerHTML = `
      <h3>Editar Ruta</h3>
      <form id="editForm" class="form">
        <label>Título <input id="e_title" value="${item.title}"></label>
        <label>Conductor <input id="e_driver" value="${item.driver}"></label>
        <label>Vehículo <input id="e_vehicle" value="${item.vehicle}"></label>
        <label>ETA <input id="e_eta" value="${item.eta}"></label>
        <label>Estado
          <select id="e_state">
            <option ${item.state==='pendiente'?'selected':''} value="pendiente">pendiente</option>
            <option ${item.state==='enruta'?'selected':''} value="enruta">enruta</option>
            <option ${item.state==='entregado'?'selected':''} value="entregado">entregado</option>
          </select>
        </label>
        <label>Notas <textarea id="e_notes">${item.notes}</textarea></label>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
          <button type="submit" class="btn">Guardar</button>
          <button type="button" id="cancelEdit" class="btn ghost">Cancelar</button>
        </div>
      </form>
    `;
    modal.classList.remove('hidden');

    document.getElementById('cancelEdit').addEventListener('click', ()=> modal.classList.add('hidden'));
    document.getElementById('editForm').addEventListener('submit', (ev) => {
      ev.preventDefault();
      item.title = document.getElementById('e_title').value;
      item.driver = document.getElementById('e_driver').value;
      item.vehicle = document.getElementById('e_vehicle').value;
      item.eta = document.getElementById('e_eta').value;
      item.state = document.getElementById('e_state').value;
      item.notes = document.getElementById('e_notes').value;
      save(); renderStats(); applyFilters();
      modal.classList.add('hidden');
    });
  }

  // ---------- ADD NEW ROUTE (modal form) ----------
  newRouteBtn.addEventListener('click', ()=> {
    modalContent.innerHTML = `
      <h3>Nueva Ruta</h3>
      <form id="addForm" class="form">
        <label>Título <input id="a_title" required></label>
        <label>Conductor <input id="a_driver" required></label>
        <label>Vehículo <input id="a_vehicle" required></label>
        <label>ETA <input id="a_eta" required></label>
        <label>Estado
          <select id="a_state">
            <option value="pendiente">pendiente</option>
            <option value="enruta">enruta</option>
            <option value="entregado">entregado</option>
          </select>
        </label>
        <label>Notas <textarea id="a_notes"></textarea></label>
        <label>Imagen (opcional) <input id="a_img" type="file" accept="image/*"></label>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
          <button type="submit" class="btn">Agregar</button>
          <button type="button" id="cancelAdd" class="btn ghost">Cancelar</button>
        </div>
      </form>
    `;
    modal.classList.remove('hidden');

    document.getElementById('cancelAdd').addEventListener('click', ()=> modal.classList.add('hidden'));

    document.getElementById('addForm').addEventListener('submit', (ev)=> {
      ev.preventDefault();
      const title = document.getElementById('a_title').value.trim();
      const driver = document.getElementById('a_driver').value.trim();
      const vehicle = document.getElementById('a_vehicle').value.trim();
      const eta = document.getElementById('a_eta').value.trim();
      const state = document.getElementById('a_state').value;
      const notes = document.getElementById('a_notes').value.trim();
      const fileInput = document.getElementById('a_img');

      // If image provided, read as base64, else use placeholder
      if (fileInput.files && fileInput.files[0]) {
        const fr = new FileReader();
        fr.onload = function() {
          const imgBase = fr.result.toString();
          pushNewRoute(title,driver,vehicle,eta,state,notes,imgBase);
          modal.classList.add('hidden');
        };
        fr.readAsDataURL(fileInput.files[0]);
      } else {
        pushNewRoute(title,driver,vehicle,eta,state,notes,'img/placeholder1.svg');
        modal.classList.add('hidden');
      }
    });
  });

  function pushNewRoute(title,driver,vehicle,eta,state,notes,img) {
    const id = rutas.length ? Math.max(...rutas.map(r=>r.id))+1 : 1;
    rutas.unshift({ id, title, driver, vehicle, eta, state, img, progress: state === 'entregado' ? 100 : (state==='enruta'?50:5), notes });
    save(); renderStats(); applyFilters();
  }

  // ---------- FILTERS & SEARCH ----------
  function applyFilters(){
    let list = rutas.slice();
    const state = filterState.value;
    const q = globalSearch.value.trim().toLowerCase();

    if (state && state !== 'all') list = list.filter(r => r.state === state);
    if (q) list = list.filter(r => (r.title + ' ' + r.driver + ' ' + r.vehicle).toLowerCase().includes(q));
    renderRoutes(list);
    drawSpark(list.slice(0,7)); // update chart with current filtered
  }

  filterState.addEventListener('change', applyFilters);
  globalSearch.addEventListener('input', debounce(applyFilters, 250));

  // ---------- simple sparkline chart (canvas) ----------
  function drawSpark(list) {
    if (!sparkCanvas) return;
    const ctx = sparkCanvas.getContext('2d');
    // take last 7 progress values (or random if less)
    const values = list.length ? list.slice(0,7).map(r => r.progress || 0) : [20,40,60,30,70,50,90];
    const w = sparkCanvas.width = sparkCanvas.clientWidth * devicePixelRatio;
    const h = sparkCanvas.height = sparkCanvas.clientHeight * devicePixelRatio;
    ctx.clearRect(0,0,w,h);
    ctx.lineWidth = 3 * devicePixelRatio;
    ctx.strokeStyle = '#12a4d9';
    ctx.beginPath();
    const len = values.length;
    values.forEach((v,i) => {
      const x = (i/(len-1||1)) * (w-20*devicePixelRatio) + 10*devicePixelRatio;
      const y = h - (v/100)*(h-20*devicePixelRatio) - 10*devicePixelRatio;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      // dot
      ctx.fillStyle = '#0b63d4';
      ctx.beginPath();
      ctx.arc(x,y,4*devicePixelRatio,0,Math.PI*2);
      ctx.fill();
      ctx.beginPath();
    });
    ctx.stroke();
  }

  // ---------- helpers ----------
  function debounce(fn, ms) {
    let t;
    return (...a)=> {
      clearTimeout(t);
      t = setTimeout(()=> fn.apply(this,a), ms);
    };
  }

  // ---------- events ----------
  closeModal.addEventListener('click', ()=> modal.classList.add('hidden'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  logoutBtn.addEventListener('click', ()=> {
    sessionStorage.removeItem('lr_user');
    location.href = 'index.html';
  });

  // initial render
  renderStats();
  applyFilters();
});
