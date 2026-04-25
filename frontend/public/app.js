const API = location.port === '5173' ? 'http://localhost:3001' : '';

const $ = (sel) => document.querySelector(sel);
const view = $('#view');
const modalRoot = $('#modalRoot');
const userBar = $('#userBar');
const userName = $('#userName');

const CURRENCIES = [
  { code: 'COP', symbol: '$', label: 'Peso colombiano' },
  { code: 'USD', symbol: 'US$', label: 'Dólar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'MXN', symbol: 'MX$', label: 'Peso mexicano' },
  { code: 'ARS', symbol: 'AR$', label: 'Peso argentino' },
  { code: 'BRL', symbol: 'R$', label: 'Real brasileño' },
  { code: 'CLP', symbol: 'CL$', label: 'Peso chileno' },
  { code: 'PEN', symbol: 'S/', label: 'Sol peruano' },
];

const AVATAR_COLORS = [
  '#fbbf24', '#34d399', '#60a5fa', '#f472b6',
  '#a78bfa', '#fb923c', '#22d3ee', '#facc15',
];

let currentUser = null;

/* ─── Helpers ─── */
function colorFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name) {
  return name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function avatar(name, size = '') {
  const cls = size ? `avatar avatar-${size}` : 'avatar';
  return `<span class="${cls}" style="background:${colorFor(name)}">${initials(name)}</span>`;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s == null ? '' : String(s);
  return div.innerHTML;
}

function formatMoney(amount, currency = 'COP') {
  const opts = {
    style: 'currency',
    currency,
    maximumFractionDigits: ['COP', 'CLP'].includes(currency) ? 0 : 2,
  };
  try {
    return new Intl.NumberFormat('es-CO', opts).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const FX_TTL_MS = 12 * 60 * 60 * 1000;
let fxCache = null;
async function getRatesUSD() {
  if (fxCache && Date.now() - fxCache.fetchedAt < FX_TTL_MS) return fxCache.rates;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('fx http');
    const data = await res.json();
    if (data?.result !== 'success' || !data?.rates) throw new Error('fx payload');
    fxCache = { rates: data.rates, fetchedAt: Date.now() };
    return fxCache.rates;
  } catch {
    return null;
  }
}
async function convertAmount(amount, from, to) {
  if (!Number.isFinite(amount) || from === to) return amount;
  const rates = await getRatesUSD();
  if (!rates || !rates[from] || !rates[to]) return null;
  return (amount / rates[from]) * rates[to];
}

/* ─── Auth ─── */
async function checkSession() {
  const { ok, data } = await api('/api/me');
  if (ok) {
    currentUser = data.username;
    userBar.classList.remove('hidden');
    userName.textContent = data.username;
    if (!location.hash || location.hash === '#/login') location.hash = '#/groups';
    route();
  } else {
    currentUser = null;
    userBar.classList.add('hidden');
    renderAuth();
  }
}

function renderAuth(viaInvite = false) {
  const heroTitle = viaInvite ? 'Te invitaron a un grupo.' : 'Compartí gastos sin enredos.';
  const heroSub = viaInvite
    ? 'Iniciá sesión o creá una cuenta para sumarte al grupo.'
    : 'Registrá lo que pagó cada uno y mirá al instante quién le debe a quién.';
  const initialTab = viaInvite ? 'register' : 'login';
  view.innerHTML = `
    <div class="hero fade-up">
      <h1>${heroTitle}</h1>
      <p>${heroSub}</p>
    </div>
    <div class="card fade-up">
      <div class="tabs" role="tablist">
        <button class="tab ${initialTab === 'login' ? 'active' : ''}" data-tab="login">Iniciar sesión</button>
        <button class="tab ${initialTab === 'register' ? 'active' : ''}" data-tab="register">Registrarse</button>
      </div>
      <form id="loginForm" class="${initialTab === 'login' ? '' : 'hidden'}">
        <div class="field"><label>Usuario</label>
          <input name="username" placeholder="ej: maria" required autocomplete="username" /></div>
        <div class="field"><label>Contraseña</label>
          <input name="password" type="password" placeholder="••••••••" required autocomplete="current-password" /></div>
        <button type="submit" class="btn btn-primary btn-block">Entrar →</button>
      </form>
      <form id="registerForm" class="${initialTab === 'register' ? '' : 'hidden'}">
        <div class="field"><label>Usuario</label>
          <input name="username" placeholder="Elegí un nombre de usuario" required autocomplete="username" /></div>
        <div class="field"><label>Contraseña</label>
          <input name="password" type="password" placeholder="Elegí una contraseña" required autocomplete="new-password" /></div>
        <button type="submit" class="btn btn-primary btn-block">Crear cuenta →</button>
      </form>
      <p id="authMsg" class="msg"></p>
    </div>
  `;

  view.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      view.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.tab;
      $('#loginForm').classList.toggle('hidden', which !== 'login');
      $('#registerForm').classList.toggle('hidden', which !== 'register');
      $('#authMsg').textContent = '';
    });
  });

  $('#loginForm').addEventListener('submit', (e) => handleAuth(e, '/api/login'));
  $('#registerForm').addEventListener('submit', (e) => handleAuth(e, '/api/register'));
}

