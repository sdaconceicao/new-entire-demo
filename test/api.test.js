const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const request = require('supertest');
const { createApp } = require('../createApp');

describe('todo API', () => {
  let dataFile;
  let app;

  before(async () => {
    dataFile = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'todo-test-')), 'todos.json');
    const created = createApp({ dataFile });
    app = created.app;
    await created.ensureDataFile();
  });

  after(async () => {
    await fs.rm(path.dirname(dataFile), { recursive: true, force: true });
  });

  beforeEach(async () => {
    await fs.writeFile(dataFile, '[]', 'utf8');
  });

  it('GET /api/todos returns empty array initially', async () => {
    const res = await request(app).get('/api/todos');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });

  it('POST /api/todos creates a todo', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Buy milk' });
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Buy milk');
    assert.equal(res.body.completed, false);
    assert.equal(res.body.id, 1);
    assert.match(res.body.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('POST /api/todos rejects empty title', async () => {
    const res = await request(app).post('/api/todos').send({ title: '   ' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Title is required');
  });

  it('POST /api/todos rejects missing or non-string title', async () => {
    const missing = await request(app).post('/api/todos').send({});
    assert.equal(missing.status, 400);

    const number = await request(app).post('/api/todos').send({ title: 42 });
    assert.equal(number.status, 400);
  });

  it('POST /api/todos trims whitespace from title', async () => {
    const res = await request(app).post('/api/todos').send({ title: '  Trim me  ' });
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Trim me');
  });

  it('POST /api/todos assigns ids from max existing id, not list length', async () => {
    await fs.writeFile(
      dataFile,
      JSON.stringify([
        { id: 10, title: 'Legacy', completed: false, createdAt: '2020-01-01T00:00:00.000Z' },
      ]),
      'utf8'
    );

    const created = await request(app).post('/api/todos').send({ title: 'New' });
    assert.equal(created.body.id, 11);
  });

  it('PATCH /api/todos/:id toggles completion and renames', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Task' });
    const id = created.body.id;

    const patched = await request(app)
      .patch(`/api/todos/${id}`)
      .send({ completed: true, title: 'Done task' });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.completed, true);
    assert.equal(patched.body.title, 'Done task');

    const list = await request(app).get('/api/todos');
    assert.equal(list.body[0].completed, true);
  });

  it('PATCH /api/todos/:id returns 404 for missing todo', async () => {
    const res = await request(app).patch('/api/todos/99').send({ completed: true });
    assert.equal(res.status, 404);
  });

  it('PATCH /api/todos/:id returns 400 for invalid id', async () => {
    const res = await request(app).patch('/api/todos/nope').send({ completed: true });
    assert.equal(res.status, 400);
  });

  it('PATCH /api/todos/:id rejects empty title', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Keep' });
    const res = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .send({ title: '   ' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Title cannot be empty');
  });

  it('PATCH /api/todos/:id can mark incomplete without changing title', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Revert' });
    await request(app).patch(`/api/todos/${created.body.id}`).send({ completed: true });

    const res = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .send({ completed: false });
    assert.equal(res.status, 200);
    assert.equal(res.body.completed, false);
    assert.equal(res.body.title, 'Revert');
  });

  it('PATCH /api/todos/:id with empty body leaves todo unchanged', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Stable' });
    const res = await request(app).patch(`/api/todos/${created.body.id}`).send({});
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, created.body);
  });

  it('DELETE /api/todos/:id removes one todo', async () => {
    const a = await request(app).post('/api/todos').send({ title: 'A' });
    await request(app).post('/api/todos').send({ title: 'B' });

    const del = await request(app).delete(`/api/todos/${a.body.id}`);
    assert.equal(del.status, 204);

    const list = await request(app).get('/api/todos');
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].title, 'B');
  });

  it('DELETE /api/todos?completed=true clears only completed', async () => {
    const t1 = await request(app).post('/api/todos').send({ title: 'Open' });
    const t2 = await request(app).post('/api/todos').send({ title: 'Done' });
    await request(app).patch(`/api/todos/${t2.body.id}`).send({ completed: true });

    await request(app).delete('/api/todos?completed=true').expect(204);

    const list = await request(app).get('/api/todos');
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].id, t1.body.id);
  });

  it('DELETE /api/todos clears all todos', async () => {
    await request(app).post('/api/todos').send({ title: 'One' });
    await request(app).delete('/api/todos').expect(204);
    const list = await request(app).get('/api/todos');
    assert.deepEqual(list.body, []);
  });

  it('DELETE /api/todos/:id returns 404 for missing todo', async () => {
    const res = await request(app).delete('/api/todos/404');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Todo not found');
  });

  it('DELETE /api/todos/:id returns 400 for invalid id', async () => {
    const res = await request(app).delete('/api/todos/abc');
    assert.equal(res.status, 400);
  });

  it('DELETE /api/todos?completed=true with no completed todos keeps all', async () => {
    await request(app).post('/api/todos').send({ title: 'Still here' });
    await request(app).delete('/api/todos?completed=true').expect(204);
    const list = await request(app).get('/api/todos');
    assert.equal(list.body.length, 1);
  });

  it('DELETE /api/todos without query clears even when completed=true in body', async () => {
    const t = await request(app).post('/api/todos').send({ title: 'Gone' });
    await request(app).patch(`/api/todos/${t.body.id}`).send({ completed: true });
    await request(app).delete('/api/todos?completed=false').expect(204);
    const list = await request(app).get('/api/todos');
    assert.deepEqual(list.body, []);
  });

  it('GET /api/todos returns 500 when data file is invalid JSON', async () => {
    await fs.writeFile(dataFile, 'not-json', 'utf8');
    const res = await request(app).get('/api/todos');
    assert.equal(res.status, 500);
    assert.equal(res.body.error, 'Failed to load todos');
  });

  it('GET /api/todos reads todos persisted on disk', async () => {
    const seed = [
      { id: 7, title: 'Seeded', completed: true, createdAt: '2020-01-01T00:00:00.000Z' },
    ];
    await fs.writeFile(dataFile, JSON.stringify(seed), 'utf8');
    const res = await request(app).get('/api/todos');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, seed);
  });

  it('serves the static index page', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.match(res.text, /<title>Todo<\/title>/);
    assert.match(res.text, /id="root"/);
  });
});

describe('ensureDataFile', () => {
  it('creates data file and parent directory when missing', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'todo-ensure-'));
    const dataFile = path.join(dir, 'nested', 'todos.json');
    const { app, ensureDataFile } = createApp({ dataFile });

    await ensureDataFile();
    const raw = await fs.readFile(dataFile, 'utf8');
    assert.equal(raw, '[]');

    const res = await request(app).get('/api/todos');
    assert.deepEqual(res.body, []);

    await fs.rm(dir, { recursive: true, force: true });
  });
});
