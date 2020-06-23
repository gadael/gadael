'use strict';



const passport = require('passport');
const getStrategy = require('./../../modules/gcalstrategy');

/**
 * Initialize passport object if possible
 */
exports.init = function(config) {
    try {
        passport.use(getStrategy(config));
    } catch(e) {
        // display configuration error on server load if google calendar enabled
        if (config.company.calendar.google.enabled) {
            console.error(e);
        }
    }
};


/**
 * First click. call the google interface
 */
exports.login = function(req, res, next) {
    return passport.authenticate('google', {
        session: false,
        accessType: 'offline',
        approvalPrompt: 'force',
        scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar']
    })(req, res, next);
};

/**
 * Google reply on this callback
 */
exports.callback = passport.authenticate('google', {
    session: false,
    failureRedirect: '/#/user/settings/calendar',
    assignProperty: 'googleCalendarUser',
    accessType: 'offline',
    approvalPrompt: 'force' // if we do not force approval, the refresh token will not be sent after a disconnect
                            // so this is mandatory beecause we clear the refresh token on disconnect
});

/**
 * This is the next function of the callback route
 * @param {object}   req [[Description]]
 * @param {object}   res [[Description]]
 */
exports.next = (req, res) => {

    let profile = req.googleCalendarUser;

    if (!profile.refreshToken) {
        throw new Error('the refresh token is required');
    }

    req.user.google.accessToken = profile.accessToken;

    // refresh token is used to get new access tokens when the user is offline.
    req.user.google.refreshToken = profile.refreshToken;

    let expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + profile.expire_in);
    req.user.google.expire_in = expiry;
    req.user.save()
    .then((savedUser) => {
        res.redirect('/#/user/settings/calendar');
    })
    .catch(err => {
        res.end(err.message);
    });
};


/**
 * Disconnect google calendar
 * @param {object}   req [[Description]]
 * @param {object}   res [[Description]]
 */
exports.logout = (req, res) => {

    let gt = req.app.utility.gettext;
    let workflow = req.app.utility.workflow(req, res);

    req.user.google.accessToken = null;
    req.user.google.refreshToken = null;
    req.user.google.expire_in = null;

    req.user.save()
    .then((savedUser) => {
        workflow.outcome.alert.push({
            type: 'info',
            message: gt.gettext('You are disconnected from your google calendar')
        });
        workflow.emit('response');
    })
    .catch(err => {
        res.end(err.message);
    });
};
