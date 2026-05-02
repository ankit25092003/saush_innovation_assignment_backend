const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 255],
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed'),
    defaultValue: 'pending',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Projects',
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

module.exports = Task;
