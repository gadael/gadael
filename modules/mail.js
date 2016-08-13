'use strict';

const nodemailer = require('nodemailer');
const mailgen = require('./mailgen');

function getUserAddress(user) {
    return {
        name: user.getName(),
        address: user.email
    };
}

/**
 * Create new email object
 * @constructor
 */
function Mail(app) {

    this.transporter = nodemailer.createTransport(app.config.mailtransport);

    let from = {
        name: app.config.company.name,
        address: app.config.company.email
    };

    /**
     * initialize email with some default values
     */
    this.nodemailerData = {
        from: from,
        sender: from,
        subject: null,
        to: null
    };
}

Mail.prototype.setSubject = function(subject) {
    this.nodemailerData.subject = subject;
};

Mail.prototype.setTo = function(user) {
    this.nodemailerData.to = getUserAddress(user);
};

Mail.prototype.setFrom = function(user) {
    this.nodemailerData.from = getUserAddress(user);
};

/**
 * Set mail object
 * @param {Object} mailContent An object from one of the modules/email modules
 *                             mailContent object must contain a body property
 */
Mail.prototype.setMailgenData = function(mailContent) {
    this.nodemailerData.html = mailgen.generate(mailContent);
    this.nodemailerData.text = mailgen.generatePlaintext(mailContent);
};

/**
 * Send the email
 * @return {Promise}
 */
Mail.prototype.send = function() {
    return this.transporter.sendMail(this.email);
};


/**
 *
 */
exports = module.exports = Mail;
