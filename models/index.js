const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');

// User -> Projects (one-to-many)
User.hasMany(Project, {
  foreignKey: 'userId',
  as: 'projects',
  onDelete: 'CASCADE',
});
Project.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Project -> Tasks (one-to-many)
Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'tasks',
  onDelete: 'CASCADE',
});
Task.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

module.exports = { User, Project, Task };
