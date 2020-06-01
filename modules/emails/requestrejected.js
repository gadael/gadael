'use strict';

const util = require('util');
const Mail = require('../mail');


/**
 * Mail send to request owner
 * @param {Object} app      Express
 * @param {Request} request
 * @param {String} comment Approver comment or empty string
 * @returns {Promise}
 */
exports = module.exports = function getMail(app, request, comment) {

    const gt = app.utility.gettext;

    let mail = new Mail(app);

    mail.setSubject(util.format(gt.gettext('%s: request rejected'), app.config.company.name));

    let requestLink = app.config.url +'#/account/requests/'+request.getUrlPathType()+'/'+ request._id;

    return request.getUser()
    .then(user => {
        return user.getAccount()
        .then(account => {
            if (!account.notify.approvals) {
                throw new Error('This email is disabled in user settings');
            }

            mail.addTo(user);

            let log = request.getLastApprovalRequestLog();

            if ('wf_reject' !== log.action) {
                throw new Error('Unexpected last approval request log');
            }

            mail.setMailgenData({
                body: {
                    title: request.user.name,
                    intro: [
                        util.format(gt.gettext('Your %s has been rejected'), request.getDispType()),
                        comment
                    ],
                    action: {
                        instructions: gt.gettext('Consult the request actions history after login into the application'),
                        button: {
                            text: gt.gettext('View request'),
                            link: requestLink
                        }
                    },
                    signature: gt.gettext('Yours truly')
                }
            });

            return mail;
        });
    });


};
