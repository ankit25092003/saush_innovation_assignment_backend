const { validationResult } = require('express-validator');
const { Project, Task } = require('../models');

/**
 * GET /api/projects
 * List all projects for the authenticated user
 * Supports: ?search=keyword, ?page=1&limit=10
 */
const getProjects = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };

    if (search) {
      const { Op } = require('sequelize');
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      include: [
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'title', 'status', 'dueDate'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Get a single project with its tasks
 */
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Task,
          as: 'tasks',
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects
 * Create a new project
 */
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      userId: req.user.id,
    });

    // Reload with tasks association (empty initially)
    const fullProject = await Project.findByPk(project.id, {
      include: [{ model: Task, as: 'tasks' }],
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { project: fullProject },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/projects/:id
 * Update a project
 */
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const { title, description } = req.body;
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    await project.save();

    // Return with tasks
    const fullProject = await Project.findByPk(project.id, {
      include: [{ model: Task, as: 'tasks' }],
    });

    res.json({
      success: true,
      message: 'Project updated successfully.',
      data: { project: fullProject },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id
 * Delete a project and its tasks
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    await project.destroy();

    res.json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
