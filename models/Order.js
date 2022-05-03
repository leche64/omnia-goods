const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderContact: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    orderProducts: {
      type: Array,
      required: false,
    },
    paymentId: {
      type: String,
      required: false,
    },
    receiptUrl: {
      type: String,
      required: true,
    },
    totalTax: {
      type: String,
      required: true,
    },
    totalDelivery: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: String,
      required: true,
    },
    orderStatus: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
