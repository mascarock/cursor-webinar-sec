const $ = (sel) => document.querySelector(sel);

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
  }).format(n);
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  return res.json().catch(() => ({}));
}

async function checkSession() {
  const res = await fetch('/api/me', { credentials: 'same-origin' });
  if (res.ok) {
    const data = await res.json();
    showApp(data.username);
  } else {
    showAuth();
  }
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
  const items = await api('/api/expenses');
  const list = $('#expensesList');
  list.innerHTML = '';
  let total = 0;
  if (!Array.isArray(items)) return;
  items.forEach((e) => {
    total += Number(e.amount) || 0;
    const li = document.createElement('li');
    const date = new Date(e.date).toLocaleDateString('es-CO');
    li.innerHTML = `
      <div>
        <div><strong>${e.description}</strong> — ${formatCOP(e.amount)}</div>
        <div class="meta">${e.category} · ${date}</div>
      </div>
      <button data-id="${e._id}">Eliminar</button>
    `;
    li.querySelector('button').addEventListener('click', async () => {
      await api('/api/expenses/' + e._id, { method: 'DELETE' });
      loadExpenses();
    });
    list.appendChild(li);
  });
  $('#total').textContent = formatCOP(total);
}

$('#loginForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  authMsg.textContent = '';
  const fd = new FormData(ev.target);
  const data = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(fd)),
  });
  if (data.ok) showApp(data.username);
  else authMsg.textContent = data.error || 'Error';
});

$('#registerForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  authMsg.textContent = '';
  const fd = new FormData(ev.target);
  const data = await api('/api/register', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(fd)),
  });
  if (data.ok) showApp(data.username);
  else authMsg.textContent = data.error || 'Error';
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
