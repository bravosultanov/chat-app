const path = require('path')
const express = require('express')
const http = require('http');
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocation} = require('./utils/messages')
const {addUser, removeUser, getUsersInRoom, getUser} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server)

const PORT = process.env.PORT || 3000
const publiceDirectoryPath = path.join(__dirname, '../public')


app.use(express.static(publiceDirectoryPath))

io.on('connection', (socket) => {
    console.log("New websocket connection")

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', "Welcome!"))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
        // socket.emit, io.emit, socket.broadcasr.emit
        // io.ro.emit, socket.broadcast.to.emit
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        // socket.emit('countUpdated', count)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed!")
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', ({long, lat}, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocation(user.username, `https://google.com/maps?q=${lat},${long}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(PORT,() => {
    return console.log("Server is up on "+ PORT)
})