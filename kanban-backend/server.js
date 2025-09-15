const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
fs.ensureDirSync(path.dirname(DATA_FILE));

// Initialize data file if it doesn't exist
const initializeDataFile = async () => {
  const exists = await fs.pathExists(DATA_FILE);
  if (!exists) {
    const initialData = {
      tasks: {
        'task-1': {
          id: 'task-1',
          title: 'Welcome to your Kanban Board!',
          description: 'Drag me to different columns or edit me by clicking!',
          createdAt: new Date().toISOString()
        }
      },
      columns: {
        'todo': {
          id: 'todo',
          title: 'To Do',
          taskIds: ['task-1']
        },
        'inprogress': {
          id: 'inprogress', 
          title: 'In Progress',
          taskIds: []
        },
        'done': {
          id: 'done',
          title: 'Done',
          taskIds: []
        }
      },
      columnOrder: ['todo', 'inprogress', 'done'],
      history: []
    };
    await fs.writeJson(DATA_FILE, initialData, { spaces: 2 });
  }
};

// Helper functions
const readData = async () => {
  try {
    return await fs.readJson(DATA_FILE);
  } catch (error) {
    console.error('Error reading data:', error);
    return null;
  }
};

const writeData = async (data) => {
  try {
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
};

const addToHistory = (data, action) => {
  if (!data.history) data.history = [];
  data.history.unshift({
    id: uuidv4(),
    action,
    timestamp: new Date().toISOString()
  });
  // Keep only last 5 actions
  data.history = data.history.slice(0, 5);
};

// Routes

// Get all data
app.get('/api/board', async (req, res) => {
  const data = await readData();
  if (!data) {
    return res.status(500).json({ error: 'Failed to read board data' });
  }
  res.json(data);
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const data = await readData();
  if (!data) {
    return res.status(500).json({ error: 'Failed to read board data' });
  }

  const taskId = uuidv4();
  const newTask = {
    id: taskId,
    title,
    description: description || '',
    createdAt: new Date().toISOString()
  };

  data.tasks[taskId] = newTask;
  data.columns.todo.taskIds.push(taskId);
  
  addToHistory(data, `Created task: "${title}"`);

  const success = await writeData(data);
  if (!success) {
    return res.status(500).json({ error: 'Failed to save task' });
  }

  res.status(201).json(newTask);
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const data = await readData();
  if (!data || !data.tasks[id]) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const oldTitle = data.tasks[id].title;
  data.tasks[id].title = title || data.tasks[id].title;
  data.tasks[id].description = description !== undefined ? description : data.tasks[id].description;
  
  addToHistory(data, `Updated task: "${oldTitle}" → "${data.tasks[id].title}"`);

  const success = await writeData(data);
  if (!success) {
    return res.status(500).json({ error: 'Failed to update task' });
  }

  res.json(data.tasks[id]);
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  const data = await readData();
  if (!data || !data.tasks[id]) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const taskTitle = data.tasks[id].title;
  
  // Remove task from all columns
  Object.values(data.columns).forEach(column => {
    column.taskIds = column.taskIds.filter(taskId => taskId !== id);
  });

  delete data.tasks[id];
  
  addToHistory(data, `Deleted task: "${taskTitle}"`);

  const success = await writeData(data);
  if (!success) {
    return res.status(500).json({ error: 'Failed to delete task' });
  }

  res.status(204).send();
});

// Move task between columns
app.post('/api/tasks/:id/move', async (req, res) => {
  const { id } = req.params;
  const { sourceColumnId, destColumnId, sourceIndex, destIndex } = req.body;

  const data = await readData();
  if (!data || !data.tasks[id]) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const sourceColumn = data.columns[sourceColumnId];
  const destColumn = data.columns[destColumnId];

  if (!sourceColumn || !destColumn) {
    return res.status(400).json({ error: 'Invalid column' });
  }

  // Remove from source
  sourceColumn.taskIds.splice(sourceIndex, 1);

  // Add to destination
  destColumn.taskIds.splice(destIndex, 0, id);

  const taskTitle = data.tasks[id].title;
  if (sourceColumnId !== destColumnId) {
    addToHistory(data, `Moved "${taskTitle}" from ${sourceColumn.title} to ${destColumn.title}`);
  }

  const success = await writeData(data);
  if (!success) {
    return res.status(500).json({ error: 'Failed to move task' });
  }

  res.json({ success: true });
});

// Get task history
app.get('/api/history', async (req, res) => {
  const data = await readData();
  if (!data) {
    return res.status(500).json({ error: 'Failed to read board data' });
  }
  res.json(data.history || []);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize and start server
initializeDataFile().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
  });
}).catch(error => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});