var mongoose = require('mongoose');
if(process.env.NODE_ENV !== 'production' ){
  require('dotenv').config();
}
var config = require('../config');

var db = mongoose.createConnection(config.DATABASE_URL);

var UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {type: String, required: true},
    githubId: {type: String},
    username: {type: String},
    userAccessToken: {type: String},
    lastUpdatedAt: {type: Date},
    status: {type: Boolean}
});

var User = db.model('User', UserSchema);

module.exports = User;