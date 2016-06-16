'use strict';

const specialright = require('./specialright');
const gt = require('./../modules/gettext');

/**
 * Right for "reduction du temps de travail"
 *
 * @constructor
 * @augments specialright
 *
 * @param {Express} app
 */
function annualleave(app) {
    this.base(app);

    this.quantityReadOnly = true;

    this.countries = ['FR', 'BE', 'DE', 'UK'];
}


annualleave.prototype = new specialright();


annualleave.prototype.getName = function() {
    return gt.gettext('RTT');
};


annualleave.prototype.getDescription = function() {
    return gt.gettext('Annual paid leave');
};


exports = module.exports = annualleave;
