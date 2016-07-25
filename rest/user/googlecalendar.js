'use strict';


//const gcal     = require('google-calendar');







exports.login = function(req, res, next) {

    console.log('login');

    req._passport.instance.authenticate(
        'google',
        { session: false, callbackURL: '/rest/user/googlecalendar/callback' },
        function(err, user, info) {
            console.log(err);
            console.log(user);
            console.log(info);

            // give info to angular if the user is allready connected or waiting callback result?

            res.end();
        }
    );
};




exports.callback = function(req, res, next) {
    req._passport.instance.authenticate(
        'google',
        { session: false, failureRedirect: '#/user/settings/calendar' }
    );
};




