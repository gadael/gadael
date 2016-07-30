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
exports.login = passport.authenticate('google', {
    session: false,
    accessType: 'offline',
    approvalPrompt: 'force'
});

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
