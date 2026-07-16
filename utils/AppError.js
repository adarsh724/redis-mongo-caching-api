// utils/AppError.js
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // marks this as a known, expected error (vs a real bug)
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;