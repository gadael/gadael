'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var departmentSchema = new mongoose.Schema({
		name: { type: String, unique: true },
		parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
		timeCreated: { type: Date, default: Date.now }
	});

	departmentSchema.index({ 'name': 1 }, { unique: true });
	departmentSchema.index({ 'parent': 1 });
	departmentSchema.set('autoIndex', params.autoIndex);

	params.db.model('Department', departmentSchema);

  
	/**
	 * Find all managers of department
	 * 
	 */ 
	departmentSchema.methods.getManagers = function(callback) {
		return this.model('Manager')
			.find({ 'department._id': this._id })
			.exec(callback);
	};
};
