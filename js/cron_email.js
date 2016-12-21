var schedule = require('node-schedule');
var User = require('../models/user');
var request = require('request');
var moment = require('moment');
var whilst = require('async/whilst');

var j = schedule.scheduleJob('*/10 * * * * *', function(){
  User.find({}).then(function(data){
    data.forEach(function(user){
      console.log("before async");
      var count = 0;
      var found = false;
  
      getAllUserRepos(user.username, user.userAccessToken, function(error, response, body) {  
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          console.log({full_name: info[0].full_name, username: user.username, userAccessToken: user.userAccessToken, user_id: user.id});
          whilst(
            function() { console.log(count, found); return count < (info.length)-1 && count < 50 && found == false; },
            function(callback) {
              //setTimeout( function() {
                console.log("COUNT IS ",count);
                try{
                  getRepoInfo(info[count].full_name, user.username, user.userAccessToken, function(error, response, body) {
                    count++;
                    console.log("full name is:   ",info[count].full_name);
                    if (!body){
                      return callback(null, count);
                    }
                    console.log("repo name is here : ",info[count].full_name);
                    var single_repo = JSON.parse(body);
                    

                    if(moment(single_repo[0].commit.author.date).isSame(new Date(),'day' )){
                      updateUserInfo(user.user_id);
                      found = true;
                      console.log("updated !")
                      callback(null, count);
                    }
                    else{
                      callback(null, count);
                    }
                  });//getRepoInfo 
                }
                catch(error){
                  console.log(error);
                  callback(null, count);
                }      
              //}, 0 );
            },
            function (err, n) {
              console.log("_______error_______", err);
                // 5 seconds have passed, n = 5
            }
          );//whilst
        }//response block
      });//getAllUserRepos
    });//data
  });//User
  console.log("after async");
});

function getRepoInfo(repo_name, username, userAccessToken, callback){
  var url_to_go = "https://api.github.com/repos/"+repo_name+"/commits?author="+username+"&access_token="+userAccessToken;
  var options = {
    //https://api.github.com/repos/atabas/pictionary/commits?author=atabas
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

function updateUserInfo(id){
  User.findOneAndUpdate({id: id}, {$set: {lastUpdatedAt: new Date(), status: "committed today"} });
}