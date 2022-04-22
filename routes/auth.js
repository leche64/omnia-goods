const router = require("express").Router();
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const Register = require("../models/Register");

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

    //proceed if input params validated
    if (!error.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: error.array(),
        message: text,
      });
    } else {
      //check if phone number is in DB
      const existingPhoneNumber = await Register.find({
        mobilePhoneNumber: req.body.phonenumber,
      }).exec();

      //if not, send twilio verify code
      if (existingPhoneNumber.length === 0) {
        sendVerifyCode(req.body.phonenumber);
      }
      req.session.phoneNumber = req.body.phonenumber;
      res.render("verify");

      //verify pass, insert into db,

      //sign jwt token

      //access to shop

      //verify fail, go to error screeen

      // const register = new Register({
      //   mobilePhoneNumber: req.body.mobilenumber,
      //   referralCode: req.body.referalcode,
      //   firstName: req.body.firstname,
      //   lastName: req.body.lastname,
      //   emailAddress: req.body.email,
      // });

      // console.log(register);

      // register
      //   .save()
      //   .then((result) => {
      //     console.log("SUCCESS inserting register entry");
      //     res.send(result);
      //   })
      //   .catch((err) => {
      //     console.log("FAILURE inserting register entry");
      //     res.send(err);
      //   });
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
      // return res.status(422).json({
      //   success: false,
      //   errors: error.array(),
      // });
      res.render("index");
    } else {
      // validate input number
      console.log(req.body.mobilenumber);
      // trim white space
      const phoneNumber = req.body.mobilenumber.replace(/\s/g, "");

      const phoneNumberTrim = phoneNumber.replace(/-/g, "");

      const phoneNumberFinal = "+1" + phoneNumberTrim;

      console.log(phoneNumberFinal);

      // check if phone number exist in db
      const existingPhoneNumber = await Register.find({
        mobilePhoneNumber: phoneNumberTrim,
      }).exec();
      console.log(existingPhoneNumber);

      // non registered mobile phone number, send to registration
      if (existingPhoneNumber.length == 0) {
        console.log("New Mobile Number Needs To Be Registered");
        // res.status(200).json(phoneNumberFinal).render("register");
        res.render("register", { data: phoneNumberFinal });
      } else {
        console.log("Mobile Number Already Registered");

        // if already existed, send twilio verification
        console.log("SENDING TWILIO VERIFCATION");
        sendVerifyCode(phoneNumberFinal, res);
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
      console.log(error);
      return res.status(422).json({
        success: false,
        errors: error.array(),
      });
    } else {
      const verifyCode = req.body.verifycode;
      const phoneNumber = '+1' + req.session.phoneNumber;
      twilioClient.verify
        .services(process.env.TWILIO_SERVICE_SSID)
        .verificationChecks.create({
          to: phoneNumber,
          code: verifyCode,
        })
        .then((result) => {
          if (result.status == "approved") {
            console.log("successfully verified code");
          }
          res.status(200).send({ result });
          res.render("shop");
        })
        .catch((error) => {
          console.log(error);
          res.status(200).send({ error });
        });
    }
  }
);

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

module.exports = router;
