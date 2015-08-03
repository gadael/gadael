'use strict';

/**
 * A user, department manager
 * can manage vacation requests for the departments users accounts
 */  
exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	
	var managerSchema = new mongoose.Schema({
		user: {
		  id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		  name: { type: String, default: '' }
		},
		department: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
		timeCreated: { type: Date, default: Date.now }
	});






	managerSchema.index({ 'user.id': 1 });
	managerSchema.set('autoIndex', params.autoIndex);



    /**
     * Get list of managed departments
     * @returns {Promise}   promised array
     */
    managerSchema.methods.getManagedDepartments = function() {

        var Q = require('q');
        var deferred = Q.defer();

        this.populate('department', function(err, manager) {
            if (err) {
                return deferred.reject(err);
            }

            var mainDep, subDepPromises = [], departments = [];

            // for each department, get the sub-departments list
            for(var i =0; i<manager.department.length; i++) {
                mainDep = manager.department[i];
                departments.push(mainDep);
                subDepPromises.push(mainDep.getSubDepartments());
            }

            Q.all(subDepPromises).then(function(list) {
                list.map(function(arr) {
                    Array.prototype.push.apply(departments, arr);
                });

                deferred.resolve(departments);

            }, deferred.reject);


        });

        return deferred.promise;
    };
  
	params.db.model('Manager', managerSchema);
};

