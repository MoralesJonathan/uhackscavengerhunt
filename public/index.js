$(function () {
    window.socket = io();
});
$("#main").on("click","#createRoom", function(){
    alert("CREATING ROOM")
})
$("#main").on("click","#joinRoom", function(){
    alert("JOINING ROOM")
})
$("#usernameForm").submit(function(e){
    e.preventDefault();
    var userName = $(this).find('input[name="username"]').val();
    console.log(userName)
    $("#main").html('<button id="createRoom">Create</button><button id="joinRoom">Join</button>');
})