'use strict';

const util = require('util');
const Mail = require('../mail');

/**
 * Mail sent to administrators when a user is created by registration
 * @param {Object} app  Express
 * @param {User} user   The new created user
 *
 * @return {Promise}
 */
exports = module.exports = function getMail(app, user) {

    const gt = app.utility.gettext;

    let mail = new Mail(app);

    mail.setSubject(util.format(gt.gettext('%s: new user created'), app.config.company.name));


    let userLink = app.config.url +'/#/admin/users/'+ user._id;

    mail.setMailgenData({
        body: {
            title: user.getName(),
            intro: util.format(gt.gettext('A new user has been created on %s'), app.config.url),
            action: {
                instructions: gt.gettext('The new user has been created but does not have any role or absence rights, you must give the user the necessary rights to use the application normally'),
                button: {
                    text: gt.gettext('View the new user'),
                    link: userLink
                }
            },
            outro: gt.gettext('If you do not recognize this user, you can delete it'),
            signature: gt.gettext('Yours truly')
        }
    });

    return app.db.models.User
    .find()
    .where('email'       ).exists()
    .where('roles.admin' ).exists()
    .where('isActive'    ).equals(true)
    .exec()
    .then(users => {
        users.forEach(mail.addTo);
        return mail;
    });


};
