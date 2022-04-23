const router = require("express").Router();

const verify = require("./verifyToken");

router.get("/", verify, (req, res) => {
  res.render("shop");
});

router.get("/confirm", verify, (req, res) => {
  res.render("confirm");
});

router.get("/dev", (req, res) => {
  res.render("shop");
});

router.post(
  "/order",
  async (req, res) => {
    console.log(req.body.card)
    console.log(req.body.edible)
    console.log(req.body.vape)
    res.redirect('/api/shop/confirm')
  }
);

module.exports = router;
