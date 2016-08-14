'use strict';

exports = module.exports = function(params) {

    var mongoose = params.mongoose;

	var messageSchema = new params.mongoose.Schema({
		subject: { type: String, required: true },
		html: String,
        text: String,
        from: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: String,
            address: String
        },
		to: [{       // recipient
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            name: { type: String, required: true },
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

    /**
     * Set message properties from the nodemailer data structure
     * @return {String}
     */
    messageSchema.methods.setNodemailerData = function(data) {
        //TODO remove
    };

	messageSchema.index({ name: 1 });
	messageSchema.set('autoIndex', params.autoIndex);

	params.db.model('Message', messageSchema);
};
