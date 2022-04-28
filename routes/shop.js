const router = require("express").Router();

const { vary } = require("express/lib/response");
const verify = require("./verifyToken");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require("twilio")(accountSid, authToken);

//TODO verify jwt
router.get("/", (req, res) => {
  res.render("shop");
});

//TODO verify jwt
router.get("/confirm", (req, res) => {
  //res.render("statusPendingDelivery");
  //res.render("statusOutForDelivery");
  res.render("statusDelivered");
});

router.get("/dev", (req, res) => {
  res.render("shop");
});

router.get("/order", (req, res) => {
  res.render("statusPendingDelivery");
});

//TODO verify jwt
router.post("/order", async (req, res) => {
  console.log(req.body.card);
  console.log(req.body.edible);
  console.log(req.body.vape);

  var flowerText = null;
  var edibleText = null;
  var vapeText = null;

  if (req.body.card != null) {
    if (req.body.card == "card_one") {
      flowerText = "Ronin $60";
    } else if (req.body.card == "card_two") {
      flowerText = "Daimyos $110";
    } else if (req.body.card == "card_three") {
      flowerText = "Samurai $200";
    } else if (req.body.card == "card_four") {
      flowerText = "Shogun $360";
    }
  }

  if (req.body.edible != null) {
    if (req.body.edible == "edible_one") {
      edibleText = "Choc Blaze Bar $20";
    } else if (req.body.edible == "edible_two") {
      edibleText = "Gummy Snack Pack $60";
    }
  }

  if (req.body.vape != null) {
    if (req.body.vape == "vape_one") {
      vapeText = "Pre-Roll $20";
    } else if (req.body.vape == "vape_two") {
      vapeText = "Doobies Pack (5) $50";
    } else if (req.body.vape == "vape_three") {
      vapeText = "Dirt Cart $60";
    }
  }

  console.log(flowerText);
  console.log(edibleText);
  console.log(vapeText);

  res.redirect("/api/shop/order");

  const messageBody =
    "\n\n Your order from Omnia Goods has been recieved. Our courier will deliver the products to you later today. \n\n" +
    flowerText +
    "\n" +
    edibleText +
    "\n" +
    vapeText;

  twilioClient.messages
    .create({
      body: messageBody,
      from: "+19803032992",
      to: "+15714387789",
    })
    .then((message) => console.log(message.sid));
});

module.exports = router;
