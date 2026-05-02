const express = require('express');
const { body } = require('express-validator');
const {
  getTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', getTasks);

// POST /api/projects/:projectId/tasks
router.post(
  '/projects/:projectId/tasks',
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  ],
  createTask
);

// PUT /api/tasks/:id
router.put(
  '/tasks/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('status').optional().isIn(['pending', 'completed']).withMessage('Invalid status'),
    body('dueDate').optional({ nullable: true }),
  ],
  updateTask
);

// PUT /api/tasks/:id/toggle
router.put('/tasks/:id/toggle', toggleTask);

// DELETE /api/tasks/:id
router.delete('/tasks/:id', deleteTask);

module.exports = router;
