'use strict';

/**
 * Get list of sage registration number + requests + quantity
 *
 * @param {User} user [[Description]]
 * @param {Date} from [[Description]]
 * @param {Date} to   [[Description]]
 *
 * @return {Promise}
 */
function getUserRequests(user, from, to) {

    function replicate(len, char) {
        return Array(len+1).join(char || ' ');
    }

    function padr(text, len, char) {
        if (text.length >= len) {
            return text;
        }
        return text + replicate(len-text.length, char);
    }

    let account = user.roles.account;

    return account.getRequests(from, to)
    .then(requests => {
        //TODO
    });
}


/**
 * Export one line per active user and with a leave account and with a a ssage reigstration number
 * Each line will contain the requests in the requested period in sage format
 *
 * Characters |
 * --------------------------------------
 * 446        | sage registration number
 * 50         | Total number of days of the leaves, a comma is used as a decimal separator
 * 12         | 0
 * 432        | Period list example : 10/06/1310/06/1315/06/1321/06/13
 *
 * Two periods in this example :
 *  - from 10/06/2013 to 10/06/2013
 *  - from 15/06/2013 au 21/06/2013
 *
 *
 * @param {apiService} service
 * @param {Date}       from    Interval selected before extraction
 * @param {Date}       to      Interval selected before extraction
 * @return {Promise}           Promised data is a string
 */
exports = module.exports = function(service, from, to) {




        return service.app.db.models.User.find()
        .where('isActive', true)
        .where('roles.account').exists()
        .populate('roles.account')
        .exec()
        .then(users => {
            let promises = [];

            users.forEach(user => {
                if (!user.roles.account.sage || !user.roles.account.sage.registrationNumber) {
                    return;
                }

                promises.push(getUserRequests(user, from, to));
            });

            return Promise.all(promises);
        })
        .then(susers => {

            let data = '';
            susers.forEach(su => {
                // TODO
                data += '\r\n';
            });

            return data;
        });



};
