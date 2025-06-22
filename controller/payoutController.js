const User = require("../models/user-model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.processBiWeeklyPayouts = async () => {
  const deliveryPartners = await User.find({ role: "delivery-partner" });

  for (const partner of deliveryPartners) {
    const unpaidDeliveries = partner.deliveryPartnerDetails.deliveries.filter(d => !d.paid && d.status === "completed");
    const amount = unpaidDeliveries.length * 2;

    if (amount > 0) {
      try {
        const transfer = await stripe.transfers.create({
          amount: amount * 100, // convert to cents
          currency: "eur",
          destination: partner.bankDetails.stripeAccountId,
        });

        // mark as paid
        unpaidDeliveries.forEach(d => d.paid = true);
        await partner.save();
      } catch (err) {
        console.error("Payout Failed:", err);
        partner.failedPayouts.push({
          date: new Date(),
          amount,
          reason: err.message,
        });
        await partner.save();
      }
    }
  }
};
