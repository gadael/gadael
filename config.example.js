/**
 * Module to create a new config object
 * @return object
 */
exports = module.exports = function createConfiguration() {

    'use strict';

    // require('longjohn');

    var config = {};

    config.loghttp = false;
    config.csrfProtection = true;

    config.port = process.argv[2] || 3000;
    config.mongodb = {
        prefix: 'localhost/',
        dbname: 'inga'
    };

    config.companyName = 'Default company';
    config.projectName = 'Inga';
    config.systemEmail = 'your@email.addy';
    config.cryptoKey = 'k8yb0brda2t';
    config.loginAttempts = {
      forIp: 50,
      forIpAndUser: 7,
      logExpiration: '20m'
    };
    config.requireAccountVerification = false;
    config.smtp = {
      from: {
        name: process.env.SMTP_FROM_NAME || exports.projectName +' Website',
        address: process.env.SMTP_FROM_ADDRESS || 'your@email.addy'
      },
      credentials: {
        user: process.env.SMTP_USERNAME || 'your@email.addy',
        password: process.env.SMTP_PASSWORD || 'bl4rg!',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        ssl: true
      }
    };
    config.oauth = {
      google: {
        key: process.env.GOOGLE_OAUTH_KEY || '',
        secret: process.env.GOOGLE_OAUTH_SECRET || ''
      }
    };

    config.staticPath = require('path').join(__dirname, 'public');

    return config;
};

