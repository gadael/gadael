'use strict';

const util = require('util');
const Mail = require('../mail');

/**
 * Mail send when a user ask to reset his password
 * @param {Object} app  Express
 * @param {String} token
 * @param {User} user
 *
 * @return {Promise}
 */
exports = module.exports = function getMail(app, token, user) {

    const gt = app.utility.gettext;

    let mail = new Mail(app);

    mail.setSubject(util.format(gt.gettext('%s: reset your password'), app.config.company.name));
    mail.addTo(user);

    let resetLink = app.config.url +'/#/login/reset/'+ user.email +'/'+ token +'/';

    mail.setMailgenData({
        body: {
            title: user.getName(),
            intro: [
                gt.gettext('Forgot your password?'),
                util.format(gt.gettext('We received a request to reset the password for your account (%s)'), user.email)
            ],
            action: {
                instructions: gt.gettext('To reset your password, click on this link (or copy and paste the URL into your browser)'),
                button: {
                    text: gt.gettext('Reset your password'),
                    link: resetLink
                }
            },
            outro: gt.gettext('If you do not have requested a password modification, just ignore this email'),
            signature: gt.gettext('Yours truly')
        }
    });

    return Promise.resolve(mail);
};
