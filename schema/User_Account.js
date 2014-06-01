'use strict';

exports = module.exports = function(app, mongoose) {
  var accountSchema = new mongoose.Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },
    isVerified: { type: String, default: '' },
    verificationToken: { type: String, default: '' },
    name: {
      first: { type: String, default: '' },
      middle: { type: String, default: '' },
      last: { type: String, default: '' },
      full: { type: String, default: '' }
    },
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
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },
    search: [String]
  });
  
  accountSchema.index({ user: 1 });
  accountSchema.index({ 'status.id': 1 });
  accountSchema.index({ search: 1 });
  accountSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('Account', accountSchema);
};
