const express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = process.env.PORT || 8080,
    environment = app.get('env'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    assert = require('assert'),
    MongoClient = require('mongodb').MongoClient;

app
    .use(express.static('public'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .use(logger(environment == 'development' ? 'dev' : 'combined'))

    .get("/", (req, res) => res.sendFile('/index.html'))
    

io.on('connection', function (socket) {
});

http.listen(port, () => console.log(`Server is running on port ${port} and environment ${environment}`));