$(function () {
    window.socket = io();
    socket.on('userJoin', function (user) {
        var playerCount = parseInt($('#playerCount').text());
        $('#playerCount').text(playerCount + 1)
    });
    socket.on('gameStart', function (user) {
        $("#main").html("<video autoplay='true' id='cameraFeed'> </video>");
        var videoFeed = $("#cameraFeed")[0];
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    videoFeed.srcObject = stream;
                })
                .catch(function (error) {
                    console.log("Something went wrong! " + error);
                });
        }
    }); 
    socket.on('closeRoom', function (user) {
        alert("Host has closed the connection. Going back to main menu...")
        location.reload();
    });
});
$("#main").on("click", "#createRoom", function () {
    socket.emit('createRoom', $(this).attr('data-username'), function (roomCode) {
        if (roomCode !== null) {
            $("#main").html("<h1>Your room code is " + roomCode + "</h1><p><span id='playerCount'>1</span> Players connected.</p><button id='startGame' data-roomCode='" + roomCode + "'> Start Game </button>");
        } else {
            alert("Erorr creating room please refresh the page and try again.")
        }
    });
})
$("#main").on("click", "#joinRoom", function () {
    var code = prompt("Please enter your room code:");
    socket.emit('joinRoom', $(this).attr('data-username'), code, function (roomCode) {
        if (roomCode !== null && roomCode !== false) {
            $("#main").html("<h1>Joined room code " + roomCode + "</h1><p><span id='playerCount'>0</span> Players connected.</p><p>Waiting for game to start...</p>");
        } else if (user == false) {
            alert("Sorry that room is full or in session! Try again later.")
        } else {
            alert("Error joining game. Try again later.")
        }

    });
})
$("#main").on("click", "#startGame", function () {
    socket.emit('startGame', $(this).attr('data-roomCode'), function (result) {
        if (result !== null) {
            $("#main").html('Realtime dashboard goes here');
        } else {
            alert("There was an error starting the game. Please feel free to cry now.")
        }
    });
});

$("#usernameForm").submit(function (e) {
    e.preventDefault();
    var userName = $(this).find('input[name="username"]').val();
    $("#main").html('<button id="createRoom" data-username="' + userName + '">Create</button><button id="joinRoom" data-username="' + userName + '">Join</button>');
})