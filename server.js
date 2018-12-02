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
    }),
    Clarifai = require('clarifai'),
    clarifaiClient = new Clarifai.App({ apiKey: process.env.CLARIFAI_API_KEY });
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
            io.emit('access_token', result.access_token);
            // use the access token to fetch the user's profile information
            client.get("/profile.json", result.access_token).then(results => {
                console.log(results);
                io.emit('fitbitLog' , results);
                res.redirect('/');

            }).catch(err => {
                res.status(err.status).send(err);
            });
        }).catch(err => {
            res.status(err.status).send(err);
        });
    })
    .post("/data", (req, res) =>{
        let access_token = req.body.access_token;
        let date = req.body.date;
        let steps = client.get(`/activities/steps/date/${date}/1d.json`, access_token);
        let recentActivities = client.get('/activities/recent.json', access_token);
        let heartRate = client.get(`/activities/heart/date/${date}/1d.json`, access_token);

        Promise.all([steps, recentActivities, heartRate]).then(result =>{
            let final = [];
            result.forEach((arr) => {
                final.push(arr[0]);
            })
            res.send(final);
        })
    })
    .post('/predict', (req, res) => {
        let img = req.body.img;
        clarifaiClient.models.predict(Clarifai.GENERAL_MODEL, {base64: img}).then((res_api)=>{
            res.send(res_api);
        }, (err) => {
            res.send(err);
        });
    });


io.on('connection', function (socket) {
    socket.on('createRoom', function (user, cb) {
        const roomName = Math.random().toString(36).substring(7);
        socket.join(roomName, () => {
            (async function () {
                const url = process.env.MONGODB_URI;
                const client = new MongoClient(url, { useNewUrlParser: true });
                try {
                    await client.connect();
                    console.log("Connected to MLab server");
                    const db = client.db('heroku_wnkn62l1');
                    const collection = db.collection('games');
                    collection.insertOne({ 'room': roomName, 'socket': socket.id, 'username': user, 'active': false }, function (err, result) {
                        assert.equal(err, null);
                        cb(roomName)
                    });
                } catch (err) {
                    console.log(err.stack);
                    cb(null)
                }
                client.close();
            })();
        });
    });
    socket.on('joinRoom', function (user, code, cb) {
        (async function () {
            const url = process.env.MONGODB_URI;
            const client = new MongoClient(url, { useNewUrlParser: true });
            try {
                await client.connect();
                console.log("Connected to MLab server");
                const db = client.db('heroku_wnkn62l1');
                const collection = db.collection('games');
                collection.findOne({ 'room': code }, function (err, game) {
                    assert.equal(err, null);
                    game !== null ? (!game.active ? (
                        socket.join(code, () => {
                            cb(code);
                            io.sockets.in(code).emit('userJoin', user);
                        })
                    ) : cb(false)) : null;

                });
            } catch (err) {
                console.log(err.stack);
                cb(null)
            }
            client.close();
        })();
    });
    socket.on('startGame', function (code, cb) {
        (async function () {
            const url = process.env.MONGODB_URI;
            const client = new MongoClient(url, { useNewUrlParser: true });
            try {
                await client.connect();
                console.log("Connected to MLab server");
                const db = client.db('heroku_wnkn62l1');
                const collection = db.collection('games');
                collection.updateOne({ 'room': code }, { $set: { 'active': true } }, function (err, result) {
                    assert.equal(err, null);
                    cb(true)
                    socket.broadcast.to(code).emit('gameStart');
                });
            } catch (err) {
                console.log(err.stack);
                cb(null)
            }
            client.close();
        })();
    });
    socket.on('disconnect', function () {
        (async function () {
            const url = process.env.MONGODB_URI;
            const client = new MongoClient(url, { useNewUrlParser: true });
            try {
                await client.connect();
                console.log("Connected to MLab server");
                const db = client.db('heroku_wnkn62l1');
                const collection = db.collection('games');
                collection.findOne({ 'socket': socket.id }, function (err, game) {
                    assert.equal(err, null);
                    if (game != null) {
                        let roomCode = game.room;
                        collection.deleteOne({ 'socket': socket.id }, function (err, result) {
                            assert.equal(err, null);
                            assert.equal(1, result.result.n);
                            io.sockets.in(roomCode).emit('closeRoom');
                            client.close();
                        });
                    }
                });
            } catch (err) {
                console.log(err.stack);
                cb(null)
                client.close();
            }
        })();
        io.emit('user disconnected');
    });
});

http.listen(port, () => console.log(`Server is running on port ${port} and environment ${environment}`));