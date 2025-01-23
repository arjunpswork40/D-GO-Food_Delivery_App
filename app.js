const env = require("dotenv")
env.config()
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const multer = require("multer");
const { PORT } = process.env
const { makeJsonResponse } = require("./utils/response");

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
// app.use(fileUpload())

app.use("/", require("./routes/index"))
app.use('/uploads/hotel', express.static(path.join(__dirname, 'uploads/hotel')));

// error handler
app.use((req, res, next) => {
    const response = makeJsonResponse('Not Found', {}, { message: "The requested resource was not found" }, 404, false);
    res.status(404).json(response);
  });
  app.use((err, req, res, next) => {
  const httpStatusCode = err.status || 501;
  
    // Set error details only in development mode
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
  
    // Handle specific multer errors
    if (err instanceof multer.MulterError) {
      console.log("MULTER ERROR " + JSON.stringify(err));
    }


    console.log("OPPP ",err.stack);
    
    // Create a JSON response for the error
    const response = makeJsonResponse(err.message || 'Internal Server Error', {}, {}, httpStatusCode, false);
    res.status(httpStatusCode).json(response);
  });
  
app.listen(PORT, async () => {
    await require("./config/mongodbconfig")()
    console.log(`::> Server listening on port ${ PORT } @ http://localhost:${ PORT }`)
})

module.exports = app
// require("./createNewData")