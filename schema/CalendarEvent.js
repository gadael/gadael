'use strict';

/**
 * periods to display on calendar or exported to icalendar format
 * 
 * can be associated to:
 * 	- vacation requests elements (quantity + right + absence request)
 *  - workshedules (external url provide source as ICS, stored here for cache)
 *  - non working days (external url provide source as ICS, stored here for cache)
 * 
 * 
 */
exports = module.exports = function(app, mongoose) {
  var eventSchema = new mongoose.Schema({
    dtstart: { type: Date, required: true },
    dtend: { type: Date, required: true },
    rrule: { type: String },
    ics: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarIcs' },
    absenceElem: { type: mongoose.Schema.Types.ObjectId, ref: 'AbsenceElem' },
    timeCreated: { type: Date, default: Date.now }
  });

  eventSchema.index({ 'dtstart': 1 });
  eventSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('CalendarEvent', eventSchema);
};
