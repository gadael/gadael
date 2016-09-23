'use strict';

const SpecialRight = require('./specialright');

/**
 * Right for "reduction du temps de travail"
 *
 * @constructor
 * @augments specialright
 */
function TimeSavingAccount(app) {
    SpecialRight.call(this, app);

    this.editQuantity = false;

    this.countries = ['FR'];
}

TimeSavingAccount.prototype = Object.create(SpecialRight.prototype);
TimeSavingAccount.prototype.constructor = TimeSavingAccount;


TimeSavingAccount.prototype.getName = function() {
    const gt = this.app.utility.gettext;
    return gt.gettext('Time saving account');
};


TimeSavingAccount.prototype.getDescription = function() {
    const gt = this.app.utility.gettext;
    return gt.gettext('Time saving account, is necessary to activate time saving account request for users');
};

TimeSavingAccount.prototype.getQuantityLabel = function() {
    const gt = this.app.utility.gettext;
    return gt.gettext('Quantity added by the time saving account requests will be made available for each users on their available quantity');
};


exports = module.exports = TimeSavingAccount;
