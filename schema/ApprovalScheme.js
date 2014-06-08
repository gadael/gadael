'use strict';

exports = module.exports = function(app, mongoose) {
	
  var approvalSchemeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    steps: [mongoose.modelSchemas.approvalStep],
    timeCreated: { type: Date, default: Date.now }
  });
  app.db.model('ApprovalScheme', approvalSchemeSchema);
};


