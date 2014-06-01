'use strict';

exports = module.exports = function(app, mongoose) {
  var rightSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    timeCreated: { type: Date, default: Date.now }
  });
  
  rightSchema.index({ 'name': 1 }, { unique: true });
  rightSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('Right', rightSchema);
};


