const express=require('express')
const app=express()
const http = require('http').Server(app)
const io=require('socket.io')(http)
const path=require('path')
const hbs=require('hbs')


const port=process.env.PORT||3000

const pathToPublicDirectory=path.join(__dirname,'../public')
app.use(express.static(pathToPublicDirectory))
app.set('view engine','hbs')
app.set('views',path.join(__dirname,'../templates/views'))
hbs.registerPartials(path.join(__dirname,'../templates/partials'))

var idToSock=new Map([])
var sockToId=new Map([])
var onCall=new Map([])

app.get('',(req,res)=>{
    res.render('login_page')
})
app.get('/index',(req,res)=>{
    var uName=req.query.userName
    res.render('index',{userName: uName})
})

io.on('connection',(socket)=>{
    console.log('One user connected with id', socket.id)
    socket.on('socketEntry',data=>{
        console.log('I am in Socket Entry')
        idToSock.set(data,socket.id)
        sockToId.set(socket.id,data)
    })
    socket.on('searchId',data=>{
        console.log('I am in Search Id')
        socket.emit('searchResult',idToSock.get(data))
    })
    socket.on('request',socketId=>{
        io.to(socketId).emit('request',sockToId.get(socket.id))
    })
    socket.on('rejected',unqId=>{
        console.log(unqId)
        io.to(idToSock.get(unqId)).emit('rejected')
    })
    socket.on('accepted',unqId=>{
        console.log('accepted')
        var randRoom=Math.ceil(Math.random()*100000)
        socket.join(randRoom)
       // console.log(unqId)
        //console.log(onCall.get(unqId))
        //console.log(idToSock.get(unqId))
        io.to(onCall.get(unqId)).emit('accepted',randRoom)
    })
    socket.on('ready',room=>{
        socket.join(room)
        socket.broadcast.to(room).emit('ready',room)
    })
    socket.on('candidate',(event)=>{
        socket.broadcast.to(event.room).emit('candidate',event)
    })
    socket.on('offer',(event)=>{
        socket.broadcast.to(event.room).emit('offer',event.sdp)
    })
    socket.on('answer',(event)=>{
        socket.broadcast.to(event.room).emit('answer',event.sdp)
    })
    socket.on('onCall',(data)=>{
        console.log('I am on call')
        var caller1=data.caller1
        var caller2=data.caller2
        var sockId1=idToSock.get(caller1)
        var sockId2=idToSock.get(caller2)

        idToSock.delete(caller1)
        idToSock.delete(caller2)
        onCall.set(caller1,sockId1)
        onCall.set(caller2,sockId2)

        socket.emit('addedToOnCall')
    })
    socket.on('leaveCall',(data)=>{
        var caller1=data.caller

        onCall.delete(caller1)
    })
    socket.on('disconnect',()=>{
        idToSock.delete(sockToId.get(socket.id))
        onCall.delete(sockToId.get(socket.id))
        sockToId.delete(socket.id)
    })
})
http.listen(port,()=>{
    console.log('Server is running....')
})