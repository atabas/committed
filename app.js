// for backend
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

require('dotenv').config();

var config = require('./config');
var passport = require('passport');
var User = require('./models/user');

var app = express();
app.use(bodyParser.json());
app.use(express.static('build'));

var GitHubStrategy = require('passport-github').Strategy;
var request = require('request');
var cron_email= require('./js/cron_email');
var BasicStrategy = require('passport-http').BasicStrategy;

var strategy = new BasicStrategy(function(username, password, callback) {
  User.findOne({
    username: username
  }, function (err, user) {
    if (err) {
      callback(err);
      return;
    }

    if (!user) {
      return callback(null, false, {message: 'Incorrect username.'});
    }

    if (user.userAccessToken === password) {
      return callback(null, user);
    }
    else{
      return callback(null, false, {message: 'Incorrect password.'});
    }
  });
});

passport.use(strategy);

passport.use(new GitHubStrategy({
    clientID: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOneAndUpdate({ githubId: profile.id },{$set:{githubId:profile.id, name: profile.displayName, username: profile.username, userAccessToken: accessToken}}, {new: true, upsert:true}, function (err, user) {
      return cb(err, user);
    });
  }
));

app.use(require('cookie-parser')());
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, cb) {
  cb(null, user._id);
});

passport.deserializeUser(function(obj, cb) {
  User.findById(obj,function(err, data){
    cb(null, data);
    console.log("deserialized user: ",data);
  });
});


app.get('/auth/github',
  passport.authenticate('github', { scope: 'repo' }));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/#/userLogin/'+req.user.userAccessToken+'/'+req.user.username);  
  });

app.get('/current_user', passport.authenticate('basic'), function(req, res){

  var options = {
    url: "https://api.github.com/user/repos?acess_token="+req.user.userAccessToken,
    headers: {
      'User-Agent': 'request',
      'Authorization': 'token '+req.user.userAccessToken
    } 
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      res.json(info);
    }
  }
  
  request(options, callback);
});


app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

var runServer = function(callback) {
  mongoose.connect(config.DATABASE_URL, function(err) {
    if (err && callback) {
      return callback(err);
    }

    app.listen(config.PORT, function() {
      console.log('Listening on localhost:' + config.PORT);
      if (callback) {
        callback();
      }
    });
  });
};

if (require.main === module) {
  runServer(function(err) {
    if (err) {
      console.error(err);
    }
  });
};

exports.app = app;
exports.runServer = runServer;