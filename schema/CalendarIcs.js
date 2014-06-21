'use strict';

/**
 * Source URL for non-working day ICS file or workshedules ICS file
 * 
 * The events in CalendarEvent schema will be delete and recreated according to the ics source file
 * the past events will never be modified
 */  
exports = module.exports = function(params) {
  var icsSchema = new params.mongoose.Schema({
    url: { type: String, required: true },
    lastUpdate: { type: Date }, 
    timeCreated: { type: Date, default: Date.now }
  });

  icsSchema.index({ 'lastUpdate': 1 });
  icsSchema.set('autoIndex', params.autoIndex);
  
  params.db.model('CalendarIcs', icsSchema);
};

