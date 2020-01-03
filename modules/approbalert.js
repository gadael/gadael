'use strict';

const email = require('./emails/approbalert');

/**
 * Send one mail per administrator for the request
 * @param {Express} app
 * @param {Request} request
 * @return {Promise}
 */
function notifyRequest(app, request)
{
    const User = app.db.models.User;

    return User.find()
    .where('roles.admin').ne(null)
    .exec()
    .then(users => {
        return Promise.all(
            users.map(user => email(app, request, user))
        );
    })
    .then(emails => {
        return Promise.all(
            emails.map(email => email.send())
        );
    });
}




/**
 * Email the administrators if a request approval delay exceed the limit
 * This function is called every days
 *
 * @param {Express} app
 *
 * @return {Promise}
 */
exports = module.exports = function(app) {

    let approb_alert = app.config.company.approb_alert;

    if (undefined === approb_alert || null === approb_alert || 0 === approb_alert) {
        // Alert is disabled
        return Promise.resolve([]);
    }


    let limit = new Date();
    limit.setDate(limit.getDate()-approb_alert);

    const Request = app.db.models.Request;


    return Request.find()
    .or([
        { $and: [
            { 'status.created': 'waiting' },
            { 'status.deleted': null }
        ]},
        { 'status.deleted': 'waiting' }
    ])
    .where('lastUpdate').lte(limit)
    .exec()
    .then(requests => {
        if (requests.length === 0) {
            return [];
        }

        return Promise.all(
            requests.map(request => notifyRequest(app, request))
        );
    });

};
