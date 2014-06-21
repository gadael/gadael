'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var adminSchema = new mongoose.Schema({
		user: {
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			name: { type: String, default: '' }
		},
		timeCreated: { type: Date, default: Date.now }
	});

	adminSchema.index({ 'user.id': 1 });
	adminSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('Admin', adminSchema);
};
