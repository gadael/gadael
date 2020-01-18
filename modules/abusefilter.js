/**
 * @module abusefilter
 * Authentication filter
 */

'use strict';






/**
 * Authentication filter
 * Resolve to true or throw error
 * @return {Promise}
 */
exports = module.exports = function abuseFilter(req) {

    let LoginAttempt = req.app.db.models.LoginAttempt;
    let config = req.app.config.loginAttempts;
    let gt = req.app.utility.gettext;

    return Promise.all([
        LoginAttempt.countDocuments({ ip: req.ip }),
        LoginAttempt.countDocuments({ ip: req.ip, user: req.body.username })
    ])
    .then(arr => {
        if (arr[0] >= config.forIp || arr[1] >= config.forIpAndUser) {
            throw new Error(gt.gettext("You've reached the maximum number of login attempts. Please try again later."));
        }

        return true;
    });
};
