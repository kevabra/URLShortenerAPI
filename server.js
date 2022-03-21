require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
var dns = require("dns");
const shortid = require("shortid");

var router = express.Router();

const MONGO_URI = process.env['MONGO_URI'];

const url = mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const {Schema} = mongoose;
const Url = new Schema({
  original_url: String,
  short_url: Number
});

const bodyParser = require("body-parser");
const url_exists = require("url-exists");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let URL = mongoose.model('URL', Url);

app.post("/api/shorturl", function(req, res) {
  console.log(req.body);

  let newUrl = req.body.url;
  if (newUrl.toString().slice(0, 7) == "http://") {
    newUrl = newUrl.toString().slice(7);
    console.log("new: " + newUrl);
  }
  if (newUrl.toString().slice(0, 8) == "https://") {
    newUrl = newUrl.toString().slice(8);
    console.log("new: " + newUrl);
  }
  
  dns.lookup(newUrl, function(err, address, family) {
    console.log("err: " +  err);
    console.log("address: " + address);
    console.log("family: " + family)
    let url = "" + req.body.url;

    url_exists(url, function(err, exists) {
      if (validateUrl(url) && url.toString().length > 6 && (url.toString().slice(0, 7) == "http://" || url.toString().slice(0, 8) == "https://")) {
        let val = Math.floor(Math.random() * 100) + 1;
      
      let url_data_entry = new URL({original_url: req.body.url, short_url: val});
      url_data_entry.save();
      res.json({original_url: req.body.url, short_url: val});
      } 
      else {
        res.json({error: "invalid url"});
      }
    });
  });
});

function validateUrl(value) {
    var regex_url = new RegExp("^(http|https|ftp)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*$");
    if (regex_url.test(value)) {
        return (true);
    }
    return (false);
}

app.get("/api/shorturl/:val", function(req, res) {
  console.log(req.params.val);
  
  let urlExist = URL.findOne({short_url: req.params.val + ""}, function(err, url_data) {
    console.log("original url: " + url_data.original_url);
    res.redirect(url_data.original_url);
    
  });

  if (!urlExist) {
    res.json({error: "invalid url"});
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
