'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
  var tsdSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
    quantity: { type: Number, required: true }
  });
  
  tsdSchema.set('autoIndex', params.autoIndex);
  
  params.db.model('TimeSavingDeposit', tsdSchema);
};
