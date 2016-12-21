var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    githubId: {type: String},
    username: {type: String},
    userAccessToken: {type: String},
    lastUpdatedAt: {type: Date},
    status: {type: String}
});

var User = mongoose.model('User', UserSchema);

module.exports = User;