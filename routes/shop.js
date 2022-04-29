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
  res.render("cart");
});

router.get("/order", (req, res) => {
  res.render("statusPendingDelivery");
});

//TODO verify jwt
router.post("/order", async (req, res) => {
  console.log(req.body.card);
  console.log(req.body.edible);
  console.log(req.body.vape);

  var flowerDescription = null;
  var flowerPrice = null;
  var flowerWeight = null;

  if (req.body.card != null) {
    if (req.body.card == "card_one") {
      flowerDescription = "Ronin";
      flowerPrice = "60.00";
      flowerWeight = "3.5 grams";
    } else if (req.body.card == "card_two") {
      flowerDescription = "Daimyos";
      flowerPrice = "110.00";
      flowerWeight = "7 grams";
    } else if (req.body.card == "card_three") {
      flowerDescription = "Samurai";
      flowerPrice = "200.00";
      flowerWeight = "14 grams";
    } else if (req.body.card == "card_four") {
      flowerDescription = "Shogun";
      flowerPrice = "360";
      flowerWeight = "28 grams";
    }
  }

  const flowerOrder = {
    description: flowerDescription,
    price: flowerPrice,
    weight: flowerWeight,
  };
  console.log(flowerOrder);

  if (req.body.edible != null) {
    var edibleDescription = null;
    var ediblePrice = null;
    var edibleWeight = null;

    if (req.body.edible == "edible_one") {
      edibleDescription = "Choc Blaze Bar";
      ediblePrice = "20.00";
      edibleWeight = "150 mg";
    } else if (req.body.edible == "edible_two") {
      edibleDescription = "Choc Blaze Bar";
      ediblePrice = "60.00";
      edibleWeight = "500 mg";
    }
  }

  const edibleOrder = {
    description: edibleDescription,
    price: ediblePrice,
    weight: edibleWeight,
  };
  console.log(edibleOrder);

  if (req.body.vape != null) {
    var vapeDescription = null;
    var vapePrice = null;
    var vapeWeight = null;

    if (req.body.vape == "vape_one") {
      vapeText = "Pre-Roll";
      vapePrice = "20.00";
      vapeWeight = "1 g";
    } else if (req.body.vape == "vape_two") {
      vapeText = "Doobies Pack (5)";
      vapePrice = "50.00";
      vapeWeight = "3.5 g";
    } else if (req.body.vape == "vape_three") {
      vapeText = "Vape Cart Pack";
      vapePrice = "60.00";
      vapeWeight = "1 g";
    }
  }

  const vapeOrder = {
    description: vapeText,
    price: vapePrice,
    weight: vapeWeight,
  };

  console.log(vapeOrder);

  const orderTotal = parseInt(flowerOrder.price) + parseInt(edibleOrder.price) + parseInt(vapeOrder.price);

  const tax = 0.05;
  const deliveryFee = 10;

  const totalTax = orderTotal * tax;

  res.render("cart", {
    flower: flowerOrder,
    edible: edibleOrder,
    vape: vapeOrder,
    subTotal: orderTotal.toFixed(2),
    taxTotal: parseFloat(totalTax).toFixed(2),
    deliveryTotal: deliveryFee.toFixed(2),
    orderTotal: parseFloat(orderTotal + totalTax + deliveryFee).toFixed(2)
  });

  // const messageBody =
  //   "\n\n Your order from Omnia Goods has been recieved. Our courier will deliver the products to you later today. \n\n" +
  //   flowerText +
  //   "\n" +
  //   edibleText +
  //   "\n" +
  //   vapeText;

  // twilioClient.messages
  //   .create({
  //     body: messageBody,
  //     from: "+19803032992",
  //     to: "+15714387789",
  //   })
  //   .then((message) => console.log(message.sid));
});

module.exports = router;
