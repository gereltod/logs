$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', {
            text: 'Sorry, but your browser doesn\'t '
                + 'support WebSockets.'
        }));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('ws://192.168.1.6:83/ws');

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Connected');
    };

    connection.onerror = function (error) {
        startcounting();
        content.html($('<p>', {
            text: 'Sorry, but there\'s some problem with your '
                + 'connection or the server is down.'
        }));
    };

    connection.onmessage = function (message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        if (json.type === 'color') {
            myColor = json.data;
            status.text(myName + ': ').css('color', myColor);
            input.removeAttr('disabled').focus();

        } else if (json.type === 'history') {

            for (var i = 0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text,
                    json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === 'logs') {
            input.removeAttr('disabled');

            addMessageLogs(json.id, json.name, json.log, json.date);
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    input.keydown(function (e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }

            connection.send(msg);
            $(this).val('');

            input.attr('disabled', 'disabled');

            if (myName === false) {
                myName = msg;
            }
        }
    });

    var startcounting1 = setInterval(function () {
        content.empty();
    }, 65000);

    var startcounting = setInterval(function () {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                + 'with the WebSocket server.');           
        }
    }, 3000);

    function addMessage(author, message, color, dt) {
        content.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
            + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
            + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
            + ': ' + message + '</p>');
    }

    function addMessageLogs(id, name, message, date1) {
        content.prepend('<p style="white-space: pre-line"><span style="font-weight: bold;display: block;cursor: pointer;text-decoration: none;color: #07C">' + id + '-' + name + '</span> ' + message + '</p>');
        //ClearData();
        var date = new Date(date1);
        var d = ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
            ("00" + date.getDate()).slice(-2) + "/" +
            date.getFullYear() + " " +
            ("00" + date.getHours()).slice(-2) + ":" +
            ("00" + date.getMinutes()).slice(-2) + ":" +
            ("00" + date.getSeconds()).slice(-2);
        

        content.prepend('            ************' + d + '*******     ');
    }
});