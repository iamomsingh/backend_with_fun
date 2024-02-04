const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

//*************************Another way to write async handler********************************** */
// steps by step to create higher orer fn.
// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {};
// const asyncHandler = (func) => async () => {};

// using try catch methods.
const asyncHandlers = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    res.status(err.code || 500).json({
      success: false,
      message: err.message,
    });
  }
};
