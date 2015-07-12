'use strict';

exports = module.exports = function(params) {

    var mongoose = params.mongoose;

	var messageSchema = new params.mongoose.Schema({
		subject: { type: String, required: true },
		body: String,
		recipient: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            name: { type: String, required: true }
        },
		emailSent: { type: Boolean, default: false },
		timeCreated: { type: Date, default: Date.now }
	});

	messageSchema.index({ name: 1 });

	messageSchema.set('autoIndex', params.autoIndex);

	params.db.model('Message', messageSchema);
};
