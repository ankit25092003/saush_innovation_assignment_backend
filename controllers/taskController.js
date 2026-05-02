const { validationResult } = require('express-validator');
const { Task, Project } = require('../models');

/**
 * GET /api/projects/:projectId/tasks
 * List all tasks for a project
 * Supports: ?status=pending|completed, ?search=keyword
 */
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, search } = req.query;

    // Verify project belongs to user
    const project = await Project.findOne({
      where: { id: projectId, userId: req.user.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const where = { projectId };

    if (status && ['pending', 'completed'].includes(status)) {
      where.status = status;
    }

    if (search) {
      const { Op } = require('sequelize');
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const tasks = await Task.findAll({
      where,
      order: [
        ['status', 'ASC'], // pending first
        ['dueDate', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects/:projectId/tasks
 * Create a new task
 */
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await Project.findOne({
      where: { id: projectId, userId: req.user.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const { title, dueDate } = req.body;

    const task = await Task.create({
      title,
      dueDate: dueDate || null,
      projectId,
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tasks/:id
 * Update a task (title, status, dueDate)
 */
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Project, as: 'project' }],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    // Verify ownership
    if (task.project.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized.',
      });
    }

    const { title, status, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tasks/:id/toggle
 * Toggle task complete/incomplete
 */
const toggleTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Project, as: 'project' }],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    if (task.project.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized.',
      });
    }

    task.status = task.status === 'completed' ? 'pending' : 'completed';
    await task.save();

    res.json({
      success: true,
      message: `Task marked as ${task.status}.`,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Project, as: 'project' }],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    if (task.project.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized.',
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
};
