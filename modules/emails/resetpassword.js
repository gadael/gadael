'use strict';

const gt = require('../gettext');
const util = require('util');

/**
 * Mail send when a user ask to reset his password
 * @param {ClientRequest} req  http.ClientRequest
 * @param {String} token
 * @param {User} user
 */
exports = module.exports = function getMail(req, token, user) {

    let resetLink = req.protocol +'://'+ req.headers.host +'/#/login/reset/'+ user.email +'/'+ token +'/';

    return {
        subject: util.format(gt.gettext('%s: reset your password'), req.app.config.company.name),
        body: {
            name: user.getName(),
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
            outro: gt.gettext('If you do not have requested a password modification, just ignore this email')
        }
    };
};
