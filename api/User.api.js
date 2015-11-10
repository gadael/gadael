'use strict';

var api = {};
exports = module.exports = api;

var Q = require('q');


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
			console.trace(err);
		}
		
		callback(users);
	});
};


/**
 * Create random user
 *
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]
 *
 * @return {Promise}
 */
api.createRandomUser = function(app, email, password) {

    var deferred = Q.defer();

    var Charlatan = require('charlatan');
    var userModel = app.db.models.User;
    var user = new userModel();

    var clearPassword = password || Charlatan.Internet.password();

    userModel.encryptPassword(clearPassword, function(err, hash) {

        if (err) {
            deferred.reject(new Error(err));
            return;
        }

        user.password = hash;
        user.email = email || Charlatan.Internet.safeEmail();
        user.lastname = Charlatan.Name.lastName();
		user.firstname = Charlatan.Name.firstName();

        deferred.resolve({
            user: user,
            password: clearPassword
        });

    });


    return deferred.promise;
};



/**
 * Create an admin user
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]
 */
api.createRandomAdmin = function(app, email, password) {

    var deferred = Q.defer();

    api.createRandomUser(app, email, password).then(function(randomUser) {
        randomUser.user.saveAdmin().then(function() {
            deferred.resolve(randomUser);
        });
    });

    return deferred.promise;
};



/**
 * Create an account user
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]
 */
api.createRandomAccount = function(app, email, password) {

    var deferred = Q.defer();

    api.createRandomUser(app, email, password).then(function(randomUser) {
        randomUser.user.saveAccount().then(function() {
            deferred.resolve(randomUser);
        });

    });

    return deferred.promise;
};






/**
 * Create a manager user
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]
 */
api.createRandomManager = function(app, email, password) {

    var deferred = Q.defer();

    api.createRandomUser(app, email, password).then(function(randomUser) {
        randomUser.user.saveManager().then(function() {
             deferred.resolve(randomUser);
        });

    });

    return deferred.promise;
};
