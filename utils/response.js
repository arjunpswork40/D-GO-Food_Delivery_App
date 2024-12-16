module.exports = {
  makeJsonResponse: (message, data = {}, errors = {}, statusCode, success = true, extraFlags = {}) => {
    return {
      statusCode,
      message,
      data,
      errors,
      success,
      extraFlags,
    };
  },
};
