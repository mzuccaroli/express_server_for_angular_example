"use strict";
const express = require("express");
const compression = require("compression");
const request = require("request");

const _environment = process.env.ENVIRONMENT || 'develop';
const _bucketAddress = 'http://static.test.com.s3-website-eu-west-1.amazonaws.com';
const _apiAddress = 'https://testapi/api/example/sitemap';
const _port = 4100;

const app = express();
app.use(compression());


// ---- REDIRECT TO HTTPS ---- //
if (_environment === 'production') {
    app.enable('trust proxy');
    app.use(function (req, res, next) {
        if (req.secure) {
            next(); // request was via https, so do no special handling
        } else {
            res.redirect(301, 'https://' + req.headers.host + req.url); // request was via http, so redirect to https
        }
    });
}

// ---- REDIRECT NON-WWW REQUESTS ---- //
if (_environment === 'production') {
    app.get('/*', function (req, res, next) {
        if (req.headers.host.match(/^www/) == null) {
            res.redirect('https://www.' + req.headers.host + req.url);
        } else {
            next();
        }
    });
}

// ---- SERVE SITEMAPS.XML FROM A DEDICATED API ---- //
app.all('*.xml', cache.getCache(), function (req, res) {
    // we need to redirect the sitemap request directly to the backend
    const options = {
        url: _apiAddress + req.url,
        headers: {
            'Accept': 'application/xml'
        }
    };
    request(options).pipe(res);
});

// ---- SERVE STATIC FILES FROM A BUCKET ---- //
app.all('*.(js|css|ttf|svg|png|jpg|jpeg|ico|woff2|woff|txt|html)', function (req, res) {
    const url = _bucketAddress + req.url;
    request(url).pipe(res);
});

// ---- SERVE APLICATION PATHS FROM A BUCKET ---- //
app.all('*', cache.getCache(), function (req, res) {
    //here you can manage things like language folder for example: url = _bucketAddress+'/en'
    request(_bucketAddress).pipe(res);
});

// ---- START UP THE NODE SERVER  ----
app.listen(_port, function () {
    console.log("Node Express server for " + app.name + " listening on https://localhost:" + _port);
});
