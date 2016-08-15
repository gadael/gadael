'use strict';

const gt = require('../gettext');
const util = require('util');
const Mail = require('../mail');


/**
 * Mail send to request owner
 * @param {Object} app      Express
 * @param {Request} request
 * @returns {Promise}
 */
exports = module.exports = function getMail(app, request) {

    let mail = new Mail(app);

    mail.setSubject(util.format(gt.gettext('%s: request accepted'), app.config.company.name));

    let requestLink = app.config.url +'/#/account/'+request.getUrlPathType()+'/'+ request._id;

    return request.getUser()
    .then(user => {
        mail.addTo(user);

        let log = request.getlastApprovalRequestLog();

        if ('wf_accept' !== log.action) {
            throw new Error('Unexpected last approval request log');
        }

        mail.setMailgenData({
            body: {
                name: request.user.name,
                intro: util.format(gt.gettext('Your %s has been accepted'), request.getDispType()),
                action: {
                    instructions: gt.gettext('Consult the request actions history after login into the application'),
                    button: {
                        text: gt.gettext('View request'),
                        link: requestLink
                    }
                }
            }
        });

        return mail;
    });


};
