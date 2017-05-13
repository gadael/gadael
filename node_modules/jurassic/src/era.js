'use strict';
/*jslint node: true */

/**
 * Representation of a list of periods
 * periods must not be overlapped in an Era object
 */
function Era() {


    /**
     * All periods
     * @var {Array}
     */
    this.periods = [];

    /**
     * All boundaries
     * @var {Array}
     */
    this.boundaries = [];

    /**
     * Boundaries indexed by date
     */
    this.boundariesByDate = {};

}

/**
 * Create period from event object
 * @param {Object}  obj     expanded event
 * @return {Period}
 */
Era.prototype.createPeriod = function(obj)
{
    var Period = require('./period');



    var p = new Period();
    for(var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            p[prop] = obj[prop];
        }
    }


    if (!(p.dtstart instanceof Date)) {
        p.dtstart = new Date(p.dtstart);
    }

    if (!(p.dtend instanceof Date)) {
        p.dtend = new Date(p.dtend);
    }

    return p;
};


/**
 * Add a period to Era
 * If the given object is not a Period instance, a new Period instance will be creted from it
 *
 * @var {Period|object} period
 * @return {Era}
 */
Era.prototype.addPeriod = function(period) {

    var Period = require('./period');

    if (!(period instanceof Period)) {
        period = this.createPeriod(period);
    }

    if (period.dtstart.getTime() >= period.dtend.getTime()) {
        throw new Error('Invalid period');
    }

    this.periods.push(period);
    this.addPeriodBoundary(period.dtstart, period, 'right');
    this.addPeriodBoundary(period.dtend, period, 'left');

    return this;
};

/**
 * Remove a period from era using dates only
 * @param {Period} period
 * @return {Era}
 */
Era.prototype.removePeriod = function(period) {

    if (period.dtstart.getTime() >= period.dtend.getTime()) {
        throw new Error('Invalid period');
    }

    var i;

    for (i = 0; i < this.periods.length; i++) {
        if(this.periods[i].dtstart.getTime() === period.dtstart.getTime() && this.periods[i].dtend.getTime() === period.dtend.getTime()) {
            this.periods.splice(i, 1);
            break;
        }
    }

    this.removePeriodBoundary(period.dtstart, period, 'right');
    this.removePeriodBoundary(period.dtend, period, 'left');

    return this;
};




/**
 * Add a period to boundary, create the boundary if necessary
 * @param {Date} rootDate
 * @param {Period} period
 * @param {string} position
 */
Era.prototype.addPeriodBoundary = function(rootDate, period, position)
{
    if (this.boundariesByDate[rootDate] === undefined) {

        var Boundary = require('./boundary');
        var newBoundary = new Boundary(rootDate);

        this.boundariesByDate[rootDate] = newBoundary;
        this.boundaries.push(newBoundary);
    }

    this.boundariesByDate[rootDate].addPeriod(position, period);
};


/**
 * Remove period from boundary, delete the boundary if necessary
 * @param {Date} rootDate
 * @param {Period} period
 * @param {string} position
 */
Era.prototype.removePeriodBoundary = function(rootDate, period, position)
{
    var boundary = this.boundariesByDate[rootDate];

    if (undefined === boundary) {
        throw new Error('No boundary defined for root date '+rootDate);
    }

    boundary.removePeriod(position, period);

    if (boundary[position].length === 0) {
        delete this.boundariesByDate[rootDate];

        for (var i=0; i<this.boundaries.length; i++) {
            if (this.boundaries[i].rootDate.getTime() === rootDate.getTime()) {
                this.boundaries.splice(i, 1);
                break;
            }
        }
    }
};


Era.prototype.sortBoundaries = function()
{
    this.boundaries.sort(function(a, b) {

        if (a.rootDate > b.rootDate) {
            return 1;
        }

        if (a.rootDate < b.rootDate) {
            return -1;
        }

        return 0;
    });
};


/**
 * Get new Era object with merged overlapping events
 * @param {Boolean} [addEventProperty]
 * @return {Era}
 */
Era.prototype.getFlattenedEra = function(addEventProperty)
{
    if (undefined === addEventProperty) {
        addEventProperty = false;
    }

    this.sortBoundaries();
    var Period = require('./period');

    var boundary,
        openStatus = 0,
        lastDate = null,
        flattenedEra = new Era(),
        period,
        events = [];



    for(var i=0; i<this.boundaries.length; i++) {
        boundary = this.boundaries[i];
        Array.prototype.push.apply(events, boundary.right);

        // open period
        if (0 === openStatus) { // nothing before boundary
            openStatus -= boundary.left.length;
            openStatus += boundary.right.length;
            if (openStatus > 0) {
                lastDate = new Date(boundary.rootDate);
                continue;
            }
        }

        // close period
        if (openStatus > 0) { // nothing after boundary
            openStatus -= boundary.left.length;
            openStatus += boundary.right.length;

            if (openStatus === 0) {

                period = new Period();
                period.dtstart = new Date(lastDate);
                period.dtend = new Date(boundary.rootDate);
                if (true === addEventProperty) {
                    period.events = events;
                }
                flattenedEra.addPeriod(period);

                events = [];
            }
        }
    }

    return flattenedEra;
};


