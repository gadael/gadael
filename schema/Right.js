'use strict';

exports = module.exports = function(params) {
	var rightSchema = new params.mongoose.Schema({
		name: { type: String, unique: true },
		timeCreated: { type: Date, default: Date.now }
	});

	rightSchema.index({ 'name': 1 }, { unique: true });
	rightSchema.set('autoIndex', params.autoIndex);

	params.db.model('Right', rightSchema);
};