async function handleAuth(ev, endpoint) {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const { ok, data } = await api(endpoint, {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(fd)),
  });
  if (ok && data.ok) {
    currentUser = data.username;
    userBar.classList.remove('hidden');
    userName.textContent = data.username;
    const joined = await consumePendingJoin();
    if (!joined) location.hash = '#/groups';
  } else {
    $('#authMsg').textContent = data.message || data.error || 'Error';
  }
}

$('#logoutBtn').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  currentUser = null;
  userBar.classList.add('hidden');
  location.hash = '';
  renderAuth();
});

/* ─── Groups list ─── */
async function renderGroupsList() {
  view.innerHTML = `
    <div class="hero fade-up">
      <h1>Tus grupos.</h1>
      <p>Cada grupo es una cuenta compartida con tu familia, tu viaje o tus amigos.</p>
    </div>
    <div id="groupsContainer" class="fade-up"></div>
    <button class="fab" id="newGroupBtn" aria-label="Nuevo grupo">+</button>
  `;

  const { ok, data } = await api('/api/groups');
  const container = $('#groupsContainer');
  if (!ok || !Array.isArray(data) || data.length === 0) {
    container.innerHTML = `
      <div class="card empty">
        <span class="empty-icon">👥</span>
        Todavía no tenés grupos.<br/>Tocá <strong>+</strong> para crear el primero.
      </div>
    `;
  } else {
    container.innerHTML = `<div class="group-list">${data.map(groupCardHtml).join('')}</div>`;
  }

  $('#newGroupBtn').addEventListener('click', openNewGroupModal);
}

function groupCardHtml(g) {
  const bal = Number(g.myBalance) || 0;
  let label, cls, amount;
  if (Math.abs(bal) < 0.01) {
    label = 'Estás al día';
    cls = 'neutral';
    amount = formatMoney(0, g.currency);
  } else if (bal > 0) {
    label = 'Te deben';
    cls = 'positive';
    amount = formatMoney(bal, g.currency);
  } else {
    label = 'Debés';
    cls = 'negative';
    amount = formatMoney(-bal, g.currency);
  }
  const meta = `${plural(g.memberCount, 'miembro', 'miembros')} · ${plural(g.expenseCount, 'gasto', 'gastos')} · ${g.currency}`;
  return `
    <a class="group-card" href="#/groups/${g._id}" data-group-id="${g._id}">
      ${avatar(g.name, 'lg')}
      <div class="group-card-info">
        <div class="group-card-title">${escapeHtml(g.name)}</div>
        <div class="group-card-meta">${meta}</div>
      </div>
      <div class="group-card-balance">
        <div class="balance-label">${label}</div>
        <div class="balance-amount ${cls}">${amount}</div>
      </div>
    </a>
  `;
}

