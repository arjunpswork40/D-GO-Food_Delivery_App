const { makeJsonResponse } = require("../utils/response")
const { USER_TYPES } = require("../constants/user/user-constants")
const Stripe = require("stripe");
const userModel = require("../models/user-model");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

class payment {
  static async createPaymentIntent1(req, res, next) {
    try {
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

    } catch (error) {
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

  static async createStripeAccount(req, res, next) {
    try {
      const user = req.user;
      if (user.role != USER_TYPES.DELIVERY_PARTNER) {
        return res.status(400).json(
          makeJsonResponse('Bad Request', {}, { message: "You are not authorized to create a Stripe account" }, 400, false)
        );
      }

      const userData = await userModel.findById(user._id).select("email").lean();
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'PT', // Portugal
        email: userData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      if (account) {
        
        const stripeAccountId = account.id;
        await userModel.findByIdAndUpdate(user._id, { "bankDetails.stripeAccountId": stripeAccountId }, { new: true });
      }

      return res.status(200).json(
        makeJsonResponse(
          'Stripe account created successfully.',
          { account },
          {},
          200,
          true
        )
      );

    } catch (error) {
      console.error(`Error createStripeAccount: ${error.code || ''} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
      );
    }
  }
  static async createStripeAccountLink(req, res, next) {
    try {
      const { stripAccountId } = req.body;
      const accountLink = await stripe.accountLinks.create({
        account: stripAccountId,
        refresh_url: "https://example.com/reauth",
        return_url: "https://example.com/return",
        type: "account_onboarding",
      });

      return res.status(200).json(
        makeJsonResponse(
          'Stripe account link created successfully.',
          { url: accountLink.url },
          {},
          200,
          true
        )
      );

    } catch (error) {
      console.error(`Error createStripeAccountLink: ${error.code || ''} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
      );
    }
  }

  static async getStripeAccountDetails(req, res, next) {
    try {
      const user = req.user;

      if (user.role != USER_TYPES.DELIVERY_PARTNER) {
        return res.status(400).json(
          makeJsonResponse('Bad Request', {}, { message: "You are not authorized to access this resource" }, 400, false)
        );
      }

      const userBankData = await userModel.findById(user._id).select("bankDetails").lean();

      const stripeAccountId = userBankData.bankDetails.stripeAccountId;
      if (!stripeAccountId) {
        return res.status(400).json(
          makeJsonResponse('Bad Request', {}, { message: "Stripe account ID not found" }, 400, false)
        );
      }

      const account = await stripe.accounts.retrieve(stripeAccountId);

      const relevantAccountDetails = {
        id: account.id,
        type: account.type,
        business_profile: {
          name: account.business_profile.name,
          url: account.business_profile.url,
        },
        business_type: account.business_type,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        individual: account.individual
          ? {
          email: account.individual.email,
          first_name: account.individual.first_name,
          last_name: account.individual.last_name,
          account: account.individual.account,
        }
          : null,
        external_accounts: account.external_accounts.data.map((item) => ({
            id: item.id,
            account_holder_name: item.account_holder_name,
            last4: item.last4,
            country: item.country,
            exp_month: item.exp_month,
            exp_year: item.exp_year,
            bank_name: item.bank_name,
            country: item.country,
            currency: item.currency,
            default_for_currency: item.default_for_currency,
          })),
      };

      return res.status(200).json(
        makeJsonResponse(
          'Stripe account details retrieved successfully.',
          { relevantAccountDetails },
          {},
          200,
          true
        )
      );

    } catch (error) {
      console.error(`Error getStripeAccountDetails: ${error.code || ''} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
      );
    }
  }

  static async getStripeAccountUpdateLink(req, res, next) {
    try {

      const user = req.user;
      if (user.role != USER_TYPES.DELIVERY_PARTNER) {
        return res.status(400).json(
          makeJsonResponse('Bad Request', {}, { message: "You are not authorized to access this resource" }, 400, false)
        );
      }
      const userBankData = await userModel.findById(user._id).select("bankDetails").lean();

      const accountLink = await stripe.accountLinks.create({
        account: userBankData.bankDetails.stripeAccountId,
        refresh_url: "https://example.com/reauth",
        return_url: "https://example.com/return",
        type: "account_onboarding",
      });

      return res.status(200).json(
        makeJsonResponse(
          'Stripe account update link created successfully.',
          { url: accountLink.url },
          {},
          200,
          true
        )
      );

    } catch (error) {
      console.error(`Error createStripeAccountLink: ${error.code || ''} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
      );
    }
  }

  static async deleteStripeAccount(req, res, next) {
    try {
      const user = req.user;
      if (user.role != USER_TYPES.DELIVERY_PARTNER) {
        return res.status(400).json(
          makeJsonResponse('Bad Request', {}, { message: "You are not authorized to delete this account" }, 400, false)
        );
      }

      const userBankData = await userModel.findById(user._id).select("bankDetails").lean();
      const stripeAccountId = userBankData.bankDetails.stripeAccountId;

      if (!stripeAccountId) {
        return res.status(400).json(
          makeJsonResponse('Bad Request', {}, { message: "Stripe account ID not found" }, 400, false)
        );
      }

      const response = await stripe.accounts.del(stripeAccountId);

      return res.status(200).json(
        makeJsonResponse(
          'Stripe account deleted successfully.',
          {response},
          {},
          200,
          true
        )
      );

    } catch (error) {
      console.error(`Error deleteStripeAccount: ${error.code || ''} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
      );
    }
  }
  static async getStripeAccountBalance(req, res, next) {
    try {
      const user = req.user;
      if (user.role != USER_TYPES.DELIVERY_PARTNER) {
        return res.status(400).json(
          makeJsonResponse('Bad Request', {}, { message: "You are not authorized to access this resource" }, 400, false)
        );
      }

      const userBankData = await userModel.findById(user._id).select("bankDetails").lean();
      const stripeAccountId = userBankData.bankDetails.stripeAccountId;

      if (!stripeAccountId) {
        return res.status(400).json(
          makeJsonResponse('Bad Request', {}, { message: "Stripe account ID not found" }, 400, false)
        );
      }

      const balance = await stripe.balance.retrieve({ stripeAccount: stripeAccountId });

      return res.status(200).json(
        makeJsonResponse(
          'Stripe account balance retrieved successfully.',
          { balance },
          {},
          200,
          true
        )
      );

    } catch (error) {
      console.error(`Error getStripeAccountBalance: ${error.code || ''} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
      );
    }
  }


}

module.exports = payment
