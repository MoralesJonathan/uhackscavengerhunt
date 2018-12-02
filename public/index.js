$(function () {
    window.socket = io();
    socket.on('userJoin', function (user) {
        var playerCount = parseInt($('#playerCount').text());
        $('#playerCount').text(playerCount + 1)
    });
    socket.on('gameStart', function (user) {
        $("#main").html("<video id='cameraFeed'></video><canvas></canvas>");
        $("#cameraFeed").append("<a id='test' href='javascript:void(take_snapshot())'>Take Snapshot</a>");
        const video = document.querySelector('video');
        const canvas = window.canvas = document.querySelector('canvas');
        canvas.width = 480;
        canvas.height = 360;

        const button = document.getElementsByTagName('test');
        button.onclick = function () {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        };

        const constraints = {
            audio: false,
            video: true
        };

        function handleSuccess(stream) {
            window.stream = stream; // make stream available to browser console
            video.srcObject = stream;
        }

        function handleError(error) {
            console.log('navigator.getUserMedia error: ', error);
        }

        navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
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
            $("#main").html('<h2>Live game stats:</h2><table id="liveTable" class="table table-hover"> <thead> <tr> <th>Item #</th> <th>Item</th> <th>User</th> <th>Time</th> </tr> </thead> <tbody> <tr> <th>1</th> <td>Apple</td> <td> - </td> <td> - </td> </tr> <tr> <th>2</th> <td>Banana</td> <td> - </td> <td> - </td> </tr> <tr> <th>3</th> <td>uHack Logo</td> <td> - </td> <td> - </td> </tr> </tbody> </table>');
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