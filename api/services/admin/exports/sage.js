'use strict';

/**
 * Export one line per active users and with a leave account
 * Each line will contain the requests in the requested period
 *
 * @param {apiService} service
 * @param {Date}       from    Interval selected before extraction
 * @param {Date}       to      Interval selected before extraction
 * @return {Promise}           Promised data is a string
 */
exports = module.exports = function(service, from, to) {



    return new Promise((resolve, reject) => {
        var findUsers = service.app.db.models.User.find();
        findUsers.where('isActive', true);
        findUsers.where('roles.account').exists();
        findUsers.populate('roles.account');

        findUsers.exec((err, users) => {

            if (err) {
                return reject(err);
            }

            // TODO

            resolve('');
        });



    });


};
