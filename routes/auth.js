const router = require("express").Router();
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const Register = require("../models/Register");
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
    check("referralcode", "Referral code must be 5 characters long").isLength({
      min: 5,
      max: 5,
    }),
    check("firstname", "First name validation failed").isLength({
      min: 1,
      max: 100,
    }),
    check("lastname", "Last name validation failed").isLength({
      min: 1,
      max: 100,
    }),
    check("email", "Email is not valid, Please Try Again")
      .isEmail()
      .normalizeEmail(),
  ],
  async (req, res) => {
    const error = validationResult(req);
    var text = req.body;

    if (!error.isEmpty()) {
      // TODO: send error message back with redirect
      const msg = error["errors"][0]["msg"];

      res.render("register", {
        msg: msg,
      });
    } else {
      console.log("Form inputs verified");

      console.log("Setting Session Variables");
      req.session.referralCode = req.body.referralcode;
      req.session.firstName = req.body.firstname;
      req.session.lastName = req.body.lastname;
      req.session.emailAddress = req.body.email;
      req.session.birthday = req.body.birthday;

      // save verified phone number to database
      // check if phone number is in DB
      // TODO: update to check if referral code exist instead, if yes account fully verified
      if (req.session.phoneNumber != null) {
        const existingPhoneNumber = await Register.findOne({
          mobilePhoneNumber: req.session.phoneNumber,
        }).exec();

        if (!existingPhoneNumber) {
          console.log(
            "New Phone Number Found, Attempting to Save Verified User"
          );
          await saveVerifiedRegister(req);
        } else {
          console.log("Phone Number Already Saved: " + req.session.phoneNumber);
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
    }
  }
);

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

        res.redirect("/api/user/verifyLocation");
      } else {
        console.log("Mobile Number Already Registered");

        // if already existed, send twilio verification
        console.log("SENDING TWILIO VERIFCATION");
        sendVerifyCode(phoneNumberTrim, res);
        req.session.phoneNumber = phoneNumberTrim;
        res.redirect("/api/user/verifyPhone");
      }
    }
  }
);

router.post(
  "/verifyPhone",
  urlencodedParser,
  check("verifycode", "Verify code must be 6 characters long").isLength({
    min: 6,
    max: 6,
  }),
  async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      // TODO: send error message back with redirect
      console.log("Input Validation Failed");
      console.log(error);

      const msg =
        "Please ensure the verification code entered is 6 characters long";
      res.render("verifyPhone", {
        msg: msg,
      });
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
            console.log("[SUCCESS] Code Verified: " + verifyCode);
            // check if new number or registered number
            if (req.session.phoneNumber != null) {
              const existingPhoneNumber = await Register.findOne({
                mobilePhoneNumber: req.session.phoneNumber,
              }).exec();

              if (!existingPhoneNumber) {
                console.log(
                  "New Phone Number Found, Must Get Registration Details"
                );
                res.redirect("/api/user/register");
              } else {
                console.log(
                  "Phone Number Already Verified and Saved - Continue to Shop: " +
                    req.session.phoneNumber
                );
                // create and sign jwt
                const token = jwt.sign(
                  { _id: req.session.phoneNumber },
                  process.env.TOKEN_SECRET
                );
                console.log(token);
                req.session.authToken = token;
                res.header("auth-token", token).redirect("/api/shop");
              }
            }
          } else {
            console.log("[FAILURE] Verification Code Doesn't Match");

            const msg =
              "The verification code entered doesn't match. Please try again.";
            res.render("verifyPhone", {
              msg: msg,
            });
          }
        })
        .catch((error) => {
          console.log(error);
          res.status(200).send({ error });
        });
    }
  }
);

router.get("/verifyPhone", (req, res) => {
  const numberFormated = phoneFormat(req.session.phoneNumber);
  const msg =
    "Please verify your phone number before proceeding. We sent a verification code to: (" +
    numberFormated +
    ")";
  res.render("verifyPhone", {
    msg: msg,
  });
});

router.get("/register", function (req, res) {
  const msg =
    "Your location and phone number have been successfully verified! Fill out the remaining information below and you're all done!";
  res.render("register", {
    msg: msg,
  });
});

router.get("/verifyLocation", function (req, res) {
  res.render("verifyLocation", {
    phoneNumber: phoneFormat(req.session.phoneNumber),
  });
});

router.post("/verifyLocation", function (req, res) {
  req.session.address = req.body.address;
  req.session.apt = req.body.apt;
  req.session.city = req.body.city;
  req.session.state = req.body.state;
  req.session.zip = req.body.zip;
  req.session.country = req.body.country;

  console.log(req.session.address);
  console.log(req.session.apt);
  console.log(req.session.city);
  console.log(req.session.state);
  console.log(req.session.zip);
  console.log(req.session.country);
  sendVerifyCode(req.session.phoneNumber);
  res.redirect("/api/user/verifyPhone");
});

async function saveVerifiedRegister(req) {
  const register = new Register({
    mobilePhoneNumber: req.session.phoneNumber,
    referralCode: req.session.referralCode,
    firstName: req.session.firstName,
    lastName: req.session.lastName,
    birthday: req.session.birthday,
    emailAddress: req.session.emailAddress,
    streetAddress: req.session.address,
    apt: req.session.apt,
    city: req.session.city,
    state: req.session.state,
    zip: req.session.zip,
    country: req.session.country,
  });

  console.log(req.session.address);
  console.log(req.session.apt);
  console.log(req.session.city);
  console.log(req.session.state);
  console.log(req.session.zip);
  console.log(req.session.country);

  const savedRegister = await register
    .save()
    .then((result) => {
      console.log("SUCCESS inserting register entry:" + result);
    })
    .catch((err) => {
      console.log("FAILURE inserting register entry:" + err);
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
