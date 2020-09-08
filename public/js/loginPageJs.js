var loginButton=document.querySelector('#loginButton')
var userName=document.querySelector('#userName')
var password=document.querySelector('#password')
var uName
loginButton.addEventListener('click',(e)=>{
    var uName=userName.value
    var url="/index?userName="+uName
    location.replace(url)
})