'use strict';


const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const passport = require('passport');
//const gcal     = require('google-calendar');
const config   = require('../../config')();


passport.use(new GoogleStrategy({
        clientID: config.oauth.google.key,
        clientSecret: config.oauth.google.secret,
        callbackURL: "http://elbeuf.rosanbo.com/rest/user/googlecalendar/callback",
        scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar']
    },
    function(accessToken, refreshToken, profile, done) {
        profile.accessToken = accessToken;
        return done(null, profile);
    }
));





exports.login = passport.authenticate('google', { session: false });




exports.callback = passport.authenticate('google', { session: false, failureRedirect: '/login' });




