require('dotenv').config();
const express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = process.env.PORT || 8080,
    environment = app.get('env'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    assert = require('assert'),
    MongoClient = require('mongodb').MongoClient,
    FitbitApiClient = require("fitbit-node"),
    client = new FitbitApiClient({
        clientId: process.env.FITBIT_CLIENT_ID,
        clientSecret: process.env.FITBIT_CLIENT_SECRET,
        apiVersion: '1.2' // 1.2 is the default
    });
app
    .use(express.static('public'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .use(logger(environment == 'development' ? 'dev' : 'combined'))

    .get("/", (req, res) => res.sendFile('/index.html'))
    .get("/authorize", (req, res) => {
        // request access to the user's activity, heartrate, location, nutrion, profile, settings, sleep, social, and weight scopes
        res.redirect(client.getAuthorizeUrl('activity heartrate location nutrition profile settings sleep social weight', 'https://secret-springs-39445.herokuapp.com/callback'));
    })
    .get("/callback", (req, res) => {
        // exchange the authorization code we just received for an access token
        client.getAccessToken(req.query.code, 'https://secret-springs-39445.herokuapp.com/callback').then(result => {
            // use the access token to fetch the user's profile information
            client.get("/profile.json", result.access_token).then(results => {
                res.send(results[0]);
            }).catch(err => {
                res.status(err.status).send(err);
            });
        }).catch(err => {
            res.status(err.status).send(err);
        });
    });

    
io.on('connection', function (socket) {
});

http.listen(port, () => console.log(`Server is running on port ${port} and environment ${environment}`));