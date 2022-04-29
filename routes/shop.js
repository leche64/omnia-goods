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
  var flowerImg = null;

  if (req.body.card != null) {
    if (req.body.card == "card_one") {
      flowerDescription = "Ronin";
      flowerPrice = "60.00";
      flowerWeight = "3.5 grams";
      flowerImg = "/images/weednug1.png";
    } else if (req.body.card == "card_two") {
      flowerDescription = "Daimyos";
      flowerPrice = "110.00";
      flowerWeight = "7 grams";
      flowerImg = "/images/weednug2.png";
    } else if (req.body.card == "card_three") {
      flowerDescription = "Samurai";
      flowerPrice = "200.00";
      flowerWeight = "14 grams";
      flowerImg = "/images/weednug3.png";
    } else if (req.body.card == "card_four") {
      flowerDescription = "Shogun";
      flowerPrice = "360.00";
      flowerWeight = "28 grams";
      flowerImg = "/images/weednug4.png";
    }
  }

  const flowerOrder = {
    description: flowerDescription,
    price: flowerPrice,
    weight: flowerWeight,
    img: flowerImg,
  };
  console.log(flowerOrder);

  if (req.body.edible != null) {
    var edibleDescription = null;
    var ediblePrice = null;
    var edibleWeight = null;
    var edibleImg = null;

    if (req.body.edible == "edible_one") {
      edibleDescription = "Choc Blaze Bar";
      ediblePrice = "20.00";
      edibleWeight = "150 mg";
      edibleImg = "/images/weedcookie.png";
    } else if (req.body.edible == "edible_two") {
      edibleDescription = "Choc Blaze Bar";
      ediblePrice = "60.00";
      edibleWeight = "500 mg";
      edibleImg = "/images/weedgummy.png";
    }
  }

  const edibleOrder = {
    description: edibleDescription,
    price: ediblePrice,
    weight: edibleWeight,
    img: edibleImg,
  };
  console.log(edibleOrder);

  if (req.body.vape != null) {
    var vapeDescription = null;
    var vapePrice = null;
    var vapeWeight = null;
    var vapeImg = null;

    if (req.body.vape == "vape_one") {
      vapeDescription = "Pre-Roll";
      vapePrice = "20.00";
      vapeWeight = "1 g";
      vapeImg = "/images/weedjoint.png";

    } else if (req.body.vape == "vape_two") {
      vapeDescription = "Doobies Pack (5)";
      vapePrice = "50.00";
      vapeWeight = "3.5 g";
      vapeImg = "/images/weedjoints.png";
      
    } else if (req.body.vape == "vape_three") {
      vapeDescription = "Vape Cart Pack";
      vapePrice = "60.00";
      vapeWeight = "1 g";
      vapeImg = "/images/weedvape.png";
    }
  }

  const vapeOrder = {
    description: vapeDescription,
    price: vapePrice,
    weight: vapeWeight,
    img: vapeImg
  };

  var orderlist = [];

  if (flowerOrder.price != null) {
    orderlist.push(flowerOrder);
  }

  if (edibleOrder.price != null) {
    orderlist.push(edibleOrder);
  }

  if (vapeOrder.price != null) {
    orderlist.push(vapeOrder);
  }
  var orderTotal = 0;

  for (var i = 0; i < orderlist.length; i++) {
    if (orderlist[i].price != null) {
      orderTotal += parseFloat(orderlist[i].price);
    }
  }

  const tax = 0.05;
  const deliveryFee = 10;

  const totalTax = orderTotal * tax;

  res.render("cart", {
    order: orderlist,
    subTotal: orderTotal.toFixed(2),
    taxTotal: parseFloat(totalTax).toFixed(2),
    deliveryTotal: deliveryFee.toFixed(2),
    orderTotal: parseFloat(orderTotal + totalTax + deliveryFee).toFixed(2),
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
