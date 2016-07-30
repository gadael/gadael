'use strict';



const passport = require('passport');
const getStrategy = require('./../../modules/gcalstrategy');


try {
    passport.use(getStrategy());
} catch(e) {
    // ignore error
}



/**
 * First click. call the google interface
 */
exports.login = passport.authenticate('google', { session: false });

/**
 * Google reply on this callback
 */
exports.callback = passport.authenticate('google', {
    session: false,
    failureRedirect: '/#/user/settings/calendar',
    assignProperty: 'googleCalendarUser',
    accessType: 'offline',
    approvalPrompt: 'force'
});

/**
 * This is the next function of the callback route
 * @param {object}   req [[Description]]
 * @param {object}   res [[Description]]
 */
exports.next = (req, res) => {

    let profile = req.googleCalendarUser;

    req.user.google.accessToken = profile.accessToken;
    req.user.google.refreshToken = profile.refreshToken;
    req.user.google.expire_in = profile.expire_in;
    req.user.save()
    .then((savedUser) => {
        res.redirect('/#/user/settings/calendar');
    })
    .catch(err => {
        res.end(err.message);
    });
};


