'use strict';

const util = require('util');

exports = module.exports = function(params) {

    // mongoose-path-tree add a parent field
    var tree = require('mongoose-mpath');

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
        return this.getAllChildren({});
    };

    /**
     * Get sub departments tree
     * @return {Promise}
     */
    departmentSchema.methods.getSubTree = function()
    {
        return this.getChildrenTree({});
    };

    /**
     * Check minActiveUsers
     * @return Promise
     */
    departmentSchema.methods.checkMinActiveUsers = function(dtstart, dtend) {

        const gt = params.app.utility.gettext;
        const department = this;


        if (!department.minActiveUsers) {
            return Promise.resolve();
        }



        return department.getUsers()
        .then(users => {
            return Promise.all(
                users
                .filter(user => (user.roles.account._id !== undefined))
                .map(user => {
                    return user.roles.account.getLeaveEvents(dtstart, dtend);
                })
            ).then(userEvents => {
                return userEvents
                .map(userEra => userEra.periods)
                .filter(uEvents => {
                    return (uEvents.length === 0);
                });
            });
        })
        .then(emptyPeriods => {
            if (emptyPeriods.length > department.minActiveUsers) {
                return true;
            }

            throw new Error(util.format(
                gt.gettext('A leave over this period is not possible because %d people must be available in the "%s" department'),
                department.minActiveUsers,
                department.name
            ));
        });
    };




    departmentSchema.index({ 'name': 1 }, { unique: true });
	departmentSchema.index({ 'parent': 1 });
	departmentSchema.set('autoIndex', params.autoIndex);

    departmentSchema.plugin(tree);

	params.db.model('Department', departmentSchema);

};
