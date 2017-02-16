'use strict';


const util = require('util');
const Mail = require('../mail');

/**
 * Mail send to department managers
 *
 * @param {Object} app      Express
 * @param {Request} request
 *
 * @return {Promise}
 */
exports = module.exports = function getMail(app, request) {

    const gt = app.utility.gettext;

    let mail = new Mail(app);

    mail.setSubject(util.format(gt.gettext('%s: a request is waiting for your approval'), app.config.company.name));

    let step = request.getWaitingApprovalStep();

    if (null === step) {
        throw new Error('No waiting approval step');
    }

    let requestLink = app.config.url +'/#/manager/waitingrequests/'+ request._id;

    return step.getApprovers()
    .then(approvers => {

        for (var i=0; i< approvers.length; i++) {
            mail.addTo(approvers[i]);
        }

        // Intro: request type, Waiting approval or Waiting deletion approval
        // Outro: who and when

        let body = {
            title: gt.gettext('Approval request'),
            intro: util.format(gt.gettext('%s request for %s is %s'), request.getDispType(), request.user.name, request.getDispStatus()),
            action: {
                instructions: gt.gettext('Please, accept of reject after login into the application'),
                button: {
                    text: gt.gettext('View request'),
                    link: requestLink
                }
            },
            signature: gt.gettext('Yours truly')
        };

        let requestLog = request.getLastNonApprovalRequestLog();

        if (null !== requestLog) {
            body.outro = util.format(
                gt.gettext('Previous workflow step by %s the %s'),
                requestLog.userCreated.name,
                requestLog.timeCreated.toLocaleString()
            );
        }

        mail.setMailgenData({
            body: body
        });

        return mail;
    });
};
