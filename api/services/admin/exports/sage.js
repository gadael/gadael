'use strict';

const sprintf = require('sprintf-js').sprintf;


function padStr(text, len, char) {

    function replicate(len, char) {
        return Array(len+1).join(char || ' ');
    }

    text = text+'';

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

    /**
     * Get number of days in one event, capped with from and to
     * @param {CalendarEvent} event
     */
    function getDays(event) {
        return event.businessDays;
    }

    /**
     * Output date string in sage format
     * @param {Date} date
     */
    function formatDate(date) {

        if (undefined === date) {
            return 'undefined';
        }

        return sprintf('%02d/%02d/%02d', date.getDate(), 1+date.getMonth(), date.getFullYear()-2000);
    }


    let account = user.roles.account;


    return account.getRequests()
    .then(requests => {

        return Promise.all(
            requests.map(request => {
                return request.populateAbsenceElements();
            })
        ).then(() => {
            return requests;
        });
    })
    .then(requests => {

        let total = 0;
        let periods = [];

        requests.forEach(request => {
            let days = 0;
            request.absence.distribution.forEach(element => {

                if (-1 === types.indexOf(element.right.type.id.toString())) {
                    return;
                }

                element.events.forEach(event => {
                    days += getDays(event);
                });

            });

            if (days === 0) {
                return;
            }

            periods.push(formatDate(request.absence.dtstart)+formatDate(request.absence.dtstart));
            total += days;
        });

        return {
            user: user,
            total: total,
            requests: periods.join('')
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
