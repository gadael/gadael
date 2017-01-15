'use strict';

const util = require('util');
const Mail = require('../mail');

/**
 * Mail sent to a user when an administrator add new role(s) to him
 * @param {Object} app  Express
 * @param {User} user   The user with roles modification
 * @param {Array} roles Additional roles
 *
 * @return {Promise}
 */
exports = module.exports = function getMail(app, user, roles) {

    const gt = app.utility.gettext;

    let mail = new Mail(app);

    mail.setSubject(util.format(gt.gettext('%s, your roles where updated'), app.config.company.name));
    mail.addTo(user);

    let intro = [gt.gettext('The following roles where added to your accout:')].concat(roles);

    mail.setMailgenData({
        body: {
            title: user.getName(),
            intro: intro,
            action: {
                instructions: gt.gettext('You can connecto to the application to see your new roles attributions on the home page'),
                button: {
                    text: gt.gettext('View home page'),
                    link: app.config.url
                }
            },
            signature: gt.gettext('Yours truly')
        }
    });

    return Promise.resolve(mail);
};
