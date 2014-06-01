'use strict';

/**
 * A user, department manager
 * can manage vacation requests for the departments users accounts
 */  
exports = module.exports = function(app, mongoose) {
  var managerSchema = new mongoose.Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },
	department: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    timeCreated: { type: Date, default: Date.now }
  });

  managerSchema.index({ 'user.id': 1 });
  managerSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('Manager', managerSchema);
};

