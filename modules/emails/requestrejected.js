'use strict';

const gt = require('../gettext');
const util = require('util');
const Mail = require('../mail');

/**
 * Mail send to request owner
 * @param {Object} app      Express
 * @param {Request} request
 *
 */
exports = module.exports = function getMail(app, request) {

    let mail = new Mail(app);

    mail.setSubject(util.format(gt.gettext('%s: request rejected'), app.config.company.name));

    mail.setMailgenData({
        body: {
            name: request.user.name
        }
    });

    return mail;
};
