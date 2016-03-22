'use strict';

var Q = require('q');

exports = module.exports = function(params) {

    // mongoose-path-tree add a parent field
    var tree = require('mongoose-path-tree');

	var mongoose = params.mongoose;
	var departmentSchema = new mongoose.Schema({
		name: { type: String, unique: true, required: true },
		timeCreated: { type: Date, default: Date.now },

        // initialisation for approval steps
        operator: { type: String, enum: ['OR', 'AND'], default: 'OR' },

        // we have parent and path mananged by the tree plugin


        // list of business days for the department
        // they will be used to set the consumed quantity  for
        // the part-times users
        businessDays: {
            SU: { type: Boolean, default: false },
            MO: { type: Boolean, default: true },
            TU: { type: Boolean, default: true },
            WE: { type: Boolean, default: true },
            TH: { type: Boolean, default: true },
            FR: { type: Boolean, default: true },
            SA: { type: Boolean, default: false }
        }
	});


    /**
	 * Find all users in department
	 * @return {Promise}
	 */
	departmentSchema.methods.getUsers = function getUsers(callback) {
		var query = this.model('User')
			.find({ department: this._id })
            .populate('roles.admin')
            .populate('roles.manager')
            .populate('roles.account');

		return query.exec(callback);
	};


  
	/**
	 * Find all managers of department
	 * 
	 */ 
	departmentSchema.methods.getManagers = function getManagers(callback) {
		return this.model('Manager')
			.find({ department: this._id })
            .populate('user.id', 'lastname firstname email image department isActive timeCreated roles')
			.exec(callback);
	};


    /**
     * Get sub departments
     * @return {Promise}
     */
    departmentSchema.methods.getSubDepartments = function()
    {
        var deferred = Q.defer();

        this.getChildren(true, deferred.makeNodeResolver());

        return deferred.promise;
    };


    /**
     * Get sub departments tree
     * @return {Promise}
     */
    departmentSchema.methods.getSubTree = function()
    {
        var deferred = Q.defer();

        this.getChildrenTree(deferred.makeNodeResolver());

        return deferred.promise;
    };


    /**
     * Get ancestors
     * @return {Promise}
     */
    departmentSchema.methods.getAncestors = function()
    {
        var deferred = Q.defer();

        this.getAncestors(deferred.makeNodeResolver());

        return deferred.promise;
    };




    departmentSchema.index({ 'name': 1 }, { unique: true });
	departmentSchema.index({ 'parent': 1 });
	departmentSchema.set('autoIndex', params.autoIndex);

    departmentSchema.plugin(tree);

	params.db.model('Department', departmentSchema);

};
