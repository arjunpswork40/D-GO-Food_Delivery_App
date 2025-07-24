const env = require("dotenv")
env.config()
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const multer = require("multer");
const { PORT } = process.env
const { makeJsonResponse } = require("./utils/response");
const path = require('path');
const Stripe = require("stripe");
const cors = require("cors");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
require("./cron/payoutScheduler");
app.use(cors());
// app.post(
//   "/payment/stripe-payment-status-webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     const sig = req.headers["stripe-signature"];
//     // console.log("🔍 Raw Webhook Body (before verification):", req.body.toString());

//     try {
//       // ✅ Ensure `req.body` is a raw Buffer
//       const event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET
//       );

//       console.log("✅ Webhook Verified Successfully:", event);

//       res.status(200).json({ received: true });
//     } catch (err) {
//       console.error("❌ Webhook Signature Verification Failed:", err.message);
//       res.status(400).send(`Webhook Error: ${err.message}`);
//     }
//   }
// );
app.use(bodyParser.urlencoded({extended: false}))
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.includes("/payment/stripe-payment-status-webhook")) {
        req.rawBody = buf; // Store raw body for Stripe verification
      }
    },
  })
);
// app.use(fileUpload())

app.use("/", require("./routes/index"))
app.use('/uploads/hotel', express.static(path.join(__dirname, 'uploads/hotel')));
app.use('/uploads/food', express.static(path.join(__dirname, 'uploads/food')));
// Route to serve an HTML file
app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy-policy.html"));
});


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