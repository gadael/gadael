'use strict';


/**
 * Representation of a period (timespan)
 *
 */
function Period()
{

    /**
     * @var {Date}
     */
    this.dtstart = null;

    /**
     * @var {Date}
     */
    this.dtend = null;

}

/**
 * Get number of days beetween 2 hours in the same day
 *
 * @param {Date} startHour
 * @param {Date} endHour
 * @param {Date} halfdayHour
 *
 * @return {Number}
 */
Period.prototype.getDaysInDay = function(startHour, endHour, halfdayHour)
{
    var start = new Date(startHour);
    var end = new Date(start);
    end.setHours(endHour.getHours(), endHour.getMinutes(), endHour.getSeconds(), endHour.getMilliseconds());

    var halfday = new Date(start);
    halfday.setHours(halfdayHour.getHours(), halfdayHour.getMinutes(), halfdayHour.getSeconds(), halfdayHour.getMilliseconds());

    if (start.getTime() >= end.getTime()) {
        return 0;
    }

    if (end.getTime() <= halfday.getTime()) {
        return 0.5;
    }

    if (start.getTime() >= halfday.getTime()) {
        return 0.5;
    }

    return 1;
};




/**
 * Get a new period on one day (intersection on one day)
 * @param {Date} day
 * @return {Period}
 */
Period.prototype.getDayPeriod = function(day)
{
    var period = new Period();
    var daystart = new Date(day);
    daystart.setHours(0, 0, 0, 0);

    var dayend = new Date(day);
    dayend.setHours(23, 59, 59, 99);

    if (this.dtstart.getTime() >= dayend.getTime()) {
        return null;
    }

    if (this.dtend.getTime() <= daystart.getTime()) {
        return null;
    }


    if (this.dtstart.getTime() < daystart.getTime()) {
        period.dtstart = daystart;
    } else {
        period.dtstart = new Date(this.dtstart);
    }

    if (this.dtend.getTime() > dayend.getTime()) {
        period.dtend = dayend;
    } else {
        period.dtend = new Date(this.dtend);
    }

    return period;
};


/**
 * Get gays in period
 * @throws {Error} [[Description]]
 * @returns {object} list of all days
 */
Period.prototype.getDays = function()
{
    if (null === this.dtstart || null === this.dtend) {
        throw new Error('invalid period');
    }

    var days = {};
    var loopPeriod;
    var loop = new Date(this.dtstart);
    loop.setHours(0,0,0,0);
    while (loop.getTime() < this.dtend.getTime()) {
        days[loop.getTime()] = new Date(loop);
        loop.setDate(loop.getDate() + 1);
    }

    return days;
};


/**
 * Get number of days in period with a 0.5 days precision
 * @param {Date} halfday  half-day hour
 * @return {Number}
 */
Period.prototype.getBusinessDays = function(halfday)
{

    if (null === this.dtstart || null === this.dtend) {
        throw new Error('invalid period');
    }

    if (undefined === halfday) {
        halfday = new Date();
        halfday.setHours(12, 0, 0, 0);
    }

    var days = 0;
    var loopPeriod;
    var loop = new Date(this.dtstart);
    while (loop.getTime() < this.dtend.getTime()) {
        loopPeriod = this.getDayPeriod(loop);
        days += this.getDaysInDay(loopPeriod.dtstart, loopPeriod.dtend, halfday);
        loop.setDate(loop.getDate() + 1);
    }

    return days;
};


/**
 * Copy properties from one period to another
 * if property allready exists, nothing is modified
 * @param {Period} fromPeriod
 *
 */
Period.prototype.copyProperties = function(fromPeriod)
{
    for(var prop in fromPeriod) {
        if (fromPeriod.hasOwnProperty(prop) && (this[prop] === undefined || null === this[prop])) {
            this[prop] = fromPeriod[prop];
        }
    }
};


module.exports = Period;
