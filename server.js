const path = require('path');
const { createApp } = require('./createApp');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');

const { app, ensureDataFile } = createApp({ dataFile: DATA_FILE });

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