/* ─── New group modal ─── */
function openNewGroupModal() {
  openModal({
    title: 'Nuevo grupo',
    body: `
      <form id="newGroupForm">
        <div class="field"><label>Nombre del grupo</label>
          <input name="name" placeholder="ej: Viaje a Cartagena" required autofocus /></div>
        <div class="field"><label>Moneda</label>
          <select name="currency">
            ${CURRENCIES.map((c) => `<option value="${c.code}">${c.code} — ${c.label}</option>`).join('')}
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Crear grupo</button>
      </form>
    `,
    onMount: () => {
      $('#newGroupForm').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const body = Object.fromEntries(fd);
        const { ok, data } = await api('/api/groups', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (ok) {
          closeModal();
          location.hash = `#/groups/${data._id}`;
        }
      });
    },
  });
}

/* ─── Group detail ─── */
let currentGroupState = null;
let currentTab = 'expenses';

async function renderGroupDetail(id) {
  view.innerHTML = `<div class="empty">Cargando…</div>`;
  const { ok, data } = await api(`/api/groups/${id}`);
  if (!ok) {
    view.innerHTML = `<div class="card empty">No se pudo cargar el grupo.</div>`;
    return;
  }
  currentGroupState = data;
  currentTab = currentTab || 'expenses';
  paintGroup();
}

function paintGroup() {
  const { group, expenses, balances, settlements, total } = currentGroupState;
  view.innerHTML = `
    <a href="#/groups" class="btn-icon" style="margin-bottom: 16px; display: inline-flex;">← Grupos</a>
    <div class="fade-up">
      <div class="group-header">
        <div style="display:flex;gap:14px;align-items:center;min-width:0;">
          ${avatar(group.name, 'lg')}
          <div style="min-width:0;">
            <h1>${escapeHtml(group.name)}</h1>
            <div class="group-header-meta">
              ${formatMoney(total, group.currency)} en total · ${plural(expenses.length, 'gasto', 'gastos')} · ${group.currency}
            </div>
          </div>
        </div>
        <div class="group-actions">
          <button class="btn-icon" id="inviteBtn" title="Invitar miembros">Invitar</button>
          <button class="btn-icon" id="deleteGroupBtn" title="Eliminar grupo">Eliminar</button>
        </div>
      </div>

      <div class="member-chips" id="memberChips">
        ${group.members.map((m) => `
          <span class="member-chip">
            ${avatar(m.name)}
            ${escapeHtml(m.name)}
            ${m.isUser ? '' : `<button class="remove-x" data-member-id="${m.memberId}" title="Quitar">×</button>`}
          </span>
        `).join('')}
        <button class="member-chip-add" id="addMemberBtn">+ Agregar miembro</button>
      </div>

      <div class="nav-tabs" style="margin-top: 24px;">
        <button class="nav-tab ${currentTab === 'expenses' ? 'active' : ''}" data-tab="expenses">Gastos</button>
        <button class="nav-tab ${currentTab === 'balances' ? 'active' : ''}" data-tab="balances">Balances</button>
        <button class="nav-tab ${currentTab === 'settle' ? 'active' : ''}" data-tab="settle">Saldar</button>
      </div>

      <div id="tabContent"></div>
    </div>

    <button class="fab" id="addExpenseBtn" aria-label="Agregar gasto">+</button>
  `;

  view.querySelectorAll('.nav-tab').forEach((t) => {
    t.addEventListener('click', () => {
      currentTab = t.dataset.tab;
      paintGroup();
    });
  });

  $('#addExpenseBtn').addEventListener('click', () => openExpenseModal(group));
  $('#addMemberBtn').addEventListener('click', () => openAddMemberModal(group));
  $('#deleteGroupBtn').addEventListener('click', () => deleteGroup(group));
  $('#inviteBtn').addEventListener('click', () => openInviteModal(group));

  view.querySelectorAll('.remove-x').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Quitar a este miembro?')) return;
      const { ok, data } = await api(`/api/groups/${group._id}/members/${btn.dataset.memberId}`, { method: 'DELETE' });
      if (!ok) {
        alert(data?.message || 'No se pudo quitar al miembro');
        return;
      }
      renderGroupDetail(group._id);
    });
  });

  const tabBody = $('#tabContent');
  if (currentTab === 'expenses') tabBody.innerHTML = expensesTabHtml(expenses, group);
  else if (currentTab === 'balances') tabBody.innerHTML = balancesTabHtml(balances, group);
  else tabBody.innerHTML = settlementsTabHtml(settlements, group);

  if (currentTab === 'expenses') {
    tabBody.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await api(`/api/groups/${group._id}/expenses/${btn.dataset.id}`, { method: 'DELETE' });
        renderGroupDetail(group._id);
      });
    });
  }
}

