'use strict';


exports = module.exports = function(params) {

    let mongoose = params.mongoose;

	let invitationSchema = new mongoose.Schema({

        createdBy: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          name: { type: String, required: true }
        },

		email: { type: String, unique: true, required: true },
        emailToken: { type: String, unique: true, required: true },
		timeCreated: { type: Date, default: Date.now },
        department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        nonWorkingDaysCalendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },
        done: { type: Boolean, default: false },

        message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
	});



	invitationSchema.set('autoIndex', params.autoIndex);

	params.db.model('Invitation', invitationSchema);

};
