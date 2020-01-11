/**
 * Module to create a new config object
 * @return object
 */
exports = module.exports = function createConfiguration() {

    'use strict';

    var config = {};

    config.loghttp = false;
    config.csrfProtection = true;
    config.postpone = true;                     // postpone some tasks after HTTP result in REST service
                                                // postpone=false for unit tests but true in production for speed
    config.useSchudeledRefreshStat = false;     // Set to true to schedule stat refresh every hours

    config.url = 'http://localhost:3000/';      // used by oauth2 callback url
                                                // and links in Emails

                                                // where the http server accept connexion to
    config.host = 'localhost';                  // if host undefined: any host
    config.port = 3000;
    config.mongodb = {
        init: false,                            // database initialisation on first connexion, setting used for packaged version DEB or RPM
        prefix: 'localhost/',
        dbname: 'gadael',
        autoIndex: true,
        removeIndex: (-1 !== process.argv.indexOf('removeIndex'))   // Remove index on start, autoIndex must be
                                                                    // true to recreate the index in background
    };

    config.company = null;      // The company document will be here after server start (do not modify)
    config.language = 'fr';     // this should match a po file in /po/server

    // used for sessions
    config.cryptoKey = 'k8yb0brda2t';
    config.loginAttempts = {
        forIp: 50,
        forIpAndUser: 7,
        logExpiration: '20m'
    };
    config.requireAccountVerification = false;

    // Send emails using the nodemail transport options (http://nodemailer.com/)
    // default use the localhost smtp server
    config.mailtransport = {
        host: 'localhost'
    };

    // Here is an example with a gmail account
    // config.mailtransport = {
    //     host: 'smtp.gmail.com',
    //     port: 465,
    //     secure: true,           // use SSL
    //     auth: {
    //         user: 'user@gmail.com',
    //         pass: 'pass'
    //     }
    // };


    // Configure the from email address
    // The gadael domain must match the email domain
    // or the gadel domain must be authenticated as an allowed server for this
    // email domain using DKIM and SPF
    config.mailfrom = {
        name: 'Gadael email',
        address: 'gadael@example.com'
    };


    config.staticPath = require('path').join(__dirname, 'public');
    config.indexFile = 'index.html'; // This file load the optimized requirejs file,
                                     // index-dev.html will load main.js, without optimization

    // If this option is set, the gadael server will shutdown automatically
    // This can be used in a configuration with automatic socket activation
    config.inactivityTimeout = null; // Minutes

    return config;
};
