'use strict';





function padStr(text, len, char) {

    function replicate(len, char) {
        return Array(len+1).join(char || ' ');
    }

    if (text.length >= len) {
        return text;
    }
    return text + replicate(len-text.length, char);
}




/**
 * Get list of sage registration number + requests + quantity
 *
 * @param {User} user [[Description]]
 * @param {Date} from [[Description]]
 * @param {Date} to   [[Description]]
 *
 * @return {Promise}
 */
function getUserRequests(user, from, to, types) {


    let account = user.roles.account;

    return account.getRequests(from, to)
    .then(requests => {

        requests.forEach(request => {
            let events = [];
            request.absence.distribution.forEach(element => {
                if (-1 === types.indexOf(element.right.type.id)) {
                    return;
                }

                // TODO we need to adjust element quantity to ignore days out of requested period
                // events need to be adjusted also
                events = events.concat(element.events);
            });
        });

        return {
            user: user,
            total: 0,
            requests: ''
        };
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
 * @param {Array}      types   list of checked ID
 * @return {Promise}    Promised data is a string
 */
exports = module.exports = function(service, from, to, types) {




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

                promises.push(getUserRequests(user, from, to, types));
            });

            return Promise.all(promises);
        })
        .then(susers => {

            let data = '';
            susers.forEach(su => {
                // TODO
                data += padStr(su.user.roles.account.sage.registrationNumber, 446);
                data += padStr(su.total, 50);
                data += padStr('0', 12);
                data += padStr(su.requests, 432);
                data += '\r\n';
            });

            return data;
        });



};
