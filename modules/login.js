'use strict';


/**
 * Promisification of req.login
 * This resolve to true
 *
 * @param {http.request} req
 * @param {User|Object} user If this is not a User document, additional query will be made
 *
 * @return {Promise}
 */
exports = module.exports = function loginPromise(req, user)
{
    const User = req.app.db.models.User;

    function getUser()
    {
        if (user instanceof User) {
            return Promise.resolve(user);
        }

        return User.findOne({ _id: user._id })
        .exec();
    }

    return new Promise((resolve, reject) => {

        getUser()
        .then(user => {
            req.login(user, function(err) {
                if (err) {
                    return reject(err);
                }

                resolve(true);
            });
        })
        .catch(reject);
    });
};
