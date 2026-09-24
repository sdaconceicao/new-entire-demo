const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, '[]', 'utf8');
  }
}

async function readTodos() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeTodos(todos) {
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf8');
}

function nextId(todos) {
  const max = todos.reduce((m, t) => Math.max(m, t.id), 0);
  return max + 1;
}

app.get('/api/todos', async (_req, res) => {
  try {
    const todos = await readTodos();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load todos' });
  }
});

app.post('/api/todos', async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const todos = await readTodos();
    const todo = {
      id: nextId(todos),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    todos.push(todo);
    await writeTodos(todos);
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.patch('/api/todos/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const todos = await readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const todo = todos[index];
    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      todo.title = title;
    }
    if (req.body.completed !== undefined) {
      todo.completed = Boolean(req.body.completed);
    }

    await writeTodos(todos);
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const todos = await readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    todos.splice(index, 1);
    await writeTodos(todos);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.delete('/api/todos', async (req, res) => {
  const completedOnly = req.query.completed === 'true';
  try {
    let todos = await readTodos();
    if (completedOnly) {
      todos = todos.filter((t) => !t.completed);
    } else {
      todos = [];
    }
    await writeTodos(todos);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear todos' });
  }
});

ensureDataFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Todo app running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
