// utils/catchAsync.js
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next); // any thrown/rejected error goes straight to next()
    };
};

module.exports = catchAsync;