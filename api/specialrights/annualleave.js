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

    this.quantityReadOnly = false;

    this.countries = ['FR', 'BE', 'DE', 'UK'];
}

AnnualLeave.prototype = Object.create(SpecialRight.prototype);
AnnualLeave.prototype.constructor = AnnualLeave;


AnnualLeave.prototype.getName = function() {
    return gt.gettext('RTT');
};


AnnualLeave.prototype.getDescription = function() {
    return gt.gettext('Annual paid leave');
};


exports = module.exports = AnnualLeave;
