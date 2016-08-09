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
 * The parameter halfDayHour from the schedule calendar is used but only the from date is used to get the schedule calendar from the user
 * this may become unacurate for exports on large periods
 *
 * @param {User} user [[Description]]
 * @param {Date} from [[Description]]
 * @param {Date} to   [[Description]]
 *
 * @return {Promise}
 */
function getUserRequests(user, from, to, types) {

    let calendar;


    /**
     * Output date string in sage format
     * @param {Date} date
     */
    function formatDate(date) {

        if (undefined === date) {
            return 'undefined';
        }

        if (date < from) {
            date = from;
        }

        if (date > to) {
            date = to;
        }

        return sprintf('%02d/%02d/%02d', date.getDate(), 1+date.getMonth(), date.getFullYear()-2000);
    }


    function capEvent(event) {

        let capped = {
            dtstart: event.dtstart,
            dtend: event.dtend
        };

        if (capped.dtstart < from) {
            capped.dtstart = from;
        }

        if (capped.dtend > to) {
            capped.dtend = to;
        }

        return capped;
    }



    let account = user.roles.account;

    return account.getScheduleCalendar(from)
    .then(scheduleCal => {

        if (null === scheduleCal) {
            // throw new Error(sprintf('User %s have no schedule calendar on %s', user.getName(), from));
            // we try with the end date
            return account.getScheduleCalendar(to);
        }

        return scheduleCal;
    })
    .then(scheduleCal => {
        if (null === scheduleCal) {
            throw new Error(sprintf('User %s have no schedule calendar on %s', user.getName(), from));
        }
        calendar = scheduleCal;
        return account.getRequests();
    })
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
                    days += calendar.getDays(capEvent(event));
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
 * 11         | 0
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

                data += padStr(su.user.roles.account.sage.registrationNumber, 446);
                data += padStr(su.total, 50);
                data += padStr('0', 11);
                data += padStr(su.requests, 432);
                data += '\r\n';
            });

            return data;
        });



};
