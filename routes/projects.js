const express = require('express');
const { body } = require('express-validator');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/projects
router.get('/', getProjects);

// GET /api/projects/:id
router.get('/:id', getProject);

// POST /api/projects
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Project title is required'),
    body('description').optional().trim(),
  ],
  createProject
);

// PUT /api/projects/:id
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
  ],
  updateProject
);

// DELETE /api/projects/:id
router.delete('/:id', deleteProject);

module.exports = router;
