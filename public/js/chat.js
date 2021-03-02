const socket = io()

const form = document.getElementById('message-form');
const messageFormInput = form.querySelector('input')
const messageFormButton = form.querySelector('button')
const sendLocationButton = document.querySelector('#send-location')
const messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTeamplate = document.querySelector("#sidebar-template").innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () => {
    const $newMessage = messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = messages.offsetHeight

    const contentHeight = messages.scrollHeight 

    const scrollOffset = messages.scrollTop + visibleHeight

    if (contentHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', ({username, text, createdAt}) => {
    console.log(text)
    const html = Mustache.render(messageTemplate, {
        username,
        message: text,
        createdAt: moment(createdAt).format('h:mm A')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', ({username, url, createdAt}) => {
    const html = Mustache.render(locationTemplate, {
        username,
        link: url,
        createdAt: moment(createdAt).format('h:mm A')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTeamplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

form.addEventListener('submit', (e) => {
    e.preventDefault()

    messageFormButton.setAttribute('disabled', 'disabled')

    const messageField = e.target.elements.message
    socket.emit('sendMessage', messageField.value, (error) => {
        messageFormButton.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered')
    })
})

sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
   
    sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const coordinates = {
            long: position.coords.longitude,
            lat: position.coords.latitude
        }
        socket.emit('sendLocation', coordinates, () => {
            sendLocationButton.removeAttribute('disabled')
            console.log("Location shared")
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})