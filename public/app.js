const listEl = document.getElementById('todo-list');
const formEl = document.getElementById('add-form');
const inputEl = document.getElementById('title-input');
const emptyEl = document.getElementById('empty');
const errorEl = document.getElementById('error');
const toolbarEl = document.querySelector('.toolbar');
const countEl = document.getElementById('count');
const clearCompletedEl = document.getElementById('clear-completed');
const clearAllEl = document.getElementById('clear-all');

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function render(todos) {
  listEl.innerHTML = '';
  const active = todos.filter((t) => !t.completed).length;
  const hasCompleted = todos.some((t) => t.completed);

  emptyEl.hidden = todos.length > 0;
  toolbarEl.hidden = todos.length === 0;
  countEl.textContent =
    todos.length === 0
      ? ''
      : `${active} item${active === 1 ? '' : 's'} left`;
  clearCompletedEl.hidden = !hasCompleted;

  for (const todo of todos) {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;
    li.dataset.id = String(todo.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`);

    const title = document.createElement('span');
    title.className = 'todo-title';
    title.textContent = todo.title;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'todo-delete';
    del.textContent = 'Delete';

    checkbox.addEventListener('change', async () => {
      try {
        showError('');
        await api(`/api/todos/${todo.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: checkbox.checked }),
        });
        await load();
      } catch (err) {
        checkbox.checked = !checkbox.checked;
        showError(err.message);
      }
    });

    del.addEventListener('click', async () => {
      try {
        showError('');
        await api(`/api/todos/${todo.id}`, { method: 'DELETE' });
        await load();
      } catch (err) {
        showError(err.message);
      }
    });

    li.append(checkbox, title, del);
    listEl.appendChild(li);
  }
}

async function load() {
  const todos = await api('/api/todos');
  render(todos);
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = inputEl.value.trim();
  if (!title) return;
  try {
    showError('');
    await api('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    inputEl.value = '';
    await load();
    inputEl.focus();
  } catch (err) {
    showError(err.message);
  }
});

clearCompletedEl.addEventListener('click', async () => {
  try {
    showError('');
    await api('/api/todos?completed=true', { method: 'DELETE' });
    await load();
  } catch (err) {
    showError(err.message);
  }
});

clearAllEl.addEventListener('click', async () => {
  if (!confirm('Delete all todos?')) return;
  try {
    showError('');
    await api('/api/todos', { method: 'DELETE' });
    await load();
  } catch (err) {
    showError(err.message);
  }
});

load().catch((err) => showError(err.message));
