'use strict';

exports = module.exports = function(app, mongoose) {
  var adminSchema = new mongoose.Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },
    timeCreated: { type: Date, default: Date.now }
  });

  adminSchema.index({ 'user.id': 1 });
  adminSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('Admin', adminSchema);
};
