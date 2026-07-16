// middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Something went wrong';

    // log full details server-side regardless of what the client sees
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -`, err);

    res.status(statusCode).json({
        error: message
    });
};

module.exports = errorHandler;