const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const EventEmitter = require('events');
const cookieParser = require('cookie-parser');
const flash = require('flash');
const port = process.env.PORT || 5000;
const session = require('express-session');
const screenName = 'tonyejack1';
const app = express();
const fs = require('fs');
const timeAgo = require('./public/js/time-ago.js');
const auth = require('./public/js/config.js');
const Twit = require('twit');
const authConfig = auth.config;
const multer = require('multer');
const upload = multer();
const T = new Twit(authConfig);
const templates = path.join(__dirname, 'templates');
const staticFiles = path.join(__dirname, '/public' );


// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');


app.use('/static',express.static(staticFiles));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('view engine', 'jade');
app.set('views', templates);
app.use(cookieParser('keyboard cat'));
app.use(session({
   secret: 'keyboard cat',
    resave: true,
    saveUninitialized:true}));
// use  the flash middleware
app.use(flash());

var streamTweets = T.stream('statuses/home_timeline');

app.get('/home', function(req, res){
   res.sendFile('index.html', {root: __dirname});
});


app.get('/sign-in', function (req, res) {
   res.render('sign_in')
});

app.get('/', function(req, res){
    res.redirect('/sign-in');
});

app.get('/user', upload.array(), function (req, res) {
    var timeLineData = [], followersData = [];
    setImmediate(function () {
        T.get('statuses/home_timeline').catch(function(err){
            console.error(err);
        }).then(function (result) {
            if (result.resp.statusCode === 200){
                timeLineData = result.data;
            }
            // Get the followers from twitter
            T.get('followers/list', { screen_name: screenName, count: 20 }).catch(function(err) {
                console.error(err);
            }).then(function(result){
                 if (result.resp.statusCode === 200){
                     followersData = result.data.users;
                 }
                res.render('index_',
                            {handle: screenName, timeLines: timeLineData,
                             followers : followersData,
                             followersCount: followersData.length,
                             timeAgo : timeAgo});
            })
        })
    });
});


app.post('/sign-in', upload.array(), function (req, res, next) {
    var body, name, password;
    body = req.body;
    name = body.user_name;
    password = body.password;

    if(name === undefined || password === undefined || password === '' || name === ''){
        res.redirect('/sign-in');
    }else{
        console.log(name, password);
        // T.get('account/verify_credentials',
        res.redirect('/user');
    }
});


app.get('/sign-in', function (req, res) {
    var user = {handle: 'Tommy'};
    res.render('sign_in', {user: user});
});

app.post('/post-tweet', upload.array() , function (req, res, next) {
    var body, tweet, success, msg;
    body = req.body;
    tweet = body['text-area'];

    if (tweet !== undefined && tweet !== ""){
        setImmediate(function () {
            T.post('statuses/update', {status: tweet}, function (err, data, response) {
                if (err) {
                    msg = 'Tweet Unable to be delivered';
                    console.error(err);
                    res.flash('error', msg);
                } else{
                    msg = 'Tweet Sent';
                    res.flash('info', msg);
                }
                res.redirect('/user');
            });
        });
    }else{
        res.redirect('back');
    }
});

//
// T.post('statuses/update', {status: 'Testing twitter api'},
// function(err, data, response){
//     if (err) console.error(err);
//     console.log(data);
//     console.dir(response);
// });





app.listen(port, function () {
    console.log("Server running on port %d", port);
});
