'use strict';
var jurassic = require('jurassic');


/**
 * Normalize event for the jurassic api
 * a dtend is required
 *
 * @param   {CalendarEvent}   event
 * @returns {CalendarEvent}
 */
function normalize(event) {
    if (undefined === event.dtend || null === event.dtend) {
        event.dtend = new Date(event.dtstart);
        event.dtend.setDate(event.dtend.getDate()+1);
    }

    return event;
}


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

    for(let i =0; i<docs.length; i++) {

        expanded = normalize(docs[i]).expand(expandStart, dtend);

        // expand event if RRULE
        for(let j =0; j<expanded.length; j++) {

            try {

                // copy properties of expanded event to the jurassic period
                events.addPeriod(expanded[j]);

            } catch(e) {
                // ignore invalid period
                // console.log('expanded.length='+expanded.length+' j='+j+' expanded[e]='+expanded[j]);
                console.log(e.stack);
            }
        }
    }
    return events;
}


exports = module.exports = getExpandedEra;
