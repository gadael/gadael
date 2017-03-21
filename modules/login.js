'use strict';


/**
 * Promisification of req.login
 * This resolve to true
 * @return {Promise}
 */
exports = module.exports = function loginPromise(req, user)
{
    return new Promise((resolve, reject) => {
        req.login(user, function(err) {
            if (err) {
                return reject(err);
            }

            resolve(true);
        });
    });
};
