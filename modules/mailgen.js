'use strict';

const Mailgen = require('mailgen');

/**
 *
 */
exports = module.exports = function(app) {

    /**
     * Return mail generator
     */
    return new Mailgen({
        theme: 'default',
        product: {
            // Appears in header & footer of e-mails
            name: app.config.company.name,
            link: app.config.url,
            // Optional product logo
            // logo: 'https://mailgen.js/img/logo.png',
            copyright: '&copy; '+new Date().getFullYear()+' '+app.config.company.name
        }
    });
};
