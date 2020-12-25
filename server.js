const app = require('express')();
const http = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(http);
const fs = require('fs').promises;

const PORT = 8888;
const WEBROOT = 'public';

let userArray = [];
let socketArray = [];
let colorArray = [];

// Send main file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, WEBROOT, 'index.html'));
});

// Ignore
app.get('/*', (req, res) => {
    if (path.parse(req.url).base !== 'favicon.ico') res.sendFile(path.join(__dirname, WEBROOT, path.parse(req.url).dir, path.parse(req.url).base));
});

io.on('connection', (socket) => {
    let userColor = Math.floor(Math.random() * 16777215).toString(16);

    colorArray.forEach((color, i) => {
        while (userColor === color) {
            userColor = Math.floor(Math.random() * 16777215).toString(16);
            colorArray[i] = userColor;
        }
    });

    // when a new user enters
    socket.on('newUsername', (username) => {
        userArray[socket.id] = username;
        socketArray[username] = socket.id;

        console.log(userArray);
        console.log(socketArray);

        // Send Response
        io.emit('newChatUser', `${userArray[socket.id]} has entered the chat`);

        socket.emit('getColor', userColor);
    });

    socket.on('changeColor', (newColor) => {
        userColor = newColor;
        io.emit('colorChangeMsg', `${userArray[socket.id]} has changed their color`, userColor);
    });

    //disconnect function
    socket.on('disconnect', () => {
        io.emit('disconnect', `${userArray[socket.id]} has left the chat`);

        delete socketArray[userArray[socket.id]];
        delete userArray[socket.id];

        console.log(userArray);
        console.log(socketArray);
        console.log(`${io.engine.clientsCount} connections`);
    });

    //new message
    socket.on('newMessage', (msg, msgDate) => {
        console.log(`Message from ${userArray[socket.id]}: ${msg}`);
        io.emit('chat', userArray[socket.id], msg, userColor);

        // log
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1 < 10 ? '0' + date.getMonth() + 1 : date.getMonth() + 1;
        let day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();

        let filename = `${year}${month}${day}events.log`;

        fs.appendFile(`./logs/${filename}`, `Date: ${msgDate} | Message from "${userArray[socket.id]}" | Message length: ${msg.length}\n`)
            .then(() => {
                console.log(`Data has been saved to ${filename}`);
            })
            .catch((err) => {
                console.log(`Error: ${err.code} ${err.message}`);
            });
    });

    // new private message
    socket.on('private', (sendTo, privateMsg) => {
        if (sendTo in socketArray && socket.id != socketArray[sendTo]) {
            io.to(socketArray[sendTo]).emit('privateMsg', userArray[socket.id], sendTo, privateMsg, userColor);
            socket.emit('privateMsg', userArray[socket.id], sendTo, privateMsg, userColor);
            console.log(socketArray[sendTo]);

            // log
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1 < 10 ? '0' + date.getMonth() + 1 : date.getMonth() + 1;
            let day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();

            let filename = `${year}${month}${day}events.log`;

            fs.appendFile(`./logs/${filename}`, `${msgDate} | Message from ${userArray[socket.id]} | Message to ${sendTo} | Message length: ${msg.length}\n`)
                .then(() => {
                    console.log(`Data has been saved to ${filename}`);
                })
                .catch((err) => {
                    console.log(`Error: ${err.code} ${err.message}`);
                });
        } else {
            socket.emit('selfMessage', 'You cannot send a message to yourself');
        }
    });

    setInterval(() => {
        let numUsers = io.engine.clientsCount;
        io.emit('numUsers', numUsers);
    }, 1000);
});

http.listen(PORT, () => {
    console.log(`Chat server running on port: ${PORT}`);
});