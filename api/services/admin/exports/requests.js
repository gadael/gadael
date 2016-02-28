'use strict';


var periodCriterion = require('../../../../modules/periodcriterion');



/**
 *
 */
exports = module.exports = function(service, from, to) {

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

            find.exec((err, requests) => {

                if (err) {
                    return reject(err);
                }

                // TODO: format for xlsx
                resolve(requests);
            });
        });



    });


};
