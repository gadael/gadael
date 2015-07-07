'use strict';

exports = module.exports = function(params) {

    // mongoose-path-tree add a parent field
    var tree = require('mongoose-path-tree');

	var mongoose = params.mongoose;
	var departmentSchema = new mongoose.Schema({
		name: { type: String, unique: true },
		timeCreated: { type: Date, default: Date.now },
        
        // list of non working days calendars
        nonWorkingDays: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' }]

        // we have parent and path mananged by the tree plugin
	});


  
	/**
	 * Find all managers of department
	 * 
	 */ 
	departmentSchema.methods.getManagers = function(callback) {
		return this.model('Manager')
			.find({ department: this._id })
			.exec(callback);
	};


    departmentSchema.index({ 'name': 1 }, { unique: true });
	departmentSchema.index({ 'parent': 1 });
	departmentSchema.set('autoIndex', params.autoIndex);

    departmentSchema.plugin(tree);

	params.db.model('Department', departmentSchema);

};
