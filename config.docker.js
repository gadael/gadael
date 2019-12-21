/**
 * Module to create a new config object
 * @return object
 */
exports = module.exports = function createConfiguration() {

    'use strict';

    var config = {};

    config.loghttp = process.env.LOGHTTP === "true";
    config.csrfProtection = process.env.CSRFPROTECTION === "true";
    config.postpone = process.env.POSTPONE === "true";   // postpone some tasks after HTTP result in REST service
                                                         // postpone=false for unit tests but true in production for speed
    config.useSchudeledRefreshStat = process.env.USE_SCHEDULED_REFRESH_STAT === "true";

    config.url =  process.env.CALLBACK_URL;              // used by oauth2 callback url
                                                         // and links in Emails

                                                         // where the http server accept connexion to
    config.host = process.env.APP_HOST;                  // if host undefined: any host
    config.port = process.env.APP_PORT;
    config.mongodb = {
        init: process.env.DB_INIT === "true",            // database initialisation on first connexion
        prefix: process.env.DB_HOST,
        dbname: process.env.DB_NAME,
        autoIndex: process.env.DB_AUTO_INDEX === "true",
        removeIndex: (-1 !== process.argv.indexOf('removeIndex'))   // Remove index on start, autoIndex must be
                                                                    // true to recreate the index in background
    };

    config.company = process.env.APP_COMPANY;           // The company document will be here after server start (do not modify)
    config.language = process.env.APP_LANGUAGE;         // this should match a po file in /po/server

    // used for sessions
    config.cryptoKey = process.env.APP_CRYPTO_KEY;
    config.loginAttempts = {
        forIp: process.env.LOGIN_ATTEMPT_IP,
        forIpAndUser: process.env.LOGIN_ATTEMPT_USER,
        logExpiration: process.env.LOGIN_ATTEMPT_LOG_EXPIRATION
    };
    config.requireAccountVerification = process.env.ACCOUNT_VERIFICATION;

    // Send emails using the nodemail transport options (http://nodemailer.com/)
    // default use the localhost smtp server
    // Here is an example with a gmail account
    config.mailtransport = {
        host:  process.env.MAIL_HOST,
        port:  process.env.MAIL_PORT,
        secure:  process.env.MAIL_SECURE,           // use SSL
        auth: {
            user:  process.env.MAIL_USER,
            pass:  process.env.MAIL_PASS
        }
    };

    // Configure the from email address
    // The gadael domain must match the email domain
    // or the gadel domain must be authenticated as an allowed server for this
    // email domain using DKIM and SPF
    config.mailfrom = {
        name: process.env.MAIL_HEADER,
        address: process.env.MAIL_ADDRESS
    };


    config.staticPath = require('path').join(__dirname, 'public');
    config.indexFile =  'index.html'; // This file load the optimized requirejs file,
                                     // index-dev.html will load main.js, without optimization

    // If this option is set, the gadael server will shutdown automatically
    // This can be used in a configuration with automatic socket activation
    config.inactivityTimeout =  process.env.APP_TIMEOUT? process.env.APP_TIMEOUT : null ; // Minutes

    return config;
};
