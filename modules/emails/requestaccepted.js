'use strict';

const util = require('util');
const Mail = require('../mail');


/**
 * Mail send to request owner when workflow succeed
 * This mail is for approval ony, requestcreated will be used instead if
 * an admin create a request for a user without approval
 *
 * @param {Object} app      Express
 * @param {Request} request
 * @param {String} comment Approver comment or empty string
 * @returns {Promise}
 */
exports = module.exports = function getMail(app, request, comment) {

    const gt = app.utility.gettext;

    let mail = new Mail(app);

    let workflowCreation = request.getLastNonApprovalRequestLog();

    let requestLink = app.config.url +'#/account/requests/'+request.getUrlPathType()+'/'+ request._id;

    let intro;

    if ('accepted' === request.status.created) {
        mail.setSubject(util.format(gt.gettext('%s: request accepted'), app.config.company.name));
        intro = util.format(gt.gettext('Your %s has been accepted'), request.getDispType());
    }


    if ('accepted' === request.status.deleted) {
        mail.setSubject(util.format(gt.gettext('%s: request canceled'), app.config.company.name));
        intro = util.format(
            gt.gettext('As requested by %s, the %s request has been canceled'),
            workflowCreation.userCreated.name,
            request.getDispType()
        );
    }

    return request.getUser()
    .then(user => {
        return user.getAccount()
        .then(account => {
            if (!account.notify.approvals) {
                throw new Error('This email is disabled in user settings');
            }

            mail.addTo(user);
            let log = request.getLastApprovalRequestLog();

            if ('wf_accept' !== log.action && 'delete' !== log.action) {
                throw new Error(util.format('Unexpected last approval request log "%s"', log.action));
            }
            
            mail.setMailgenData({
                body: {
                    title: request.user.name,
                    intro: [intro, comment],
                    action: {
                        instructions: gt.gettext('Consult the request actions history after login into the application'),
                        button: {
                            text: gt.gettext('View request'),
                            link: requestLink
                        }
                    },
                    outro: util.format(
                        gt.gettext('Workflow step by %s the %s'),
                        workflowCreation.userCreated.name,
                        workflowCreation.timeCreated.toLocaleString()
                    ),
                    signature: gt.gettext('Yours truly')
                }
            });

            return mail;
        });

    });


};
