const router = require("express").Router();

const verify = require("./verifyToken");

router.get("/", verify, (req, res) => {
    res.render("shop");
});

router.get("/dev", (req, res) => {
  res.render("shop");
});

module.exports = router;
