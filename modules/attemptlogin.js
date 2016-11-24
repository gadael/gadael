/**
 * @module attemptlogin
 */

'use strict';



/**
 * Attempt a login
 * Resolve to a user document
 * @param {String} strategy
 * @param {ClientRequest} req
 * @param {ClientResponse} res
 * @return {Promise}
 */
exports = module.exports = function attemptLogin(strategy, req, res) {

    let gt = req.app.utility.gettext;
    let loginAttempt = req.app.db.models.LoginAttempt;


    let userPromise = new Promise((resolve, reject) => {

        req._passport.instance.authenticate(strategy, function(err, user, info) {

            if (err) {
                return reject(err);
            }
            resolve(user);
        })(req, res);
    });

    return userPromise
    .then(user => {



        if (!user) {
            let attempt = new loginAttempt();
            attempt.ip = req.ip;
            attempt.user = req.body.username;

            return attempt.save()
            .then(() => {
                throw new Error(gt.gettext('Username and password combination not found or your account is inactive.'));
            });
        }

        return user;


    });

};
