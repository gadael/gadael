'use strict';

exports = module.exports = function(app, mongoose) {
  var typeSchema = new mongoose.Schema({
    name: { type: String, unique: true },		
    color: { type: String },					// color in calendar
    group: { type: Boolean, default: false }, 	// user can select only one right from type
    timeCreated: { type: Date, default: Date.now }
  });
  
  typeSchema.index({ 'name': 1 }, { unique: true });
  typeSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('Type', typeSchema);
};

