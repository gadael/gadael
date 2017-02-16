'use strict';


let periodCriterion = require('../../../../modules/periodcriterion');


/**
 * Export leave requests attached to events between two dates
 * @param {apiService} service
 * @param {Date}       from    Interval selected before extraction
 * @param {Date}       to      Interval selected before extraction
 * @return {Promise}           Promised data is the array compatible with xlsx-writestream
 */
exports = module.exports = function(service, from, to) {

    const gt = service.app.utility.gettext;

    const NAME          = gt.gettext('Name');
    const DEPARTMENT    = gt.gettext('Department');
    const CREATEDON     = gt.gettext('Created on');
    const DTSTART       = gt.gettext('From');
    const DTEND         = gt.gettext('To');
    const CONSUMED      = gt.gettext('Consumed');
    const QUANTITY      = gt.gettext('Duration');
    const STATUS        = gt.gettext('Status');



    return new Promise((resolve, reject) => {
        var findEvents = service.app.db.models.CalendarEvent.find();
        periodCriterion(findEvents, from, to);
        findEvents.where('request').exists();

        findEvents.exec((err, events) => {

            if (err) {
                return reject(err);
            }

            var find = service.app.db.models.Request.find();
            find.where('status.deleted').in([null, 'waiting']);
            find.where('events').in(events);
            find.populate('events');
            find.populate('absence.distribution');

            find.sort("user.name events.dtstart");

            find.exec((err, requests) => {

                if (err) {
                    return reject(err);
                }

                let data = [];
                let allRights = [];

                requests.forEach(request => {
                    let row = {};
                    row[NAME]       = request.user.name;
                    row[DEPARTMENT] = request.user.department;
                    row[CREATEDON]  = request.timeCreated;
                    row[DTSTART]    = request.events[0].dtstart;
                    row[DTEND]      = request.events[request.events.length-1].dtend;
                    row[QUANTITY]   = request.getQuantity();
                    row[STATUS]     = request.getDispStatus();
                    row[CONSUMED]   = request.getConsumedQuantity();

                    // consumption details: one column per right for elements

                    request.absence.distribution.forEach(elem => {
                        row[elem.right.name] = elem.consumedQuantity;
                        if (-1 === allRights.indexOf(elem.right.name)) {
                            allRights.push(elem.right.name);
                        }
                    });

                    data.push(row);
                });


                // add all rights in all rows

                data.map(row => {
                    allRights.forEach(name => {
                        if (undefined === row[name]) {
                            row[name] = 0;
                        }
                    });
                });

                resolve(data);
            });
        });



    });


};
