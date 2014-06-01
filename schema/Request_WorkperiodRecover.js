'use strict';

exports = module.exports = function(app, mongoose) {
  var wprSchema = new mongoose.Schema({
	event: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent', required: true  },
    timeCreated: { type: Date, default: Date.now }
  });
  
  wprSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('WorkperiodRecover', wprSchema);
};

