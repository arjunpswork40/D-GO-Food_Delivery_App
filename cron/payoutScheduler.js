const cron = require("node-cron");
const payoutController = require("../controller/payoutController");

// Runs every Saturday at 10:00 AM
cron.schedule("0 10 * * 6", async () => {
  const today = new Date();
  const day = today.getDate();

  if (isSecondOrFourthSaturday(today)) {
    console.log("Running Bi-weekly payout...");
    await payoutController.processBiWeeklyPayouts();
  }
});

function isSecondOrFourthSaturday(date) {
  if (date.getDay() !== 6) return false; // not Saturday
  const day = date.getDate();

  // Get how many Saturdays are there till today
  let count = 0;
  for (let i = 1; i <= day; i++) {
    const d = new Date(date.getFullYear(), date.getMonth(), i);
    if (d.getDay() === 6) count++;
  }
  return count === 2 || count === 4;
}
