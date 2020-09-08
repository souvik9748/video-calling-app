var searchButton=document.querySelector('#searchButton')
var addIdButton=document.querySelector('#addIdButton')
var searchButtonInput=document.querySelector('#searchButtonInput')
var unqIdInput=document.querySelector('#unqIdInput')
var form1=document.querySelector('#form1')
var form2=document.querySelector('#form2')
var form3=document.querySelector('#form3')
var form4=document.querySelector('#form4')
var localVideo=document.querySelector('#localVideo')
var remoteVideo=document.querySelector('#remoteVideo')
var dynamicName=document.querySelector('#dynamicName')
var yesButton=document.querySelector('#yesButton')
var noButton=document.querySelector('#noButton')
var hangUpButton=document.querySelector('#hangUp')
var socket=io()
var rtcPeerConnection
var localStream
var remoteStream
var roomNumber
var clientUnqId
var id

var iceServers={
    'iceServers':[
        {'urls':'stun:stun.services.mozilla.com'},
        {'urls':'stun:stun.l.google.com:19302'}
    ]
}

var streamConstraints={
    video:true,
    audio:true
}
hangUpButton.addEventListener('click',(e)=>{
   e.preventDefault()
   socket.emit('leaveCall',{caller:id})
   return location.reload(true)
})
yesButton.addEventListener('click',(e)=>{
        e.preventDefault()
        socket.emit('onCall',{caller1:id,caller2:clientUnqId})
})
noButton.addEventListener('click',(e)=>{
    e.preventDefault()
    form1.style.display='block'
        form2.style.display='block'
        form3.style.display='none'
        form4.style.display='none'
        socket.emit('rejected',clientUnqId)
})

window.onload=(e)=>{

    id=unqIdInput.value
    //console.log('on page load an id = ',id)
    return socket.emit('socketEntry',id)
}
form2.addEventListener('submit',e=>{
    e.preventDefault()
    var searchId=searchButtonInput.value
    return socket.emit("searchId",searchId)
})

socket.on('searchResult',data=>{
    console.log('I am in Search Result at client side')
    if(data)
    {
        //console.log('user found and can call')
        socket.emit('request',data)//data ke request pathao from 1
    }
    else
    alert('Not available at this moment!')
})

socket.on('request',data=>{//request asechhe from 1
    //console.log('requested')
    form4.style.display='block'
    form1.style.display='none'
    form2.style.display='none'
    clientUnqId=data
    dynamicName.innerHTML=clientUnqId
    /*if(confirm('Would you like to accept the call from '+data))
    {
        form3.style.display='block'
        form1.style.display='none'
        form2.style.display='none'
        
        //data ke bole dao accepted from 2
    }
    else{
        
    } */
})
socket.on('accepted',(room)=>{
    console.log("accepted")
    roomNumber=room
    form3.style.display='block'
    form1.style.display='none'
    form2.style.display='none'
    navigator.mediaDevices.getUserMedia(streamConstraints).then((stream)=>{
        localVideo.srcObject=stream
        localStream=stream
        console.log('localStream== ',localStream)
        socket.emit('ready',room)
    }).catch((error)=>{
        console.log('error: ',error)
    })
    
})
socket.on('rejected',()=>{
    console.log("rejected")
    alert('User rejected the call')
})
socket.on('ready',room=>{
    roomNumber=room
        rtcPeerConnection=new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate=onIceCandidate
        rtcPeerConnection.ontrack=onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)
        rtcPeerConnection.createOffer().then(sessionDescription=>{
            rtcPeerConnection.setLocalDescription(sessionDescription)
            console.log('sending offer',sessionDescription)
            socket.emit('offer',{
                room:roomNumber,
                sdp:sessionDescription,
                type:'offer'
            })
        }).catch((error)=>{
            console.log('error: ',error)
        })
})

socket.on('offer',otherSessionDescription=>{
    
        rtcPeerConnection=new RTCPeerConnection(iceServers)
            rtcPeerConnection.onicecandidate=onIceCandidate
            rtcPeerConnection.ontrack=onAddStream
            rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
            rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)
            rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(otherSessionDescription))
            rtcPeerConnection.createAnswer().then(sessionDescription=>{
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('answer',{
                    type:'answer',
                    sdp:sessionDescription,
                    room:roomNumber
                })
            }).catch((error)=>{
                console.log('error: ',error)
            })
    
})
socket.on('answer',otherSessionDescription=>{
    if(true)
    {
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(otherSessionDescription))

    }
})
socket.on('candidate',event=>{
    console.log('candidate')
    var candidate=new RTCIceCandidate({
        sdpMLineIndex:event.label,
        candidate:event.candidate
    })
    rtcPeerConnection.addIceCandidate(candidate)
})
socket.on('addedToOnCall',()=>{
        console.log('I am at add to on call')
        form1.style.display='none'
        form2.style.display='none'
        form3.style.display='block'
        form4.style.display='none'
        navigator.mediaDevices.getUserMedia(streamConstraints).then((stream)=>{
        localVideo.srcObject=stream
        localStream=stream
        console.log('localStream== ',localStream)
        console.log('bokachoda')
        socket.emit('accepted',clientUnqId)//checkkkkkkkkkkkkkkkkkkkkkkkkkkk
    }).catch((error)=>{
        console.log('error: ',error)
    })
})
function onAddStream(event)
{
        remoteVideo.srcObject=event.streams[0]
        remoteStream=event.streams[0]
}
function onIceCandidate(event)
{
    if(event.candidate)
    {
        console.log('sending ice candidate')
        socket.emit('candidate',{
            type:'candidate',
            label:event.candidate.sdpMLineIndex,
            id:event.candidate.sdpMid,
            candidate:event.candidate.candidate,
            room:roomNumber
        })
    }
}
