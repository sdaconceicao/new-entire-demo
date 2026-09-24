# Express Todo

A small to-do list with an Express REST API and a React UI (Vite). Todos persist in `data/todos.json`.

## Run

```bash
npm install
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Development

In one terminal, start the API (auto-restart on file changes, Node 18+):

```bash
npm run dev
```

In another, run the React dev server with hot reload (proxies `/api` to port 3000):

```bash
npm run dev:ui
```

Open [http://localhost:5173](http://localhost:5173).

## Tests

```bash
npm test
```

Uses Node’s built-in test runner plus Supertest against a temporary data file.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/todos` | List all todos |
| `POST` | `/api/todos` | Create `{ "title": "..." }` |
| `PATCH` | `/api/todos/:id` | Update `{ "title"?, "completed"? }` |
| `DELETE` | `/api/todos/:id` | Remove one todo |
| `DELETE` | `/api/todos?completed=true` | Remove completed todos |
| `DELETE` | `/api/todos` | Remove all todos |
