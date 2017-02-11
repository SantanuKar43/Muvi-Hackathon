var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    fileupload = require('express-fileupload'),
    http = require('http'),
    server = http.createServer(app),
    indexRoute = require('./routes/index'),
    userRoute = require('./routes/user'),
    videoRoute = require('./routes/video'),
    session = require('client-sessions');

app.set('view engine','pug');
app.use(session({
    cookieName:'session',
    secret:'random_string',
    duration:30*60*1000,
    activeDuration:5*60*1000
}));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(fileupload());

app.use('/',indexRoute);
app.use('/user',userRoute);
app.use('/video',videoRoute);

server.listen(9000,function(){
    console.log('server running at localhost:9000');
})