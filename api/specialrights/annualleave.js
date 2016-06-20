'use strict';

const SpecialRight = require('./specialright');
const gt = require('./../../modules/gettext');

/**
 * Right for "reduction du temps de travail"
 *
 * @constructor
 * @augments specialright
 */
function AnnualLeave() {
    SpecialRight.call(this);

    this.editQuantity = true;

    this.countries = ['FR', 'BE', 'DE', 'UK'];
}

AnnualLeave.prototype = Object.create(SpecialRight.prototype);
AnnualLeave.prototype.constructor = AnnualLeave;


AnnualLeave.prototype.getName = function() {
    return gt.gettext('Annual paid leave');
};


AnnualLeave.prototype.getDescription = function() {
    return gt.gettext("Paid time off work granted by employers to employees to be used for whatever the employee wishes. Depending on the employer's policies, differing number of days may be offered, and the employee may be required to give a certain amount of advance notice");
};


exports = module.exports = AnnualLeave;
