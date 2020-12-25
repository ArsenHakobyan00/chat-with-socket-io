const $$ = (el) => document.querySelector(el);

const trickyForm = $$('#username-form');
const trickyTricksBox = $$('.tricky-form-container');
const explanationBox = $$('.explanation-box');
const explanationBtn = $$('.explanation-btn');

const msgBox = $$('.msg-input');
const msgForm = $$('#msg-form');
const chatMsgArea = $$('.messages');

let socket = io();

window.addEventListener('load', () => {
    trickyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let username = e.target[0].value;

        if (username.indexOf(' ') != -1) {
            show(explanationBox);
            explanationBtn.style.backgroundColor = 'red';
        } else if (username.length != 0) {
            socket.emit('newUsername', username);
            $$('#currentUser').innerHTML = username;
        }

        socket.on('newChatUser', (msg) => {
            hide(trickyTricksBox);
            show($$('.chatArea'));
            let msgDisplay = document.createElement('div');
            msgDisplay.classList.add('message');
            msgDisplay.innerHTML = msg;
            chatMsgArea.appendChild(msgDisplay);
            console.log(msg);
        });

        socket.on('numUsers', (numUsers) => {
            $$('#numUsers').innerHTML = numUsers;
        });

        socket.on('getColor', (color) => {
            $$('#changeColor').style.backgroundColor = '#' + color;
        });
    });

    msgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (msgBox.value.charAt(0) === '!') {
            let msg = msgBox.value;
            let sendTo = msg.substring(1, msg.indexOf(' '));
            let privateMsg = msg.substring(sendTo.length + 1).trim();
            msgBox.value = '';
            socket.emit('private', sendTo, privateMsg);
        } else if (msgBox.value.trim().length != 0) {
            socket.emit('newMessage', msgBox.value, getDate());
            msgBox.value = '';
        }
    });

    socket.on('chat', (username, message, color) => {
        let msgDisplay = document.createElement('div');
        msgDisplay.classList.add('message');

        let userField = document.createElement('span');
        userField.classList.add('user-field');
        userField.innerHTML = username;

        let msg = document.createElement('span');
        msg.classList.add('msg-box');
        msg.style.backgroundColor = '#' + color;
        msg.style.color = '#' + invertHex(color);
        msg.innerHTML = message;

        msgDisplay.appendChild(userField);
        msgDisplay.appendChild(msg);

        chatMsgArea.appendChild(msgDisplay);
        resetScrollBar();
    });

    socket.on('privateMsg', (username, messageTo, message, color) => {
        let msgDisplay = document.createElement('div');
        msgDisplay.classList.add('message');

        let userField = document.createElement('span');
        userField.classList.add('user-field');
        userField.innerHTML = `${username} -> ${messageTo} `;

        let msg = document.createElement('span');
        msg.classList.add('msg-box');
        msg.style.backgroundColor = '#' + color;
        msg.style.color = '#' + invertHex(color);
        msg.innerHTML = message;

        msgDisplay.appendChild(userField);
        msgDisplay.appendChild(msg);

        chatMsgArea.appendChild(msgDisplay);
        resetScrollBar();
    });

    socket.on('selfMessage', (msg) => {
        alert(msg);
    });

    socket.on('disconnect', (msg) => {
        if (msg.indexOf('undefined') === -1) {
            let msgDisplay = document.createElement('div');
            msgDisplay.innerHTML = msg;
            msgDisplay.classList.add('message');

            chatMsgArea.appendChild(msgDisplay);
            resetScrollBar();
        }
    });

    socket.on('colorChangeMsg', (msg, color) => {
        let msgDisplay = document.createElement('div');
        msgDisplay.innerHTML = msg;
        msgDisplay.classList.add('message');
        msgDisplay.style.backgroundColor = `#${color}`;

        chatMsgArea.appendChild(msgDisplay);
        resetScrollBar();
    });

    $$('body').addEventListener('click', (e) => {
        if (explanationBtn.contains(e.target) === false) hide(explanationBox);
        else {
            toggle(explanationBox);
        }
    });

    $$('#changeColor').addEventListener('click', (e) => {
        changeColor(e);
    });

    $$('.btnOpen').addEventListener('click', (e) => {
        show($$('.chat'));
        resetScrollBar();
    });

    $$('.btnClose').addEventListener('click', (e) => {
        hide($$('.chat'));
    });
});

let invertHex = (hex) => {
    // Source: https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
    return (Number(`0x1${hex}`) ^ 0xffffff).toString(16).substr(1).toUpperCase();
};

let changeColor = (e) => {
    console.log(e.target.style.backgroundColor);
    let newColor = Math.floor(Math.random() * 16777215).toString(16);
    e.target.style.backgroundColor = '#' + newColor;
    socket.emit('changeColor', newColor);
};

let resetScrollBar = () => {
    $$('.messages').scrollTop = $$('.messages').scrollHeight - $$('.messages').clientHeight;
};

let show = (el) => {
    el.style.display = 'block';
};

let hide = (el) => {
    el.style.display = 'none';
};

let toggle = (el) => {
    if (window.getComputedStyle(el).display === 'block') {
        hide(el);
        return;
    }
    show(el);
};

let getDate = () => {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1 < 10 ? '0' + date.getMonth() + 1 : date.getMonth() + 1;
    let day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    let seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};
