const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const { nextId } = require('./lib/nextId');

function createApp({ dataFile }) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  async function ensureDataFile() {
    try {
      await fs.access(dataFile);
    } catch {
      await fs.mkdir(path.dirname(dataFile), { recursive: true });
      await fs.writeFile(dataFile, '[]', 'utf8');
    }
  }

  async function readTodos() {
    const raw = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(raw);
  }

  async function writeTodos(todos) {
    await fs.writeFile(dataFile, JSON.stringify(todos, null, 2), 'utf8');
  }

  app.get('/api/todos', async (_req, res) => {
    try {
      const todos = await readTodos();
      res.json(todos);
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      res.status(500).json({ error: 'Failed to clear todos' });
    }
  });

  return { app, ensureDataFile };
}

module.exports = { createApp };
