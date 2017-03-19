'use strict';

exports = module.exports = function(params) {

    var mongoose = params.mongoose;

	var messageSchema = new params.mongoose.Schema({
		subject: { type: String, required: true },
		html: String,
        text: String,
        from: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
            name: String,
            address: String
        },
		to: [{       // recipient
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
            name: String,
            address: String
        }],
		emailSent: { type: Boolean, default: false },

        hostname: String, // this is the hostname used to create MessageId in email
                          // with message._id @ message.hostname
        infos: {          // response from nodemailer
            accepted: Array,
            rejected: Array,
            pending: Array
        },
        error: {          // error from nodemailer
            code: String,
            message: String
        },
		timeCreated: { type: Date, default: Date.now }
	});



	messageSchema.set('autoIndex', params.autoIndex);

	params.db.model('Message', messageSchema);
};
