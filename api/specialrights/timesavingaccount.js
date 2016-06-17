'use strict';

const specialright = require('./specialright');
const gt = require('./../modules/gettext');

/**
 * Right for "reduction du temps de travail"
 *
 * @constructor
 * @augments specialright
 */
function timesavingaccount() {
    this.base();

    this.quantityReadOnly = true;

    this.countries = ['FR'];
}


timesavingaccount.prototype = new specialright();


timesavingaccount.prototype.getName = function() {
    return gt.gettext('Time saving account');
};


timesavingaccount.prototype.getDescription = function() {
    return gt.gettext('Time saving account, is necessary to activate time saving account request for users');
};

timesavingaccount.prototype.getQuantityLabel = function() {
    return gt.gettext('Quantity added by the time saving account requests will be made available for each users on their available quantity');
};


exports = module.exports = timesavingaccount;
