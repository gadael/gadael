'use strict';

exports = module.exports = function(app, mongoose) {
  var requestSchema = new mongoose.Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true }
    },
    
    createdBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true }
    },
    
    absence: { type: mongoose.Schema.Types.ObjectId, ref: 'Absence' },
    time_saving_deposit: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSavingDeposit' },
    workperiod_recover: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkperiodRecover' },
    timeCreated: { type: Date, default: Date.now },
    
    requestLog: [mongoose.modelSchemas.RequestLog],
  });

  requestSchema.index({ 'user.id': 1 });
  requestSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('Request', requestSchema);
};
