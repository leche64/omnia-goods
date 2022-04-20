const router = require("express").Router();
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const Register = require("../models/Register");

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const jwt = require("jsonwebtoken");
const accountSid = "AC5473c19b88688100d4d4ebd61ea45e4e"; //process.env.TWILIO_ACCOUNT_SID;
const authToken = "348d77ed12fe42e75a5eb2ab49a070cd"; //process.env.TWILIO_AUTH_TOKEN;
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

router.get("/get-registrations", (req, res) => {
  Register.find().then((result) => {
    res.send(result);
  });
});

router.get("/verify", (req, res) => {
  twilioClient.verify.services(process.env.TWILIO_SERVICE_SSID).verificationChecks.create({
    to: '+15714387789',
    code: "1111",
  }).then((result) =>{
    if(result.status == 'approved') {
      console.log('successfully verified code');
    }
    res.status(200).send({result})
  }).catch((error) =>{
    console.log(error);
    res.status(200).send({error});
  });
});

router.post("/login", async (req, res) => {
  //validiate input params

  //check if phone number exists

  //if exists, validate via twilio
  twilioClient.verify.services(process.env.TWILIO_SERVICE_SSID).verifications.create({
    to: '+15714387789',
    channel: "sms",
  }).then((result) =>{
    console.log('successfully sent twilio verification code');
    res.status(200).send({result})
  }).catch((error) =>{
    console.log(error);
    res.status(200).send({error});
  });

  // console.log("twilio start");
  // client.messages
  //   .create({
  //     body: "Did you just order Cambodian breast milk??",
  //     from: "+19803032992",
  //     to: "+15714387789",
  //   })
  //   .then((message) => console.log(message.sid));

  // console.log("twilio end");

  //if twililo verficatioon pass, create and assing jwt
  // const token = jwt.sign(
  //   {
  //     _id: user.id,
  //   },
  //   process.env.TOKEN_SECERT
  // );

  // res.header('auth-token', token).send(token);
});

module.exports = router;
