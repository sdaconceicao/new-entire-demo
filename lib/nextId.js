function nextId(todos) {
  const max = todos.reduce((m, t) => Math.max(m, t.id), 0);
  return max + 1;
}

module.exports = { nextId };
