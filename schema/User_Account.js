'use strict';

/**
 * Account is a user with a collection or rights
 * registrations on site create accounts
 */
exports = module.exports = function(params) {

  var mongoose = params.mongoose;

  var accountSchema = new mongoose.Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },
    isVerified: { type: String, default: '' },				// email verification on change
    verificationToken: { type: String, default: '' },		// email verification on change

    status: {
      id: { type: String, ref: 'Status' },
      name: { type: String, default: '' },
      userCreated: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, default: '' },
        time: { type: Date, default: Date.now }
      }
    },
    statusLog: [mongoose.modelSchemas.StatusLog],

    // link to the non working days calendar
    nonWorkingDays: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },

    // link to the workschedule calendar
    workschedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },

    // start date for seniority vacation rights
    seniority: Date,
 
    userCreated: {											// the user who create this account
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },

    notify: {
		approvals: { type: Boolean, default: false },
		allocations: { type: Boolean, default: false }
	}
  });

  accountSchema.index({ user: 1 });
  accountSchema.index({ 'status.id': 1 });
  accountSchema.set('autoIndex', params.autoIndex);

  params.db.model('Account', accountSchema);
};
