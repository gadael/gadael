'use strict';
var jurassic = require('jurassic');




/**
 * Get Era from a list onf events documents
 * events will be expanded according to RRULE if any
 *
 *
 * @param {Array} docs
 * @return {Era}
 */
function getExpandedEra(docs, dtstart, dtend)
{

    if (!(dtstart instanceof Date) || !(dtend instanceof Date)) {
        throw new Error('parameters must be dates');
    }


    var events = new jurassic.Era();
    var expanded;


    // it seam that the expand method is based on the event start date
    // we get one more day to get the event overlapping with start search date
    var expandStart = new Date(dtstart);
    expandStart.setDate(expandStart.getDate() -1);

    for(var i =0; i<docs.length; i++) {

        expanded = docs[i].expand(expandStart, dtend);

        // expand event if RRULE
        for(var e =0; e<expanded.length; e++) {

            try {

                // copy properties of expanded event to the jurassic period
                events.addPeriod(expanded[e]);

            } catch(e) {
                // ignore invalid period
                console.log(expanded[e]);
                console.trace(e);
            }
        }
    }
    return events;
}


exports = module.exports = getExpandedEra;
