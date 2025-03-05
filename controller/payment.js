const { makeJsonResponse } = require("../utils/response")
const {USER_TYPES} = require("../constants/user/user-constants")
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

class payment {
    static async createPaymentIntent1(req, res, next) {
        try{
            const { amount, currency } = req.body;
            console.log(req.body)
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
                payment_method_types: ["card"],
                confirmation_method: "manual",
                confirm: true, 
            });
    
    
          return res.status(200).json(
              makeJsonResponse(
                'Payment entry created successfuly.',
                  {
                    paymentIntent
                  },
                  {},
                  200,
                  true
              )
          );
          
        } catch(error) {
          console.error(`Error createPaymentIntent (controller function): ${error.code || ''} - ${error.message}`);
          return res.status(500).json(
            makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
          );
        }
      }

      static async createPaymentIntent(req, res, next) {
        try {
            const { amount, currency } = req.body;
            console.log(req.body);
    
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
                payment_method_types: ["card"],
                confirmation_method: "manual", // Manual confirmation
            });
    
            return res.status(200).json(
                makeJsonResponse(
                    'Payment Intent created successfully.',
                    { client_secret: paymentIntent.client_secret, payment_intent_id: paymentIntent.id },
                    {},
                    200,
                    true
                )
            );
    
        } catch (error) {
            console.error(`Error createPaymentIntent: ${error.code || ''} - ${error.message}`);
            return res.status(500).json(
                makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
            );
        }
    }

    static async confirmPayment(req, res, next) {
      try {
          const { payment_intent_id, payment_method_id } = req.body;
  
          const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id, {
              payment_method: payment_method_id,
          });
  
          return res.status(200).json(
              makeJsonResponse(
                  'Payment confirmed successfully.',
                  { paymentIntent },
                  {},
                  200,
                  true
              )
          );
  
      } catch (error) {
          console.error(`Error confirmPayment: ${error.code || ''} - ${error.message}`);
          return res.status(500).json(
              makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
          );
      }
  }

  static async handleStripeWebhook1(req, res, next) {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
        case "payment_intent.succeeded":
            console.log("✅ Payment Successful:", event.data.object.id);
            break;

        case "payment_intent.payment_failed":
            console.log("❌ Payment Failed:", event.data.object.last_payment_error.message);
            break;

        case "payment_intent.requires_action":
            console.log("⚠️ 3D Secure Authentication Required:", event.data.object.id);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
  static async handleStripeWebhook(req, res, next) {
    const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    console.log("✅ Webhook Verified Successfully!", event);

    // Handle the event types
    switch (event.type) {
      case "payment_intent.succeeded":
        // console.log("✅ Payment was successful!", event.data.object);
        console.log("✅ Payment was successful!");

        break;
      case "payment_intent.payment_failed":
        // console.log("❌ Payment failed!", event.data.object);
        console.log("❌ Payment failed!");
      case "payment_intent.created":
        // console.log("❌ Payment failed!", event.data.object);
        console.log("CREATED!");
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook Signature Verification Failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}

}

module.exports = payment
