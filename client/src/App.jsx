import { useCallback, useEffect, useState } from 'react';
import {
  clearAllTodos,
  clearCompletedTodos,
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
} from './api.js';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await fetchTodos();
    setTodos(data);
  }, []);

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      setError('');
      await createTodo(trimmed);
      setTitle('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleCompleted(todo, completed) {
    try {
      setError('');
      await updateTodo(todo.id, { completed });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      setError('');
      await deleteTodo(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearCompleted() {
    try {
      setError('');
      await clearCompletedTodos();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearAll() {
    if (!window.confirm('Delete all todos?')) return;
    try {
      setError('');
      await clearAllTodos();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const active = todos.filter((t) => !t.completed).length;
  const hasCompleted = todos.some((t) => t.completed);

  return (
    <main className="app">
      <header className="header">
        <h1>Todo</h1>
        <p className="subtitle">Express + React + JSON file storage</p>
      </header>

      <form className="add-form" autoComplete="off" onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="What needs to be done?"
          maxLength={500}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {todos.length > 0 && (
        <div className="toolbar">
          <span className="count">
            {active} item{active === 1 ? '' : 's'} left
          </span>
          <div className="toolbar-actions">
            {hasCompleted && (
              <button
                type="button"
                className="link-btn"
                onClick={handleClearCompleted}
              >
                Clear completed
              </button>
            )}
            <button
              type="button"
              className="link-btn danger"
              onClick={handleClearAll}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="empty">Loading…</p>
      ) : (
        <>
          <ul className="todo-list">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={`todo-item${todo.completed ? ' completed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                  onChange={(e) => toggleCompleted(todo, e.target.checked)}
                />
                <span className="todo-title">{todo.title}</span>
                <button
                  type="button"
                  className="todo-delete"
                  onClick={() => handleDelete(todo.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          {todos.length === 0 && (
            <p className="empty">No todos yet. Add one above.</p>
          )}
        </>
      )}
    </main>
  );
}