/**
 * Add all periods to the current Era object
 * @param {Array} periods
 * @return {Era}
 */
Era.prototype.addPeriods = function(periods)
{
    for(var i=0; i<periods.length; i++) {
        this.addPeriod(periods[i]);
    }

    return this;
};


/**
 * Add all era periods to the current Era object
 * @param {Era} era
 * @return {Era}
 */
Era.prototype.addEra = function(era)
{
    return this.addPeriods(era.periods);
};




/**
 * Returns a new Era object whose value is the difference between the specified Period object and this instance.
 * warning, slow
 * @param {Period} period
 * @return {Era}
 */
Era.prototype.getEraWithoutPeriod = function(period)
{
    var Period = require('./period.js');
    var era = new Era(), newperiod;

    for(var i=0; i<this.periods.length; i++) {

        if (period.dtstart.getTime() >= this.periods[i].dtend.getTime()) {
            era.addPeriod(this.periods[i]);
            continue;
        }

        if (period.dtend.getTime() <= this.periods[i].dtstart.getTime()) {
            era.addPeriod(this.periods[i]);
            continue;
        }

        if (period.dtend.getTime() > this.periods[i].dtstart.getTime() && period.dtstart > this.periods[i].dtstart) {
            newperiod = new Period();
            newperiod.dtstart = this.periods[i].dtstart;
            newperiod.dtend = period.dtstart;
            era.addPeriod(newperiod);
        }


        if (period.dtstart.getTime() < this.periods[i].dtend.getTime() && period.dtend < this.periods[i].dtend) {
            newperiod = new Period();
            newperiod.dtstart = period.dtend;
            newperiod.dtend = this.periods[i].dtend;
            era.addPeriod(newperiod);
        }
    }

    return era;
};



/**
 * A list of functions needed by the subtractPeriodOnSortedBoundaries method
 * @param {Period} period
 * @return {object}
 */
Era.prototype.getSubtractPeriodCallbacks = function(period)
{
    var era = this;
    var Period = require('./period.js');

    function deleteCovered(boundPeriod)
    {
        if (boundPeriod.dtstart.getTime() >= boundPeriod.dtend.getTime()) {
            console.log('Invalid period in boundary, cannot be removed on date '+boundPeriod.dtstart);
            console.log(boundPeriod);
            return;
        }

        if (boundPeriod.dtstart >= period.dtstart && boundPeriod.dtend <= period.dtend) {
            era.removePeriod(boundPeriod);
            return;
        }

    }

    function startBefore(boundPeriod)
    {
        return (boundPeriod.dtstart <= period.dtstart);
    }

    function endAfter(boundPeriod)
    {
        return (boundPeriod.dtend >= period.dtend);
    }

    function updateEnd(boundPeriod)
    {
        if (boundPeriod.dtstart >= period.dtstart) {
            throw new Error('updateEnd: action not permited on boundPeriod, from '+boundPeriod.dtend+' to '+period.dtstart);
        }

        era.removePeriodBoundary(boundPeriod.dtend, boundPeriod, 'left');
        boundPeriod.dtend = period.dtstart;
        era.addPeriodBoundary(boundPeriod.dtend, boundPeriod, 'left');
    }


    function updateStart(boundPeriod)
    {
        if (boundPeriod.dtend <= period.dtend) {
            throw new Error('updateStart: action not permited on boundPeriod, from '+boundPeriod.dtstart+' to '+period.dtend);
        }

        era.removePeriodBoundary(boundPeriod.dtstart, boundPeriod, 'right');
        boundPeriod.dtstart = period.dtend;
        era.addPeriodBoundary(boundPeriod.dtstart, boundPeriod, 'right');
    }

    function createStartPeriod(boundPeriod)
    {
        if (boundPeriod.dtend <= period.dtend) {
            // end before

            updateEnd(boundPeriod);
            return;
        }

        var start = new Period();
        start.copyProperties(boundPeriod);
        start.dtend = period.dtstart;
        era.addPeriod(start);

        if (boundPeriod.dtstart < period.dtend) {
            updateStart(boundPeriod);
        }

    }

    function createEndPeriod(boundPeriod)
    {
        if (boundPeriod.dtstart >= period.dtstart) {
            // start after

            updateStart(boundPeriod);
            return;
        }

        var end = new Period();
        end.copyProperties(boundPeriod);
        end.dtstart = period.dtend;
        era.addPeriod(end);

        if (boundPeriod.dtend > period.dtstart) {
            updateEnd(boundPeriod);
        }
    }


    return {
        deleteCovered: deleteCovered,
        startBefore: startBefore,
        endAfter: endAfter,
        updateEnd: updateEnd,
        updateStart: updateStart,
        createStartPeriod: createStartPeriod,
        createEndPeriod: createEndPeriod
    };
};



