'use strict';


const util = require('util');
const Mail = require('../mail');

const getViewUrl = function(request) {
    if (request.absence.distribution.length > 0) {
        return '/admin/requests/absences/'+request._id;
    }

    if (request.workperiod_recover.length > 0) {
        return '/admin/requests/workperiod-recovers/'+request._id;
    }

    if (request.time_saving_deposit.length > 0) {
        return '/admin/requests/time-saving-deposits/'+request._id;
    }
};

/**
 * Notification for admin about the approval list
 *
 * @param {Object} app      Express
 * @param {Request} request
 * @param {User} user
 *
 * @return {Promise}
 */
exports = module.exports = function getMail(app, request, user) {

    const gt = app.utility.gettext;

    let mail = new Mail(app);

    mail.setSubject(util.format(
        gt.gettext('The approval status of the %s request has not been modified in %d days'),
        request.getDispType(),
        app.config.company.approb_alert
    ));

    let requestLink = app.config.url +'/#'+getViewUrl(request);

    mail.addTo(user);

    let body = {
        title: gt.gettext('Pending request'),
        intro: util.format(
            gt.gettext('%s is waiting for a response on the %s'),
            request.user.name,
            request.getDispType()
        ),
        action: {
            instructions: gt.gettext('Please, check the request status'),
            button: {
                text: gt.gettext('View request'),
                link: requestLink
            }
        },
        signature: gt.gettext('Yours truly')
    };


    mail.setMailgenData({
        body: body
    });

    return Promise.resolve(mail);

};
