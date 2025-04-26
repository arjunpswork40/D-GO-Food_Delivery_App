const ORDER_STATUS = {
    CUSTOMER_PLACED_ORDER : 'customer_placed_order',
    OWNER_STARTED_PREPARATION : 'owner_started_preparation',
    DELIVERY_PARTNER_ACCEPTED_ORDER : 'delivery_partner_accepted_order',
    DELIVERY_PARTNER_REJECTED_ORDER : 'delivery_partner_rejected_order',
    OWNER_COMPLETED_THE_PREPARATION : 'owner_completed_the_preparation',
    DELIVERY_PARTNER_PICKED_UP_THE_ORDER : 'delivery_partner_picked_up_the_order',
    OTP_VERIFIED_AND_COMPLETED_THE_ORDER : 'OTP_verified_and_completed_the_order',
    ORDER_CANCELLED : 'order_cancelled',
    PAYOUT_COMPLETED : 'completed',
    PAYOUT_PENDING : 'pending',
}

module.exports = { ORDER_STATUS };