const router = require("express").Router();

const verify = require("./verifyToken");

router.get("/", verify, (req, res) => {
  res.send("BING BONG BONG BONG");
});

module.exports = router;
