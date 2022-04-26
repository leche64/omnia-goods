const router = require("express").Router();
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const Register = require("../models/Register");
const googleMaps = require("./verifyLocation");
const axios = require("axios");

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const jwt = require("jsonwebtoken");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require("twilio")(accountSid, authToken);

router.post(
  "/register",
  urlencodedParser,
  [
    check("phonenumber", "Phone number error").isMobilePhone(),
    check("referralcode", "Refreal code must be 5 characters long").isLength({
      min: 5,
      max: 5,
    }),
    check("firstname", "First name error").isLength({ min: 1, max: 100 }),
    check("lastname", "Last name error").isLength({ min: 1, max: 100 }),
    check("email", "Email is not valid").isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const error = validationResult(req);
    var text = req.body;

    if (!error.isEmpty()) {
      // TODO: send error message back with redirect
      console.log(error.array());
      // return res.status(422).json({
      //   success: false,
      //   errors: error.array(),
      //   message: text,
      // });
    } else {
      console.log("Form inputs verified");

      sendVerifyCode(req.body.phonenumber);

      console.log("Setting Session Variables");
      req.session.phoneNumber = req.body.phonenumber;
      req.session.referralCode = req.body.referralcode;
      req.session.firstName = req.body.firstname;
      req.session.lastName = req.body.lastname;
      req.session.birthday = req.body.birthday;
      req.session.emailAddress = req.body.email;
      res.redirect("/api/user/verify");
    }
  }
);

router.get("/verify"),
  (req, res) => {
    res.render("verify");
  };

router.post(
  "/login",
  urlencodedParser,
  [check("mobilenumber", "isMobilePhone Validation Failed").isMobilePhone()],
  async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      console.log(error);
      res.redirect("/index");
    } else {
      // trim white space
      const phoneNumber = req.body.mobilenumber.replace(/\s/g, "");
      const phoneNumberTrim = phoneNumber.replace(/-/g, "");
      const phoneNumberFinal = "+1" + phoneNumberTrim;

      // check if phone number exist in db
      const existingPhoneNumber = await Register.find({
        mobilePhoneNumber: phoneNumberTrim,
      }).exec();
      console.log(existingPhoneNumber);

      // new mobile phone number, send to location verification
      if (existingPhoneNumber.length == 0) {
        console.log(
          "New Mobile Number Needs To Be Registered and Verified: " +
            phoneNumberTrim
        );
        req.session.phoneNumber = phoneNumberTrim;
        // res.redirect("/api/user/verifyLocation");
        res.render("verifyLocation", {
          phoneNumber: phoneFormat(phoneNumberTrim),
        });
      } else {
        console.log("Mobile Number Already Registered");

        // if already existed, send twilio verification
        console.log("SENDING TWILIO VERIFCATION");
        sendVerifyCode(phoneNumberTrim, res);
        req.session.phoneNumber = phoneNumberTrim;
        res.redirect("/api/user/verify");
      }
    }
  }
);

router.post(
  "/verify",
  urlencodedParser,
  check("verifycode", "Verify code must be 5 characters long").isLength({
    min: 6,
    max: 6,
  }),
  async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      // TODO: send error message back with redirect
      console.log("Input Validation Failed");
      console.log(error);
      res.redirect("/api/user/verify");
      // return res.status(422).json({
      //   success: false,
      //   errors: error.array(),
      // });
    } else {
      const verifyCode = req.body.verifycode;
      const phoneNumberFormated = "+1" + req.session.phoneNumber;

      twilioClient.verify
        .services(process.env.TWILIO_SERVICE_SSID)
        .verificationChecks.create({
          to: phoneNumberFormated,
          code: verifyCode,
        })
        .then(async (result) => {
          if (result.status == "approved") {
            console.log("[SUCCESS] Code Verified");
            // save verified phone number to database
            // check if phone number is in DB
            if (req.session.phoneNumber != null) {
              const existingPhoneNumber = await Register.findOne({
                mobilePhoneNumber: req.session.phoneNumber,
              }).exec();

              if (!existingPhoneNumber) {
                await saveVerifiedRegister(req);
              } else {
                console.log("Login from existing register");
              }

              // create and sign jwt
              const token = jwt.sign(
                { _id: req.session.phoneNumber },
                process.env.TOKEN_SECRET
              );
              console.log(token);
              req.session.authToken = token;
              res.header("auth-token", token).redirect("/api/shop");
            } else {
              console.log(
                "req.session.phoneNumber not found: " + req.session.phoneNumber
              );
              res.redirect("/index");
            }
          } else {
            console.log("[FAILURE] Verification Code Doesn't Match");
            res.redirect("/api/user/verify");
          }
        })
        .catch((error) => {
          console.log(error);
          res.status(200).send({ error });
        });
    }
  }
);

router.get("/verify", (req, res) => {
  res.render("verify");
});

router.get("/register", function (req, res) {
  res.render("register");
});

router.get("/verifyLocation", function (req, res) {
  res.render("verifyLocation");
});

router.post("/verifyLocation", function (req, res) {
  console.log(req.body.address);
  console.log(req.body.apt);
  console.log(req.body.city);
  console.log(req.body.state);
  console.log(req.body.zip);
  console.log(req.body.country);
  res.send("fucking titties");
});

async function saveVerifiedRegister(req) {
  const register = new Register({
    mobilePhoneNumber: req.session.phoneNumber,
    referralCode: req.session.referralCode,
    firstName: req.session.firstName,
    lastName: req.session.lastName,
    birthday: req.session.birthday,
    emailAddress: req.session.emailAddress,
  });

  const savedRegister = await register
    .save()
    .then((result) => {
      console.log("SUCCESS inserting register entry");
    })
    .catch((err) => {
      console.log("FAILURE inserting register entry" + err);
    });
}

function sendVerifyCode(mobileNumber) {
  console.log("Attempting to sending twilio verification");
  const mobileNumberFinal = "+1" + mobileNumber;
  twilioClient.verify
    .services(process.env.TWILIO_SERVICE_SSID)
    .verifications.create({
      to: mobileNumberFinal,
      channel: "sms",
    })
    .then((result) => {
      console.log("successfully sent twilio verification code");
    })
    .catch((error) => {
      console.log(error);
    });
}

function phoneFormat(input) {
  if (!input || isNaN(input)) return `input must be a number was sent ${input}`;
  if (typeof input !== "string") input = input.toString();
  if (input.length === 10) {
    return input.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  } else if (input.length < 10) {
    return "was not supplied enough numbers please pass a 10 digit number";
  } else if (input.length > 10) {
    return "was supplied too many numbers please pass a 10 digit number";
  } else {
    return "something went wrong";
  }
}
module.exports = router;
