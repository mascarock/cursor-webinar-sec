const API = 'http://localhost:3001';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const authSection = $('#authSection');
const appSection = $('#appSection');
const userBar = $('#userBar');
const userName = $('#userName');
const authMsg = $('#authMsg');

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

async function checkSession() {
  const { ok, data } = await api('/api/me');
  if (ok) showApp(data.username);
  else showAuth();
}

function showApp(name) {
  authSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  userBar.classList.remove('hidden');
  userName.textContent = name;
  loadExpenses();
}

function showAuth() {
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
  userBar.classList.add('hidden');
}

async function loadExpenses() {
  const { ok, data: items } = await api('/api/expenses');
  const list = $('#expensesList');
  const empty = $('#emptyState');
  list.innerHTML = '';

  if (!ok || !Array.isArray(items) || items.length === 0) {
    empty.classList.remove('hidden');
    $('#totalAmount').textContent = formatCOP(0);
    $('#totalCount').textContent = '0';
    $('#topCategory').textContent = '—';
    return;
  }
  empty.classList.add('hidden');

  let total = 0;
  const byCategory = {};

  items.forEach((e) => {
    const amt = Number(e.amount) || 0;
    total += amt;
    byCategory[e.category] = (byCategory[e.category] || 0) + amt;

    const li = document.createElement('li');
    li.innerHTML = `
      <div class="expense-info">
        <div class="expense-desc">${e.description}</div>
        <div class="expense-meta">${e.category} · ${formatDate(e.date)}</div>
      </div>
      <div class="expense-actions">
        <span class="expense-amount">${formatCOP(amt)}</span>
        <button class="delete-btn" data-id="${e._id}" aria-label="Eliminar">×</button>
      </div>
    `;
    li.querySelector('.delete-btn').addEventListener('click', async () => {
      await api('/api/expenses/' + e._id, { method: 'DELETE' });
      loadExpenses();
    });
    list.appendChild(li);
  });

  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  $('#totalAmount').textContent = formatCOP(total);
  $('#totalCount').textContent = String(items.length);
  $('#topCategory').textContent = top ? top[0] : '—';
}

$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.tab;
    $('#loginForm').classList.toggle('hidden', which !== 'login');
    $('#registerForm').classList.toggle('hidden', which !== 'register');
    authMsg.textContent = '';
  });
});

$('#loginForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  authMsg.textContent = '';
  const fd = new FormData(ev.target);
  const { ok, data } = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(fd)),
  });
  if (ok && data.ok) showApp(data.username);
  else authMsg.textContent = data.message || data.error || 'Error al iniciar sesión';
});

$('#registerForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  authMsg.textContent = '';
  const fd = new FormData(ev.target);
  const { ok, data } = await api('/api/register', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(fd)),
  });
  if (ok && data.ok) showApp(data.username);
  else authMsg.textContent = data.message || data.error || 'Error al registrarse';
});

$('#expenseForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  await api('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(fd)),
  });
  ev.target.reset();
  loadExpenses();
});

$('#logoutBtn').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  showAuth();
});

checkSession();
