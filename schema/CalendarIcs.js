'use strict';

/**
 * Source URL for non-working day ICS file or workshedules ICS file
 * 
 * The events in CalendarEvent schema will be delete and recreated according to the ics source file
 * the past events will never be modified
 */  
exports = module.exports = function(app, mongoose) {
  var icsSchema = new mongoose.Schema({
    url: { type: String, required: true },
    lastUpdate: { type: Date }, 
    timeCreated: { type: Date, default: Date.now }
  });

  icsSchema.index({ 'lastUpdate': 1 });
  icsSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('CalendarIcs', icsSchema);
};

