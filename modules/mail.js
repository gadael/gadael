'use strict';

const nodemailer = require('nodemailer');
const Mailgen = require('./mailgen');
const url = require('url');
let transporter = null;


function getUserAddress(user) {
    return {
        id: user._id, // Warning, not supported by nodemailer, but required by Message model
        name: user.getName(),
        address: user.email
    };
}

/**
 * Create new email object
 * @constructor
 */
function Mail(app) {

    this.app = app;

    if (null === transporter) {
        transporter = nodemailer.createTransport(app.config.mailtransport);
    }
    this.transporter = transporter;

    /**
     * initialize email with some default values
     */
    this.nodemailerData = {
        from: app.config.mailfrom,
        sender: app.config.mailfrom,
        subject: null,
        to: [],
        messageId: null,
        references: []
    };

    this.hostname = url.parse(app.config.url).hostname;
}

Mail.prototype.setSubject = function(subject) {
    this.nodemailerData.subject = subject;
};

/**
 * Set recipient by user
 * @param {User} user
 */
Mail.prototype.addTo = function(user) {
    this.nodemailerData.to.push(getUserAddress(user));
};

/**
 * Set recipient by email address
 * @param {String} email
 */
Mail.prototype.addAddress = function(email) {
    this.nodemailerData.to.push({
        address: email
    });
};


/**
 * Set from by user
 * @param {User} user
 */
Mail.prototype.setFrom = function(user) {
    this.nodemailerData.from = getUserAddress(user);
};

/**
 * Set a list of references to add to the mail
 * for example, set other messages from the same request
 * @param {Array} references List of Message documents or IDs
 */
Mail.prototype.setReferences = function(references) {
    let mail = this;
    this.nodemailerData.references = references.map(ref => {
        if (undefined !== ref._id) {
            ref = ref._id;
        }
        return ref+'@'+mail.hostname;
    });
};

/**
 * Set mail object
 * @param {Object} mailContent An object from one of the modules/email modules
 *                             mailContent object must contain a body property
 */
Mail.prototype.setMailgenData = function(mailContent) {

    let mailGenerator = new Mailgen(this.app);

    this.nodemailerData.html = mailGenerator.generate(mailContent);
    this.nodemailerData.text = mailGenerator.generatePlaintext(mailContent);
};

/**
 * Send the email
 * @return {Promise}    Resolve to the saved Message document
 */
Mail.prototype.send = function() {

    let mail = this;

    // create messageId
    let Message = this.app.db.models.Message;

    let mailMessage = new Message();
    mailMessage.set(this.nodemailerData);
    mailMessage.hostname = this.hostname;

    return mailMessage.save()
    .then(savedMessage => {

        this.nodemailerData.messageId = savedMessage._id+'@'+mail.hostname;
        return this.transporter.sendMail(this.nodemailerData)
        .then(infos => {
            // mail has been sent by nodemailer, update message document
            savedMessage.emailSent = true;
            savedMessage.hostname = mail.hostname;
            savedMessage.infos = infos;
            return savedMessage.save();
        })
        .catch(err => {
            savedMessage.error = err;
            return savedMessage.save();
        });
    });



};


/**
 *
 */
exports = module.exports = Mail;
