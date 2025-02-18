const { makeJsonResponse } = require("../utils/response")
const {USER_TYPES} = require("../constants/user/user-constants")
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

class payment {
    static async createPaymentIntent(req, res, next) {
        try{
            const { amount, currency } = req.body;
            console.log(req.body)
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
                payment_method_types: ["card"],
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
}

module.exports = payment
