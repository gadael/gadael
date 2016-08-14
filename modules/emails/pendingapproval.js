'use strict';

const gt = require('../gettext');
const util = require('util');
const Mail = require('../mail');

/**
 * Mail send to department managers
 * @param {Object} app      Express
 * @param {Request} request
 *
 */
exports = module.exports = function getMail(app, request) {

    let mail = new Mail(app);

    mail.setSubject(util.format(gt.gettext('%s: a request is waiting for your approval'), app.config.company.name));

    let step = request.getNextApprovalStep();

    step.getApprovers().map(mail.addTo);

    let requestLink = app.config.url +'/#/manager/waitingrequests/'+ request._id;

    let requestLog = request.getLastNonApprovalRequestLog();

    // Intro: request type, Waiting approval or Waiting deletion approval
    // Outro: who and when

    mail.setMailgenData({
        body: {
            name: request.user.name,
            intro: util.format(gt.gettext('%s request %s'), request.getDispType(), request.getDispStatus()),
            action: {
                instructions: gt.gettext('Please, accept of reject after login into the application'),
                button: {
                    text: gt.gettext('View request'),
                    link: requestLink
                }
            },
            outro: util.format(
                gt.gettext('Workflow initiated by %s the %s'),
                requestLog.userCreated.name,
                requestLog.timeCreated.toLocaleString()
            )
        }
    });

    return mail;
};
