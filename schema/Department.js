'use strict';


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

        // check min active user for each leave request creation
        minActiveUsers: Number
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
	 * @return {Promise}
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
        let department = this;

        return new Promise((resolve, reject) => {
            department.getChildren(true, (err, children) => {
                if (err) {
                    return reject(err);
                }

                resolve(children);
            });
        });

    };


    /**
     * Get sub departments tree
     * @return {Promise}
     */
    departmentSchema.methods.getSubTree = function()
    {
        let department = this;

        return new Promise((resolve, reject) => {
            department.getChildrenTree(true, (err, children) => {
                if (err) {
                    return reject(err);
                }

                resolve(children);
            });
        });
    };


    /**
     * Get ancestors
     * @return {Promise}
     */
    departmentSchema.methods.getAncestors = function()
    {
        let department = this;

        return new Promise((resolve, reject) => {
            department.getAncestors(true, (err, children) => {
                if (err) {
                    return reject(err);
                }

                resolve(children);
            });
        });

    };




    departmentSchema.index({ 'name': 1 }, { unique: true });
	departmentSchema.index({ 'parent': 1 });
	departmentSchema.set('autoIndex', params.autoIndex);

    departmentSchema.plugin(tree);

	params.db.model('Department', departmentSchema);

};