function expensesTabHtml(expenses, group) {
  if (!expenses.length) {
    return `<div class="card empty"><span class="empty-icon">🧾</span>Todavía no hay gastos. Tocá <strong>+</strong> para agregar uno.</div>`;
  }
  return `
    <div class="card">
      <p class="section-label">Historial</p>
      <ul class="expense-feed">
        ${expenses.map((e) => {
          const payer = group.members.find((m) => m.memberId === e.paidBy);
          const payerName = payer ? payer.name : 'Alguien';
          const splitCount = e.splitBetween?.length || group.members.length;
          const splitLabel = splitCount === 1 ? 'sin dividir' : `dividido entre ${splitCount}`;
          const expenseCurrency = e.currency || group.currency;
          const showConversion =
            expenseCurrency !== group.currency && typeof e.convertedAmount === 'number';
          const amountHtml = showConversion
            ? `<div class="expense-amount">${formatMoney(e.amount, expenseCurrency)}</div>
               <div class="expense-amount-converted">≈ ${formatMoney(e.convertedAmount, group.currency)}</div>`
            : `<div class="expense-amount">${formatMoney(e.amount, expenseCurrency)}</div>`;
          return `
            <li class="expense-row">
              ${avatar(payerName)}
              <div class="expense-info">
                <div class="expense-desc">${escapeHtml(e.description) || '<span style="color:var(--text-muted)">(sin descripción)</span>'}</div>
                <div class="expense-meta">${escapeHtml(payerName)} pagó · ${escapeHtml(e.category)} · ${splitLabel} · ${formatDate(e.date)}</div>
              </div>
              <div class="expense-amount-wrap">
                ${amountHtml}
              </div>
              <button class="delete-btn" data-id="${e._id}" aria-label="Eliminar">×</button>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;
}

