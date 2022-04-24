const express = require("express");
const path = require("path");
const axios = require("axios");
//const jsdom = require('jsdom');
//const { JSDOM } = jsdom;

const bodyParser = require("body-parser");
const { check, validationResult, body } = require("express-validator");
const ejs = require("ejs");
const mongoose = require("mongoose");
const Register = require("./models/Register");
// var fs = require('fs');

const dotenv = require("dotenv");
dotenv.config();

var session = require("express-session");

const app = express();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      expires: 5000000,
    },
  })
);

// mongo db connection
const dbURI = process.env.DB_CONNECT;
mongoose
  .connect(dbURI)
  .then((result) => {
    // import routes
    const authRoute = require("./routes/auth");
    const shopRoute = require("./routes/shop");

    app.set("views", path.join(__dirname, "views"));

    // regiester view engine - handlebars/pug/ejs
    // will look for *.ejs files in 'views' by default
    app.set("view engine", "ejs");

    // middleware & static files
    app.use(express.static(__dirname + "/assets/"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true })); 

    app.use("/api/user", authRoute);
    app.use("/api/shop", shopRoute);

    app.get("/", (req, res) => {
      //var data = fs.readFileSync(__dirname + "/views/index.ejs", "utf8");
      //const dom = new JSDOM(data);
      // console.log(data);

      let weather = {
        api_key: "27d1186f1e3e0f7786c45a9100394b5a",
        fetchGeoLocation: function (city) {
          axios
            .get(
              "https://api.openweathermap.org/geo/1.0/direct?" +
                "q=" +
                city +
                "&limit=1" +
                "&appid=" +
                this.api_key
            )
            .then((res) => {
              // console.log(res.data[0].lat, res.data[0].lon);
              this.fetchWeatherData(res.data[0].lat, res.data[0].lon);
            })
            .catch((error) => {
              console.error(error);
            });
        },
        fetchWeatherData: function (latitude, longitude) {
          axios
            .get(
              "https://api.openweathermap.org/data/2.5/weather?" +
                "lat=" +
                latitude +
                "&lon=" +
                longitude +
                "&appid=" +
                this.api_key +
                "&units=" +
                "Imperial"
            )
            .then((res) => {
              // console.log(res.data);
              this.displayWeather(res.data);
            })
            .catch((error) => {
              console.error(error);
            });
        },
        displayWeather: function (data) {
          const { name } = data;
          const { description, icon } = data.weather[0];
          const { temp, humidity } = data.main;
          const { speed } = data.wind;
          console.log(name, description, icon, temp, humidity, speed);
          res.render("index", {
            name: name,
            description: description,
            icon: icon,
            temp: temp,
            humidity: humidity,
            speed: speed,
          });
        },
      };
      weather.fetchGeoLocation("New York City");
    });

    console.log("SUCCESSFULL DB CONNECTION");
    // start app after successful db connection
    app.listen(8080, () => {
      console.log("APP SUCESSFULLY STARTED");
    });
  })
  .catch((error) => {
    console.log("FAILED DB CONNECTION");
    console.log(error);
  });
