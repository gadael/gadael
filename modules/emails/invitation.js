'use strict';


const util = require('util');
const Mail = require('../mail');

/**
 * Mail send for each invitations
 *
 * @param {Object} app      Express
 * @param {Invitation} invitation
 *
 * @return {Promise}
 */
exports = module.exports = function getMail(app, invitation) {

    const gt = app.utility.gettext;

    let mail = new Mail(app);

    mail.setSubject(util.format(
        gt.gettext('%s invited you to join the leave management application at %s'),
        invitation.createdBy.name,
        app.config.url
    ));


    let invitationLink = app.config.url +'/#/anonymous/invitation/'+ invitation.emailToken;


    mail.addAddress(invitation.email);


    // Intro: request type, Waiting approval or Waiting deletion approval
    // Outro: who and when

    let body = {
        title: gt.gettext('Invitation'),
        intro: util.format(
            gt.gettext('%s has sent you this invitation to join %s as a user'),
            invitation.createdBy.name,
            app.config.url
        ),
        action: {
            instructions: gt.gettext('Please, use the link below to create your account'),
            button: {
                text: gt.gettext('Setup my account'),
                link: invitationLink
            }
        },
        signature: gt.gettext('Yours truly')
    };


    mail.setMailgenData({
        body: body
    });

    return Promise.resolve(mail);

};
