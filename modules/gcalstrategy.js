'use strict';

const GoogleStrategy = require('passport-google-oauth2' ).Strategy;

/**
 * This module export a google strategy used to link the google calendar with the user events
 */
exports = module.exports = function getStrategy(config) {

    if (undefined === config.company || null === config.company || undefined === config.company.calendar || undefined === config.company.calendar.google) {
        throw new Error('Wrong company configuration');
    }

    if (!config.company.calendar.google.enable) {
        throw new Error('Google synchronization has been disabled');
    }

    if (!config.company.calendar.google.clientID) {
        throw new Error('Missing client ID for oauth connexion');
    }

    if (!config.company.calendar.google.clientSecret) {
        throw new Error('Missing client secret for oauth connexion');
    }

    if (!config.url) {
        throw new Error('Missing url configuration to build google oauth strategy');
    }

    return new GoogleStrategy({
            clientID: config.company.calendar.google.clientID,
            clientSecret: config.company.calendar.google.clientSecret,
            callbackURL: config.url+'/rest/user/googlecalendar/callback',
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
