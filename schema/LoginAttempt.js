'use strict';

exports = module.exports = function(params) {
  var attemptSchema = new params.mongoose.Schema({
    ip: { type: String, default: '' },
    user: { type: String, default: '' },
    time: { type: Date, default: Date.now, expires: '20m' }
  });
  attemptSchema.index({ ip: 1 });
  attemptSchema.index({ user: 1 });
  attemptSchema.set('autoIndex', params.autoIndex);
  params.db.model('LoginAttempt', attemptSchema);
};
