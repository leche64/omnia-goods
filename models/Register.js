const mongoose = require("mongoose");

const registerSchema = new mongoose.Schema(
  {
    mobilePhoneNumber: {
      type: String,
      required: true,
      unique: true,
      dropDups: true,
    },
    referralCode: {
      type: String,
      required: false,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    birthday: {
      type: String,
      required: true,
    },
    emailAddress: {
      type: String,
      required: true,
      unique: true,
      dropDups: true,
    },
    streetAddress: {
      type: String,
      required: true,
    },
    apt: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Register", registerSchema);
