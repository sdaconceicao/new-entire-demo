export async function api(path, options = {}) {
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

export function fetchTodos() {
  return api('/api/todos');
}

export function createTodo(title) {
  return api('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function updateTodo(id, body) {
  return api(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteTodo(id) {
  return api(`/api/todos/${id}`, { method: 'DELETE' });
}

export function clearCompletedTodos() {
  return api('/api/todos?completed=true', { method: 'DELETE' });
}

export function clearAllTodos() {
  return api('/api/todos', { method: 'DELETE' });
}
