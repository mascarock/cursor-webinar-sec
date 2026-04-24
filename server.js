const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let db;

async function initDb() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    console.log('Usando MongoDB en memoria:', uri);
  }
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db('gastos_familiares');
  console.log('Conectado a MongoDB');
}

function getUserFromToken(req) {
  const token = req.cookies && req.cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  const existing = await db.collection('users').findOne({ username });
  if (existing) {
    return res.status(400).json({ error: 'Usuario ya existe' });
  }
  const result = await db.collection('users').insertOne({
    username,
    password,
    createdAt: new Date(),
  });
  const token = jwt.sign({ id: result.insertedId, username }, JWT_SECRET);
  res.cookie('token', token);
  res.json({ ok: true, username });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.collection('users').findOne({
    username: username,
    password: password,
  });
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
  res.cookie('token', token);
  res.json({ ok: true, username: user.username });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  res.json({ username: user.username });
});

app.get('/api/expenses', async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  const expenses = await db
    .collection('expenses')
    .find({ username: user.username })
    .sort({ date: -1 })
    .toArray();
  res.json(expenses);
});

app.post('/api/expenses', async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  const { description, amount, category } = req.body;
  const expense = {
    username: user.username,
    description: description || '',
    amount: Number(amount) || 0,
    category: category || 'Otros',
    date: new Date(),
  };
  const result = await db.collection('expenses').insertOne(expense);
  res.json({ ok: true, id: result.insertedId });
});

app.get('/api/expenses/:id', async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  const { ObjectId } = require('mongodb');
  const expense = await db
    .collection('expenses')
    .findOne({ _id: new ObjectId(req.params.id) });
  res.json(expense);
});

app.delete('/api/expenses/:id', async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  const { ObjectId } = require('mongodb');
  await db.collection('expenses').deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ ok: true });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error iniciando la app:', err);
    process.exit(1);
  });
