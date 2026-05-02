/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages,
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      errors: messages,
    });
  }

  // Express-validator errors
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.array(),
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