function balancesTabHtml(balances, group) {
  const max = Math.max(1, ...balances.map((b) => Math.abs(b.balance)));
  return `
    <div class="card">
      <p class="section-label">Balance por miembro</p>
      ${balances.map((b) => {
        const pct = (Math.abs(b.balance) / max) * 50;
        const cls = b.balance > 0.01 ? 'positive' : b.balance < -0.01 ? 'negative' : 'neutral';
        const sign = b.balance > 0.01 ? '+' : b.balance < -0.01 ? '−' : '';
        return `
          <div class="balance-row">
            ${avatar(b.name)}
            <div class="balance-info">
              <div class="balance-name">${escapeHtml(b.name)}</div>
              <div class="balance-bar">
                <div class="balance-bar-fill ${cls}" style="width:${pct}%"></div>
              </div>
            </div>
            <div class="balance-amount ${cls}">${sign}${formatMoney(Math.abs(b.balance), group.currency)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function settlementsTabHtml(settlements, group) {
  if (!settlements.length) {
    return `<div class="card empty"><span class="empty-icon">✓</span>Todos están al día. ¡Nadie le debe nada a nadie!</div>`;
  }
  return `
    <div class="card">
      <p class="section-label">Para saldar todo</p>
      ${settlements.map((s) => `
        <div class="settlement-row">
          <div class="settlement-flow">
            ${avatar(s.fromName)}
            <span class="settlement-name">${escapeHtml(s.fromName)}</span>
            <span class="settlement-arrow">→</span>
            ${avatar(s.toName)}
            <span class="settlement-name">${escapeHtml(s.toName)}</span>
          </div>
          <div class="settlement-amount">${formatMoney(s.amount, group.currency)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

async function deleteGroup(group) {
  if (!confirm(`¿Eliminar "${group.name}" y todos sus gastos?`)) return;
  await api(`/api/groups/${group._id}`, { method: 'DELETE' });
  location.hash = '#/groups';
}

/* ─── Invite modal ─── */
function openInviteModal(group) {
  const link = `${location.origin}${location.pathname}#/join/${group.inviteToken}`;
  const waText = encodeURIComponent(`Te invito a "${group.name}" en Gastos Familiares: ${link}`);
  openModal({
    title: 'Invitar al grupo',
    body: `
      <p style="color: var(--text-muted); font-size: 14px; margin: 0 0 16px;">
        Compartí este link. Quien lo abra y se registre se suma automáticamente a <strong>${escapeHtml(group.name)}</strong>.
      </p>
      <div class="field">
        <label>Link de invitación</label>
        <input id="inviteLink" value="${link}" readonly onclick="this.select()" />
      </div>
      <div style="display:flex; gap:8px; flex-wrap: wrap; margin-top: 8px;">
        <button class="btn btn-primary" id="copyLinkBtn" style="flex:1; min-width: 140px;">Copiar link</button>
        <a class="btn btn-ghost" href="https://wa.me/?text=${waText}" target="_blank" rel="noopener" style="flex:1; min-width: 140px;">WhatsApp</a>
      </div>
      <p id="copyMsg" class="msg" style="color: var(--positive);"></p>
    `,
    onMount: () => {
      $('#copyLinkBtn').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(link);
          $('#copyMsg').textContent = '✓ Link copiado';
        } catch {
          $('#inviteLink').select();
          document.execCommand('copy');
          $('#copyMsg').textContent = '✓ Link copiado';
        }
      });
    },
  });
}

/* ─── Add member modal ─── */
function openAddMemberModal(group) {
  openModal({
    title: 'Agregar miembro',
    body: `
      <form id="addMemberForm">
        <div class="field"><label>Nombre</label>
          <input name="name" placeholder="ej: Juan" required autofocus /></div>
        <p class="label" style="margin: 4px 0 12px;">No hace falta que tenga cuenta en la app.</p>
        <button type="submit" class="btn btn-primary btn-block">Agregar</button>
      </form>
    `,
    onMount: () => {
      $('#addMemberForm').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        await api(`/api/groups/${group._id}/members`, {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(fd)),
        });
        closeModal();
        renderGroupDetail(group._id);
      });
    },
  });
}

