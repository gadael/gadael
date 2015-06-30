'use strict';

var api = {};
exports = module.exports = api;


/**
 * Generate "count" random users in the app
 * 
 * @param 	object		app			Express app or headless mock app
 * @param	int			count		
 * @param	function	callback	Receive the created users
 */  
api.populate = function(app, count, callback) {
	
	// create some users
	
	var async = require('async');

	async.times(count, function(n, next){
		
		app.db.models.User.createRandom('secret', function(err, user) {
			next(err, user);
		});
	}, function(err, users) {
		
		if (err)
		{
			console.log(err);
		}
		
		callback(users);
	});
};



/**
 * Create an admin user
 * 
 */ 
api.createAdmin = function(app, email, password) {
	var Q = require('q');
    var deferred = Q.defer();

    var userModel = app.db.models.User;
    var admin = new userModel();

    userModel.encryptPassword(password, function(err, hash) {

        if (err) {
            deferred.reject(new Error(err));
            return;
        }

        admin.password = hash;
        admin.email = email;
        admin.lastname = 'admin';
        admin.saveAdmin(function(err, user) {

            if (err) {
                deferred.reject(new Error(err));
                return;
            }

            deferred.resolve(user);
        });
    });


    return deferred.promise;
};
