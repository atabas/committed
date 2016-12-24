exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                       (process.env.NODE_ENV === 'production' ?
                            'mongodb://localhost/committed' :
                            'mongodb://localhost/committed-dev');
exports.PORT = process.env.PORT || 8080;

exports.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
exports.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
exports.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

exports.CALLBACK_URL = 
  (process.env.NODE_ENV === 'production' ? 
    'https://dry-retreat-90962.herokuapp.com/auth/github/callback' : 
    'http://localhost:8080/auth/github/callback');