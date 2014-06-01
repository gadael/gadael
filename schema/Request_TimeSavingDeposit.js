'use strict';

exports = module.exports = function(app, mongoose) {
  var tsdSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
    quantity: { type: Number, required: true }
  });
  
  tsdSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('TimeSavingDeposit', tsdSchema);
};
