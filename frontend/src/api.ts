async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export interface User {
  username: string;
}

export interface Member {
  memberId: string;
  name: string;
  isUser: boolean;
}

export interface Group {
  _id: string;
  name: string;
  currency: string;
  inviteToken: string;
  members: Member[];
}

export interface GroupSummary {
  _id: string;
  name: string;
  currency: string;
  myBalance: number;
  memberCount: number;
  expenseCount: number;
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  category: string;
  date: string;
  splitBetween?: string[];
  convertedAmount?: number;
}

export interface Balance {
  memberId: string;
  name: string;
  balance: number;
}

export interface Settlement {
  fromName: string;
  toName: string;
  amount: number;
}

export interface GroupDetail {
  group: Group;
  expenses: Expense[];
  balances: Balance[];
  settlements: Settlement[];
  total: number;
}

export interface NewExpensePayload {
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  category: string;
  splitBetween: string[];
}

export const authApi = {
  me: () => apiFetch('/api/me'),
  login: (username: string, password: string) =>
    apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string) =>
    apiFetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => apiFetch('/api/logout', { method: 'POST' }),
};

export const groupsApi = {
  list: () => apiFetch('/api/groups'),
  create: (name: string, currency: string) =>
    apiFetch('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name, currency }),
    }),
  get: (id: string) => apiFetch(`/api/groups/${id}`),
  delete: (id: string) => apiFetch(`/api/groups/${id}`, { method: 'DELETE' }),
  join: (token: string) =>
    apiFetch(`/api/groups/join/${token}`, { method: 'POST' }),
};

export const membersApi = {
  add: (groupId: string, name: string) =>
    apiFetch(`/api/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  remove: (groupId: string, memberId: string) =>
    apiFetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    }),
};

export const expensesApi = {
  add: (groupId: string, body: NewExpensePayload) =>
    apiFetch(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  delete: (groupId: string, expenseId: string) =>
    apiFetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),
};
