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



api.createRandomUser = function(app, email, password) {
    var Q = require('q');
    var deferred = Q.defer();

    var userModel = app.db.models.User;
    var user = new userModel();

    userModel.encryptPassword(password, function(err, hash) {

        if (err) {
            deferred.reject(new Error(err));
            return;
        }

        user.password = hash;
        user.email = email;
        user.lastname = 'admin';

        deferred.resolve(user);

    });


    return deferred.promise;
};



/**
 * Create an admin user
 *
 */
api.createRandomAdmin = function(app, email, password) {
	var Q = require('q');
    var deferred = Q.defer();

    api.createRandomUser(app, email, password).then(function(user) {
        user.saveAdmin(deferred.makeNodeResolver());
    });

    return deferred.promise;
};



/**
 * Create an account user
 *
 */
api.createRandomAccount = function(app, email, password) {
	var Q = require('q');
    var deferred = Q.defer();

    api.createRandomUser(app, email, password).then(function(user) {
        user.saveAccount(deferred.makeNodeResolver());
    });

    return deferred.promise;
};






/**
 * Create a manager user
 *
 */
api.createRandomManager = function(app, email, password) {
	var Q = require('q');
    var deferred = Q.defer();

    api.createRandomUser(app, email, password).then(function(user) {
        user.saveManager(deferred.makeNodeResolver());
    });

    return deferred.promise;
};