/**
 * Subtract period from Era
 * boundaries must be sorted
 * @param {Period} period
 */
Era.prototype.subtractPeriodOnSortedBoundaries = function(period)
{
    if (period.dtstart >= period.dtend) {
        throw new Error('substract not allowed with invalid period');
    }

    var cb = this.getSubtractPeriodCallbacks(period);

    // get all boundaries inside period
    var boundary;
    for(var i=0; i<this.boundaries.length; i++) {
        boundary = this.boundaries[i];

        if (boundary.rootDate < period.dtstart) {
            // check right only

            boundary.right.forEach(cb.deleteCovered);
            boundary.right.filter(cb.endAfter).forEach(cb.createEndPeriod);
        } else {


            // delete covered periods
            boundary.right.forEach(cb.deleteCovered);
            boundary.left.forEach(cb.deleteCovered);

            if (boundary.rootDate > period.dtend) {
                continue;
            }

            boundary.left.filter(cb.startBefore).forEach(cb.createStartPeriod);
            boundary.right.filter(cb.endAfter).forEach(cb.createEndPeriod);
        }


        if (boundary.rootDate > period.dtend) {
            //end
            return;
        }
    }
};

/**
 * Remove period from the current era
 * boundaries must be sorted
 *
 *
 * @param {Period} period
 * @return {Era}
 */
Era.prototype.subtractPeriod = function(period)
{
    this.sortBoundaries();
    this.subtractPeriodOnSortedBoundaries(period);

    return this;
};


/**
 * Update the Era object with the difference between the specified Era object and this instance.
 *
 *
 * @param {Era} era
 * @return {Era}
 */
Era.prototype.subtractEra = function(era)
{
    era.periods.sort(function(p1, p2) {
        if (p1.dtstart === p2.dtstart) {
            return 0;
        }

        if (p1.dtstart > p2.dtstart) {
            return 1;
        }

        return -1;
    });


    this.sortBoundaries();
    for(var p=0; p < era.periods.length; p++) {
        this.subtractPeriodOnSortedBoundaries(era.periods[p]);
    }

    return this;
};





/**
 * Get the intesection of the era with a period
 * @param {Period} period
 * @param {Boolean} copyProperties      Copy properties of the era period into the new period (default true)
 * @return {Era}
 */
Era.prototype.intersectPeriod = function(period, copyProperties)
{
    if (undefined === copyProperties) {
        copyProperties = true;
    }

    var Period = require('./period.js');
    var era = new Era(), newperiod;

    for(var i=0; i<this.periods.length; i++) {

        if (period.dtstart.getTime() >= this.periods[i].dtend.getTime()) {
            continue;
        }

        if (period.dtend.getTime() <= this.periods[i].dtstart.getTime()) {
            continue;
        }

        newperiod = new Period();

        if (period.dtstart.getTime() > this.periods[i].dtstart.getTime()) {
            newperiod.dtstart = new Date(period.dtstart);
        } else {
            newperiod.dtstart = new Date(this.periods[i].dtstart);
        }


        if (period.dtend.getTime() < this.periods[i].dtend.getTime()) {
            newperiod.dtend = new Date(period.dtend);
        } else {
            newperiod.dtend = new Date(this.periods[i].dtend);
        }

        if (copyProperties) {
            newperiod.copyProperties(this.periods[i]);
        }

        era.addPeriod(newperiod);
    }

    return era;
};



/**
 * Get the intesection of the specified Era object and this instance
 * @param {Era} era
 * @return {Era}
 */
Era.prototype.intersectEra = function(era)
{
    var processEra = new Era();

    for(var p=0; p < era.periods.length; p++) {
        processEra.addEra(this.intersectPeriod(era.periods[p]));
    }

    return processEra;
};




/**
 * Get list of days in Era
 * @return {Object}
 */
Era.prototype.getDays = function()
{
    var days = {};

    for(var p=0; p < this.periods.length; p++) {
        var periodDays = this.periods[p].getDays();
        for(var time in periodDays) {
            if (periodDays.hasOwnProperty(time)) {
                days[time] = periodDays[time];
            }
        }
    }

    return days;
};








module.exports = Era;
