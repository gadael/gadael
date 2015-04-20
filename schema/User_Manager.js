'use strict';

/**
 * A user, department manager
 * can manage vacation requests for the departments users accounts
 */  
exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	
	var managerSchema = new mongoose.Schema({
		user: {
		  id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		  name: { type: String, default: '' }
		},
		department: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
		timeCreated: { type: Date, default: Date.now }
	});






	managerSchema.index({ 'user.id': 1 });
	managerSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('Manager', managerSchema);
};

