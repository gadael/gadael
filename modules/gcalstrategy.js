'use strict';

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const config   = require('../config')();

exports = module.exports = function getStrategy() {

    if (!config.oauth.google.key) {
        throw new Error('Missing key for oauth connexion');
    }

    if (!config.oauth.google.secret) {
        throw new Error('Missing secret for oauth connexion');
    }

    if (!config.url) {
        throw new Error('Missing url configuration to build google oauth strategy');
    }

    return new GoogleStrategy({
            clientID: config.oauth.google.key,
            clientSecret: config.oauth.google.secret,
            callbackURL: config.url+'rest/user/googlecalendar/callback',
            scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar']
        },
        function(accessToken, refreshToken, params, profile, done) {

            if (!refreshToken) {
                return done('Missing refresh token');
            }

            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            profile.expire_in = params.expires_in;
            return done(null, profile);
        }
    );
};
