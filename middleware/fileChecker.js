const { makeJsonResponse } = require("../utils/response");
module.exports = {
  isFileExist: (req, res, next) => {
    console.log(['***********************isfile exist <start>*********************************'])
    console.log(req);
    console.log(['***********************isfile exist <end>*********************************'])
    const httpStatusCode = 403;
    if (!req.file) {
      const response = makeJsonResponse("No file selected", {}, {}, 403, false);
      return res.status(httpStatusCode).json(response);
    }
    next();
  },
  isFilesExist: (req, res, next) => {
    const httpStatusCode = 403;
    if (!req.files || req.files.length == 0) {
      const response = makeJsonResponse("No files selected", {}, {}, 403, false);
      return res.status(httpStatusCode).json(response);
    }
    next();
  },
};
