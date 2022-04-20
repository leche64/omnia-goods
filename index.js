const express = require("express");
const path = require("path");
const axios = require("axios");
//const jsdom = require('jsdom');
//const { JSDOM } = jsdom;

const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const ejs = require("ejs");
const mongoose = require("mongoose");
const Register = require("./models/Register");
// var fs = require('fs');

const dotenv = require("dotenv");
dotenv.config();

const app = express();

// mongo db connection
const dbURI = process.env.DB_CONNECT;
mongoose
  .connect(dbURI)
  .then((result) => {
    // import routes
    const authRoute = require("./routes/auth");

    app.set("views", path.join(__dirname, "views"));

    // regiester view engine - handlebars/pug/ejs
    // will look for *.ejs files in 'views' by default
    app.set("view engine", "ejs");

    // middleware & static files
    app.use(express.static(__dirname + "/assets/"));
    app.use(express.json());

    // route middleware routes
    app.use("/api/user", authRoute);


    const urlencodedParser = bodyParser.urlencoded({ extended: false });

    app.get("/", urlencodedParser, (req, res) => {
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

    app.get("/products", (req, res) => {
      res.render("products");
    })

    app.get("/locations", (req, res) => {
      res.render("locations");
    })

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
