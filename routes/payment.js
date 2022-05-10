const router = require("express").Router();

const { vary } = require("express/lib/response");
const { ApiError, Client, Environment } = require("square");

const logger = require("./logger");

const verify = require("./verifyToken");

const Order = require("../models/Order");

// micro provides http helpers
const { createError, json, send } = require("micro");
const { nanoid } = require("nanoid");

// async-retry will retry failed API requests
const retry = require("async-retry");

const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const isProduction = process.env.IS_PRODUCTION;
const squareClient = new Client({
  environment: Environment.Sandbox,
  accessToken: squareAccessToken,
});

//TODO verify jwt
router.get("/", (req, res) => {
  res.render("orderTracking");
});

router.post("/createPayment", async (req, res) => {
  const payload = json(req);
  logger.debug(JSON.stringify(payload));
  await retry(async (bail, attempt) => {
    try {
      logger.info("Creating payment", { attempt });

      const idempotencyKey = payload.idempotencyKey || nanoid();

      const finalAmountMoneyCents = req.body.totalAmount * 100;

      const payment = {
        idempotencyKey,
        locationId: req.body.locationId,
        sourceId: req.body.sourceId,
        // While it's tempting to pass this data from the client
        // Doing so allows bad actor to modify these values
        // Instead, leverage Orders to create an order on the server
        // and pass the Order ID to createPayment rather than raw amounts
        // See Orders documentation: https://developer.squareup.com/docs/orders-api/what-it-does
        amountMoney: {
          // the expected amount is in cents, meaning this is $1.00.
          amount: finalAmountMoneyCents,
          // If you are a non-US account, you must change the currency to match the country in which
          // you are accepting the payment.
          currency: "USD",
        },
      };

      if (payload.customerId) {
        payment.customerId = payload.customerId;
      }

      // VerificationDetails is part of Secure Card Authentication.
      // This part of the payload is highly recommended (and required for some countries)
      // for 'unauthenticated' payment methods like Cards.
      if (payload.verificationToken) {
        payment.verificationToken = payload.verificationToken;
      }

      const { result, statusCode } =
        await squareClient.paymentsApi.createPayment(payment);

      if (statusCode === 200) {
        logger.info("Payment succeeded!", { result, statusCode });

        // save order
        // const order = new Order({
        //   orderContact: req.session.phoneNumber,
        //   orderId: result.payment.orderId,
        //   orderProducts: req.session.order,
        //   paymentId: result.payment.id,
        //   receiptUrl: result.payment.receiptUrl,
        //   totalTax: req.body.totalTax,
        //   totalDelivery: req.body.totalDelivery,
        //   totalAmount: req.body.totalAmount,
        //   orderStatus: "CONFIRMED",
        // });
        // const savedOrder = await order
        //   .save()
        //   .then((result) => {
        //     console.log("SUCCESS inserting order entry:" + result);
        //   })
        //   .catch((err) => {
        //     console.log("FAILURE inserting order entry:" + err);
        //   });
        send(res, statusCode, {
          success: true,
          payment: {
            orderId: result.payment.orderId,
            paymentId: result.payment.id,
            status: result.payment.status,
            receiptUrl: result.payment.receiptUrl,
            totalAmount: req.body.totalAmount,
          },
        });
      }
    } catch (ex) {
      if (ex instanceof ApiError) {
        // likely an error in the request. don't retry
        logger.error(ex.errors);
        bail(ex);
      } else {
        // IDEA: send to error reporting service
        logger.error(`Error creating payment on attempt ${attempt}: ${ex}`);
        throw ex; // to attempt retry
      }
    }
  });
});

module.exports = router;
