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

    let deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

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
 * @return {Promise}
 */
api.createRandomAdmin = function(app, email, password) {

    return new Promise(function(resolve, reject) {
         api.createRandomUser(app, email, password).then(function(randomUser) {
            randomUser.user.saveAdmin().then(function() {
                resolve(randomUser);
            }).catch(reject);
        });
    });
};



/**
 * Create an account user
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]
 * @return {Promise}
 */
api.createRandomAccount = function(app, email, password) {

    return new Promise(function(resolve, reject) {
        api.createRandomUser(app, email, password).then(function(randomUser) {
            randomUser.user.saveAccount().then(function() {
                resolve(randomUser);
            }).catch(reject);
        });
    });
};






/**
 * Create a manager user
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]
 *
 * @return {Promise}
 */
api.createRandomManager = function(app, email, password) {

    return new Promise(function(resolve, reject) {
        api.createRandomUser(app, email, password).then(function(randomUser) {
            randomUser.user.saveManager().then(function() {
                 resolve(randomUser);
            }).catch(reject);
        });
    });
};



/**
 * create random account, one test right and a one day request
 * @param   {Express} app
 * @param   {Object} collectionProps
 * @returns {Promise} Resolve to absence element
 */
api.createRandomAccountRequest = function(app, collectionProps) {

    let rightApi = require('./Right.api');
    let requestApi = require('./Request.api');

    return new Promise(function(resolve, reject) {
        api.createRandomAccount(app).then(function(randomUser) {
            rightApi.addTestRight(app, randomUser.user, collectionProps).then(collection => {
                randomUser.user.populate('roles.account', (err) => {
                    if (err) {
                        return reject(err);
                    }

                    requestApi.createRandomAbsence(app, randomUser.user).then(request => {
                        resolve(request.absence.distribution[0]);
                    }).catch(reject);
                });
            }).catch(reject);
        }).catch(reject);
    });
};
