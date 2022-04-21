const router = require("express").Router();
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const Register = require("../models/Register");

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const jwt = require("jsonwebtoken");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require("twilio")(accountSid, authToken);

router.get("/register", (req, res) => {
  res.render("register");
});

router.post(
  "/register",
  urlencodedParser,
  [
    check("mobilenumber", "Phone number error").isMobilePhone(),
    check("referalcode", "Refreal code must be 5 characters long").isLength({
      min: 5,
      max: 5,
    }),
    check("firstname", "First name error").isLength({ min: 1 }),
    check("lastname", "Last name error").isLength({ min: 1 }),
    check("email", "Email is not valid").isEmail().normalizeEmail(),
  ],
  (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: error.array(),
      });
    } else {
      // res.status(200).json({
      //   success: true,
      //   message: 'form inputs validated',
      // });

      const register = new Register({
        mobilePhoneNumber: req.body.mobilenumber,
        referralCode: req.body.referalcode,
        firstName: req.body.firstname,
        lastName: req.body.lastname,
        emailAddress: req.body.email,
      });

      console.log(register);

      register
        .save()
        .then((result) => {
          console.log("SUCCESS inserting register entry");
          res.send(result);
        })
        .catch((err) => {
          console.log("FAILURE inserting register entry");
          res.send(err);
        });
    }
  }
);

router.get("/login", (req, res) => {
  Register.find().then((result) => {
    res.send(result);
  });
});

router.get("/verify", (req, res) => {
  twilioClient.verify
    .services(process.env.TWILIO_SERVICE_SSID)
    .verificationChecks.create({
      to: "+15714387789",
      code: "1111",
    })
    .then((result) => {
      if (result.status == "approved") {
        console.log("successfully verified code");
      }
      res.status(200).send({ result });
    })
    .catch((error) => {
      console.log(error);
      res.status(200).send({ error });
    });
});

router.post(
  "/login",
  urlencodedParser,
  [check("mobilenumber", "isMobilePhone Validation Failed").isMobilePhone()],
  async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      console.log(error);
      return res.status(422).json({
        success: false,
        errors: error.array(),
      });
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
      } else {
        console.log("Mobile Number Already Registered and Verified");
        
        // if already existed, send twilio verification
        console.log("SENDING TWILIO VERIFCATION");
        // twilioClient.verify
        //   .services(process.env.TWILIO_SERVICE_SSID)
        //   .verifications.create({
        //     to: phoneNumberFinal,
        //     channel: "sms",
        //   })
        //   .then((result) => {
        //     console.log("successfully sent twilio verification code");
        //     res.status(200).send({ result });
        //   })
        //   .catch((error) => {
        //     console.log(error);
        //     res.status(200).send({ error });
        //   });
        res.render("verify");
      }
    }
  }
);

module.exports = router;
