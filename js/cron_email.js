var schedule = require('node-schedule');
var User = require('../models/user');
var request = require('request');
var moment = require('moment');
var whilst = require('async/whilst');
var nodemailer = require('nodemailer');

if(process.env.NODE_ENV !== 'production' ){
  require('dotenv').config();
}
var config = require('../config');

//var j = schedule.scheduleJob('00 */3 19 * * *', function(){
var start_cron = function(){
  console.log("cron started");

  User.find({}).then(function(data){
    console.log("users");
    data.forEach(function(user){
      var count = 0;
      var found = false;
  
      getAllUserRepos(user.username, user.userAccessToken, function(error, response, body) {  
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          whilst(
            function() { return count < (info.length)-1 && count < 50 && found == false; },
            function(callback) {
              try{
                getRepoInfo(info[count].full_name, user.username, user.userAccessToken, function(error, response, body) {
                  count++;
                  if (!body || body=='[]'){
                    return callback(null, count);
                  }
                  var single_repo = JSON.parse(body);

                  if(moment(single_repo[0].commit.author.date).isSame(new Date(),'day' )){
                    updateUserInfo(user._id, true);
                    found = true;
                    console.log("---------WOO YOU HAVE BEEN UPDATED !-----------")
                    // Testing by commenting out
                    //callback(null, count);
                  }
                  else{
                    callback(null, count);
                  }
                });//getRepoInfo 
              }
              catch(error){
                callback(null, count);
              }      
            },
            function (err, n) {
              updateUserInfo(user._id, false);
              send_reminder_email(user);
            }
          );//whilst
        }//response block
      });//getAllUserRepos
    });//data
  });//User
};

function getRepoInfo(repo_name, username, userAccessToken, callback){
  var url_to_go = "https://api.github.com/repos/"+repo_name+"/commits?author="+username+"&access_token="+userAccessToken;
  var options = {
    url: url_to_go,
    headers: {
      'User-Agent': 'request',
      'Authorization': 'token '+userAccessToken
    } 
  }; 
  return request(options, callback);
}

function getAllUserRepos(username, userAccessToken, callback){
  var url_all_repos = "https://api.github.com/user/repos?access_token="+userAccessToken;
  var options = {
    url: url_all_repos,
    headers: {
      'User-Agent': 'request',
      'Authorization': 'token '+userAccessToken
    } 
  };
  return request(options, callback);
}

function updateUserInfo(id, status){
  User.findOneAndUpdate({_id: id}, {$set: {lastUpdatedAt: new Date(), status: status} },
  function(error, data){
    console.log("Error is ",error, " data is ", data);
  });
}

function send_reminder_email(user){
  // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport('smtps://anika01%40gmail.com:'+config.EMAIL_PASSWORD+'@smtp.gmail.com');

  var mailOptions = {
    from: '"Anika 👥" <anika01@gmail.com>', 
    to: user.email, 
    subject: ' Reminder to commit ✔', 
    text: 'You have not pushed code today 🐴', // plaintext body
    html: '<b>Do it🐴</b>' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}

exports.start_cron = start_cron;
