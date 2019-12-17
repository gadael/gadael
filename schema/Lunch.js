'use strict';

exports = module.exports = function(params) {
    const mongoose = params.mongoose;
    const lunchSchema = new params.mongoose.Schema({
        user: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          name: { type: String, required: true }
        },
		day: { type: Date, required: true },
		timeCreated: { type: Date, default: Date.now }
	});

	lunchSchema.set('autoIndex', params.autoIndex);
    lunchSchema.index({ 'user.id': 1, day: 1 }, { unique: true });
	params.db.model('Lunch', lunchSchema);
};
