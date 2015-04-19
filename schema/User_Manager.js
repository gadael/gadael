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


    /**
     * Test if the user is manager of another user
     * Promise resolve to a boolean
     * @this Manager
     *
     *
     * @param {User} user   Mongoose user document
     * @return {Promise}
     */
    managerSchema.methods.isManagerOf = function(user) {

        var Q = require('q');
        var manager = this;



        if (!manager.department) {
            return Q.fcall(function () {
                return false;
            });
        }

        var deferred = Q.defer();
        var i, j;

        user.getDepartmentsAncestors().then(function(arr) {
            for(i=0; i<manager.department.length; i++) {
                for(j=0; j<arr.length; j++) {
                    if (manager.department[i].toString() === arr[j]._id.toString()) {
                        deferred.resolve(true);
                    }
                }
            }

            deferred.resolve(false);
        }).catch(deferred.reject);


        return deferred.promise;
    };



	managerSchema.index({ 'user.id': 1 });
	managerSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('Manager', managerSchema);
};

