'use strict';

exports = module.exports = function(app, mongoose) {
  var collectionSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true  },
    timeCreated: { type: Date, default: Date.now }
  });
  
  collectionSchema.set('autoIndex', (app.get('env') === 'development'));
  
  collectionSchema.index({ name: 1 });
  
  app.db.model('RightCollection', collectionSchema);
};

