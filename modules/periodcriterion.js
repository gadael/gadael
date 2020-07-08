'use strict';


/**
 * verification for services parameters with a period for an absence request
 */




/**
 * Add a criterion to mongoose request for a period
 * This criterion will get events in period + events with recurence options, the
 * documents will be expended after exec
 *
 * @param   {Object} find       Mongoose request
 * @param   {Date}   dtstart
 * @param   {Date}   dtend
 *
 */
exports = module.exports = function periodCriterion(find, dtstart, dtend) {

    find.or([
        { rrule: { $exists: true } },
        { rdate: { $exists: true, $ne: [] } },
        { $and:
            [
                { rrule: { $exists: false } },
                { dtend: { $gt: dtstart } },
                { dtstart: { $lt: dtend } }
            ]
        }
    ]);
};
