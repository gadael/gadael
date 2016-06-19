'use strict';

const SpecialRight = require('./specialright');
const gt = require('./../../modules/gettext');

/**
 * Right for "reduction du temps de travail"
 *
 * @constructor
 * @augments specialright
 */
function TimeSavingAccount() {
    SpecialRight.call(this);

    this.quantityReadOnly = true;

    this.countries = ['FR'];
}

TimeSavingAccount.prototype = Object.create(SpecialRight.prototype);
TimeSavingAccount.prototype.constructor = TimeSavingAccount;


TimeSavingAccount.prototype.getName = function() {
    return gt.gettext('Time saving account');
};


TimeSavingAccount.prototype.getDescription = function() {
    return gt.gettext('Time saving account, is necessary to activate time saving account request for users');
};

TimeSavingAccount.prototype.getQuantityLabel = function() {
    return gt.gettext('Quantity added by the time saving account requests will be made available for each users on their available quantity');
};


exports = module.exports = TimeSavingAccount;
