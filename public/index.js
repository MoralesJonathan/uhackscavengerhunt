$(function () {
    if (window.location.protocol == 'http:') {
        $('#ModalCenterTitle').text('Warning!')
        $('#modal .modal-body').html('<div class="container-fluid"> <div class="row"> <div class="col-12"> <h3>Notice: You are visiting this site using http and camera access will not work. Please visit the https version of this site <a href="https://secret-springs-39445.herokuapp.com/">by clicking here.</a></h3> </div> </div> </div>')
        $('#modal').modal('show')
    }
    $('#modal').modal({ focus: true })
    window.socket = io();
    $("#usernameForm input[type='text']")[0].oninvalid = function (e) {
        e.target.setCustomValidity("");
        if (!e.target.validity.valid) {
            e.target.setCustomValidity("Please enter a username");
        }
    };
    $("#usernameForm input[type='text']")[0].oninput = function (e) {
        e.target.setCustomValidity("");
    };
    socket.on('fitbitLog', function (result) {
        window.localStorage.setItem('fitbitLoggedIn', true);
        window.localStorage.setItem("profile", JSON.stringify(result));
    });
    socket.on('access_token', function (token) {
        window.localStorage.setItem("access_token", token);
    });
    socket.on('userJoin', function (user) {
        var playerCount = parseInt($('#playerCount').text());
        $('#playerCount').text(playerCount + 1);
        if ($("#startGame").attr('disabled')) $("#startGame").attr('disabled', false).removeClass('btn-secondary').addClass('btn-primary');
    });
    socket.on('findNextItem', function (item) {
        if (item == null) {
            if (!$('#liveTable').length) {
                window.location.replace('/chart');
            }
        }
        if ($('#liveTable').length) {
            var roomCode = localStorage.getItem('roomCode');
            console.log(roomCode)
            $.get('/scores/' + roomCode, function (items) {
                $("#liveTable").html(' <thead> <tr> <th>Item #</th> <th>Item</th> <th>User</th> <th>Time</th> </tr> </thead> <tbody> <tr> <th>1</th> <td>' + items[0].name + '</td> <td> ' + items[0].foundBy + ' </td> <td> ' + items[0].timeFound + ' </td> </tr> <tr> <th>2</th> <td>' + items[1].name + '</td> <td> ' + items[1].foundBy + ' </td> <td> ' + items[1].timeFound + ' </td> </tr> <tr> <th>3</th> <td>' + items[2].name + '</td> <td> ' + items[2].foundBy + ' </td> <td> ' + items[1].timeFound + '  </td> </tr>  <tr> <th>3</th> <td>' + items[3].name + '</td> <td> ' + items[2].foundBy + ' </td> <td> ' + items[1].timeFound + '  </td>  </tbody> ');
            })
        } else {
            $('.alert').addClass("show").slideDown(300);
            window.setTimeout(function () {
                $('.alert').removeClass("show").slideUp(300);
            }, 3000);
            $("#currentItemToFind").removeClass('right')
            localStorage.setItem('roundStart', new Date());
            console.log(item)
            localStorage.setItem('currentItem', item.itemNumber);
            $("#currentItemToFind").html("Item to find: " + item.name);
        }
    })
    socket.on('gameStart', function (items, setNumber) {
        localStorage.setItem('roundStart', new Date());
        localStorage.setItem('currentItem', "1");
        localStorage.setItem('setNumber', setNumber);
        $("#main").html('');
        $(".container").eq(0).prepend("<div id='inGameFooter'><div class='row'><div class='col'><center><button type='button' class='btn btn-outline-primary' id='takePicture'>Take Snapshot</button><span id='currentItemToFind'>Item to find: " + items[0].name + "</span><center></div></div></div>");
        var video = document.getElementById('cameraFeed');
        var canvas = window.canvas = document.querySelector('canvas');
        canvas.width = 1;
        canvas.height = 1;

        var button = document.getElementById('takePicture');
        button.onclick = function () {
            canvas.width = video.videoWidth / 3;
            canvas.height = video.videoHeight / 3;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            var data = canvas.toDataURL('image/png');
            var roomCode = localStorage.getItem('roomCode');
            $.post('/predict', { 'img': data.split('data:image/png;base64,')[1], "room": roomCode }, function (response) {
                if (response) {
                    $("#currentItemToFind").addClass('right')
                    var username = localStorage.getItem('userName');
                    var foundItem = localStorage.getItem('currentItem');
                    var setNumber = localStorage.getItem('setNumber');
                    var roundStart = localStorage.getItem("roundStart")
                    var roundEnd = new Date();
                    var roundElapsed = roundEnd.getTime() - new Date(roundStart).getTime();
                    roundElapsed = roundElapsed / 1000;
                    socket.emit('itemFound', roomCode, username, foundItem, roundElapsed, setNumber)
                }
                else {
                    for (var x = 0; x < 6; x++) {
                        setTimeout(function () {
                            $("#currentItemToFind").toggleClass('wrong');
                        }, x * 500);
                    }
                }
            })
        };
        var constraints = {
            audio: false,
            video: {
                facingMode: "environment"
            }
        };

        function handleSuccess(stream) {
            window.stream = stream;
            video.srcObject = stream;
        }

        function handleError(error) {
            console.log('navigator.getUserMedia error: ', error);
        }

        navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
    });
    socket.on('closeRoom', function (user) {
        $('#ModalCenterTitle').text('Oh no!');
        $('#modal .modal-body').html('<div class="container-fluid"> <div class="row"> <div class="col-12"> <p>Host has closed the connection. You will now return to the menu.</p></div> </div> </div>')
        $('#modal button.footer-btn').text('Ok');
        $('#modal').modal('show');
        $('#modal').on('hide.bs.modal', function (e) {
            location.reload();
        })

    });
});
$("#main").on("click", "#createRoom", function () {
    socket.emit('createRoom', $(this).attr('data-username'), function (roomCode) {
        if (roomCode !== null) {
            localStorage.setItem('roomCode', roomCode);
            $("#main").html("<h1>Your room code is: <strong>" + roomCode + "</strong></h1><p><span id='playerCount'>1</span> Players connected. Waiting for others...</p><button class='btn btn-secondary' id='startGame' data-roomCode='" + roomCode + "' disabled> Start Game </button>");
        } else {
            $('#ModalCenterTitle').text('Error!');
            $('#modal .modal-body').html('<div class="container-fluid"> <div class="row"> <div class="col-12"> <p>Error creating room please refresh the page and try again.</p></div> </div> </div>')
            $('#modal button.footer-btn').text('Ok');
            $('#modal').modal('show');
        }
    });
})
$("#main").on("click", "#joinRoom", function () {
    $('#ModalCenterTitle').text('Enter room code');
    $('#modal .modal-body').html('<div class="container-fluid"> <div class="row"> <div class="col-12"> <input type="text" id="joinCode" /> </div> </div> </div>')
    $('#modal').modal('show');
    $('#modal div.modal-dialog.modal-dialog-centered').addClass('modal-sm');
    $('#modal button.footer-btn').text('Join').click(function () {
        var code = $('input#joinCode').val();
        $('#modal div.modal-dialog.modal-dialog-centered').removeClass('modal-sm');
        socket.emit('joinRoom', $(this).attr('data-username'), code, function (roomCode) {
            console.log('yooo')
            if (roomCode !== null && roomCode !== false) {
                localStorage.setItem('roomCode', roomCode);
                $("#main").html("<h1>Joined room code " + roomCode + "</h1><p><span id='playerCount'>1</span> Players connected.</p><p>Waiting for game to start...</p>");
            } else if (roomCode == false) {
                $('#ModalCenterTitle').text('Whoops!');
                $('#modal .modal-body').html('<div class="container-fluid"> <div class="row"> <div class="col-12"> <p>Sorry that room is full or in session! Try again later.</p></div> </div> </div>')
                $('#modal').modal('show');
            } else {
                $('#ModalCenterTitle').text('Error');
                $('#modal .modal-body').html('<div class="container-fluid"> <div class="row"> <div class="col-12"> <p>Error joining game. Try again later.</p></div> </div> </div>')
                $('#modal').modal('show');
            }

        });
    });
})
$("#main").on("click", "#startGame", function () {
    socket.emit('startGame', $(this).attr('data-roomCode'), function (items) {
        if (items !== null) {
            $("#main").html('<h2>Live game stats:</h2><table id="liveTable" class="table table-hover"> <thead> <tr> <th>Item #</th> <th>Item</th> <th>User</th> <th>Time</th> </tr> </thead> <tbody> <tr> <th>1</th> <td>' + items[0].name + '</td> <td> - </td> <td> - </td> </tr> <tr> <th>2</th> <td>' + items[1].name + '</td> <td> - </td> <td> - </td> </tr> <tr> <th>3</th> <td>' + items[2].name + '</td> <td> - </td> <td> - </td> </tr>  <tr> <th>3</th> <td>' + items[3].name + '</td> <td> - </td> <td> - </td>  </tbody> </table>').css("width", "50%");
        } else {
            $('#ModalCenterTitle').text('Error!');
            $('#modal .modal-body').html('<div class="container-fluid"> <div class="row"> <div class="col-12"> <p>There was an error starting the game. Please try again later.</p></div> </div> </div>')
            $('#modal button.footer-btn').text('Ok');
            $('#modal').modal('show');
        }
    });
});
$("#usernameForm").submit(function (e) {
    e.preventDefault();
    var userName = $(this).find('input[name="username"]').val();
    localStorage.setItem('userName', userName);
    $("#main").html('<div class="text-center"><h2>Hi ' + userName + '!</h2><h4>Please pick one of the two options:</h4></div><br/><div class="row"><div class="col-6 text-center"><button class="btn btn-outline-primary" id="createRoom" data-username="' + userName + '">Create a room</button></div><div class="col-6 text-center"><button class="btn btn-outline-primary" id="joinRoom" data-username="' + userName + '">Join a room</button></div>');
})