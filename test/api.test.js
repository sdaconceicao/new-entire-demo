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
});
