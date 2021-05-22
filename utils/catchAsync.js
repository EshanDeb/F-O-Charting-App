const catchAsync = func => (req, res, next) => {
    return Promise
        .resolve(func(req, res, next))
        .catch(next);
};

module.exports = catchAsync;
