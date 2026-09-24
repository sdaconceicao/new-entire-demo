# Express Todo

A small to-do list with an Express REST API and a browser UI. Todos persist in `data/todos.json`.

## Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

For auto-restart on file changes (Node 18+):

```bash
npm run dev
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/todos` | List all todos |
| `POST` | `/api/todos` | Create `{ "title": "..." }` |
| `PATCH` | `/api/todos/:id` | Update `{ "title"?, "completed"? }` |
| `DELETE` | `/api/todos/:id` | Remove one todo |
| `DELETE` | `/api/todos?completed=true` | Remove completed todos |
| `DELETE` | `/api/todos` | Remove all todos |
