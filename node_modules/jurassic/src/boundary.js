'use strict';


/**
 * A list of periods linked with the finish date (left) or start date (right)
 * @param {Date} rootDate   Root date on Era
 */
function Boundary(rootDate)
{


    this.rootDate = rootDate;

    this.left = [];

    this.right = [];
}



/**
 * Add a period on boundary
 * @param {string} position left or right
 * @param {Period} period
 */
Boundary.prototype.addPeriod = function(position, period)
{
    this[position].push(period);
};

/**
 * Remove a period on a boundary (by dates)
 * @param {string} position left or right
 * @param {Period} period
 */
Boundary.prototype.removePeriod = function(position, period)
{
    for (var i=0; i<this[position].length; i++) {
        if (this[position][i].dtstart.getTime() === period.dtstart.getTime() && this[position][i].dtend.getTime() === period.dtend.getTime()) {
            this[position].splice(i, 1);
            break;
        }
    }
};


module.exports = Boundary;