/* ─── Add expense modal ─── */
function openExpenseModal(group) {
  const memberOptions = group.members
    .map((m) => `<option value="${m.memberId}">${escapeHtml(m.name)}</option>`)
    .join('');
  const splitChecks = group.members.map((m) => `
    <label class="split-item">
      <input type="checkbox" name="split" value="${m.memberId}" checked />
      ${avatar(m.name, 'sm')}
      <span>${escapeHtml(m.name)}</span>
    </label>
  `).join('');

  const currencyOptions = CURRENCIES.map(
    (c) => `<option value="${c.code}" ${c.code === group.currency ? 'selected' : ''}>${c.code} — ${c.label}</option>`,
  ).join('');

  openModal({
    title: 'Nuevo gasto',
    body: `
      <form id="newExpenseForm">
        <div class="field"><label>Descripción</label>
          <input name="description" placeholder="ej: Cena" required autofocus /></div>
        <div class="field-row">
          <div class="field" style="flex:2;"><label>Monto</label>
            <input name="amount" type="number" step="0.01" min="0.01" placeholder="0" required inputmode="decimal" /></div>
          <div class="field" style="flex:1;"><label>Moneda</label>
            <select name="currency">${currencyOptions}</select></div>
        </div>
        <p class="label" id="fxHint" style="margin: -4px 0 12px; min-height: 1em; color: var(--text-muted); font-size: 12px;"></p>
        <div class="field"><label>Pagado por</label>
          <select name="paidBy" required>${memberOptions}</select></div>
        <div class="field"><label>Categoría</label>
          <select name="category">
            <option>Mercado</option><option>Comida</option><option>Transporte</option>
            <option>Hospedaje</option><option>Servicios</option><option>Salud</option>
            <option>Ocio</option><option>Otros</option>
          </select></div>
        <div class="field">
          <label>Dividido entre</label>
          <div class="split-list">${splitChecks}</div>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Guardar gasto</button>
      </form>
    `,
    onMount: () => {
      const form = $('#newExpenseForm');
      const hint = $('#fxHint');

      const refreshHint = async () => {
        const amount = Number(form.amount.value);
        const currency = form.currency.value;
        if (!Number.isFinite(amount) || amount <= 0 || currency === group.currency) {
          hint.textContent = '';
          return;
        }
        try {
          const converted = await convertAmount(amount, currency, group.currency);
          if (converted == null) {
            hint.textContent = '';
            return;
          }
          hint.textContent = `≈ ${formatMoney(converted, group.currency)} en la moneda del grupo`;
        } catch {
          hint.textContent = '';
        }
      };

      form.amount.addEventListener('input', refreshHint);
      form.currency.addEventListener('change', refreshHint);

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const splitBetween = [...form.querySelectorAll('input[name="split"]:checked')].map((c) => c.value);
        if (!splitBetween.length) {
          alert('Seleccioná al menos un miembro');
          return;
        }
        const amount = Number(form.amount.value);
        if (!Number.isFinite(amount) || amount <= 0) {
          alert('El monto debe ser mayor a 0');
          return;
        }
        const body = {
          description: form.description.value.trim(),
          amount,
          currency: form.currency.value,
          paidBy: form.paidBy.value,
          category: form.category.value,
          splitBetween,
        };
        const { ok, data } = await api(`/api/groups/${group._id}/expenses`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (!ok) {
          alert(data?.message || 'No se pudo guardar el gasto');
          return;
        }
        closeModal();
        renderGroupDetail(group._id);
      });
    },
  });
}

/* ─── Modal infra ─── */
function openModal({ title, body, onMount }) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <div class="modal-title">${escapeHtml(title)}</div>
          <button class="modal-close" id="modalCloseBtn" aria-label="Cerrar">×</button>
        </div>
        ${body}
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
  $('#modalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modalBackdrop') closeModal();
  });
  $('#modalCloseBtn').addEventListener('click', closeModal);
  if (onMount) onMount();
}

function closeModal() {
  modalRoot.innerHTML = '';
  document.body.style.overflow = '';
}

/* ─── Join via invite link ─── */
const PENDING_JOIN_KEY = 'pendingJoinToken';

async function handleJoin(token) {
  if (!currentUser) {
    sessionStorage.setItem(PENDING_JOIN_KEY, token);
    renderAuth(true);
    return;
  }
  view.innerHTML = `<div class="empty">Uniéndote al grupo…</div>`;
  const { ok, data } = await api(`/api/groups/join/${token}`, { method: 'POST' });
  if (ok && data.groupId) {
    location.hash = `#/groups/${data.groupId}`;
  } else {
    view.innerHTML = `<div class="card empty">Invitación inválida o expirada.</div>`;
  }
}

async function consumePendingJoin() {
  const token = sessionStorage.getItem(PENDING_JOIN_KEY);
  if (!token || !currentUser) return false;
  sessionStorage.removeItem(PENDING_JOIN_KEY);
  const { ok, data } = await api(`/api/groups/join/${token}`, { method: 'POST' });
  if (ok && data.groupId) {
    location.hash = `#/groups/${data.groupId}`;
    return true;
  }
  return false;
}

/* ─── Router ─── */
function route() {
  const hash = location.hash || '';
  const joinMatch = hash.match(/^#\/join\/([\w-]+)$/);
  if (joinMatch) {
    handleJoin(joinMatch[1]);
    return;
  }
  if (!currentUser) {
    renderAuth();
    return;
  }
  const m = hash.match(/^#\/groups\/([\w-]+)$/);
  if (m) {
    renderGroupDetail(m[1]);
  } else if (hash === '#/groups' || hash === '') {
    renderGroupsList();
  } else {
    location.hash = '#/groups';
  }
}

window.addEventListener('hashchange', route);
checkSession();
