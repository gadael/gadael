/**
 * Module to create a new config object
 * @return object
 */
exports = module.exports = function createConfiguration() {

    'use strict';

    var config = {};

    config.loghttp = false;
    config.csrfProtection = true;

    config.url = 'https//demo.gadael.com';      // used by oauth2 callback url
                                                // and links in Emails

                                                // where the http server accept connexion to
    config.host = 'localhost';                  // if host undefined: any host
    config.port = process.argv[2] || 3000;
    config.mongodb = {
        prefix: 'localhost/',
        dbname: process.argv[3] || 'gadael'
    };

    config.company = null;      // The company document will be here after server start
    config.language = 'fr';     // this should match a po file in /po/server

    // used for sessions
    config.cryptoKey = 'k8yb0brda2t';
    config.loginAttempts = {
        forIp: 50,
        forIpAndUser: 7,
        logExpiration: '20m'
    };
    config.requireAccountVerification = false;

                                // http://nodemailer.com/
    config.mailtransport = {    // must match nodemailer options format:
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,           // use SSL
        auth: {
            user: 'user@gmail.com',
            pass: 'pass'
        }
    };

    config.oauth = {
        google: {
            key: process.env.GOOGLE_OAUTH_KEY || '',
            secret: process.env.GOOGLE_OAUTH_SECRET || ''
        }
    };

    config.staticPath = require('path').join(__dirname, 'public');
    config.indexFile = 'index.html'; // This file load the optimized requirejs file,
                                     // index-dev.html will load main.js, without optimization


    config.inactivityTimeout = null; // Minutes

    return config;
};
