'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var adminSchema = new mongoose.Schema({
		user: {
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, unique: true },
			name: { type: String, default: '' }
		},
		timeCreated: { type: Date, default: Date.now }
	});

	adminSchema.set('autoIndex', params.autoIndex);

	params.db.model('Admin', adminSchema);
};
