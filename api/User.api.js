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
 * @param {string} [lastname]
 * @param {string} [firstname]
 * 
 * @return {Promise}
 */
api.createRandomUser = function(app, email, password, lastname, firstname) {

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
        user.lastname = lastname || Charlatan.Name.lastName();
		user.firstname = firstname || Charlatan.Name.firstName();

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
 * Create an admin user
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]
 * @return {Promise}
 */
api.createRandomDisabledAdmin = function(app, email, password) {

    return new Promise(function(resolve, reject) {
         api.createRandomUser(app, email, password).then(function(randomUser) {
            randomUser.user.isActive = false;
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
api.createRandomAccount = function(app, email, password, lastname, firstname) {

    return api.createRandomUser(app, email, password, lastname, firstname)
    .then(function(randomUser) {
        return randomUser.user.saveAccount()
        .then(() => {

            let scheduleCalendar = new app.db.models.AccountScheduleCalendar();
            scheduleCalendar.account = randomUser.user.roles.account;
            scheduleCalendar.calendar = '5740adf51cf1a569643cc101'; // 40H full time work schedule
            scheduleCalendar.from = new Date(2000,0,1,0,0,0,0);

            let nonworkingdaysCalendar = new app.db.models.AccountNWDaysCalendar();
            nonworkingdaysCalendar.account = randomUser.user.roles.account;
            nonworkingdaysCalendar.calendar = '5740adf51cf1a569643cc100'; // france metropolis
            nonworkingdaysCalendar.from = new Date(2000,0,1,0,0,0,0);

            return Promise.all([
                scheduleCalendar.save(),
                nonworkingdaysCalendar.save()
            ]);
        })
        .then(() => {
            return randomUser;
        });
    });

};










/**
 * Create a manager user
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]
 * @param {string} [lastname]
 * @param {string} [firstname]
 *
 * @return {Promise}
 */
api.createRandomManager = function(app, email, password, lastname, firstname) {

    return new Promise(function(resolve, reject) {
        api.createRandomUser(app, email, password, lastname, firstname).then(function(randomUser) {
            randomUser.user.saveManager().then(function() {
                 resolve(randomUser);
            }).catch(reject);
        });
    });
};



/**
 * create random account, one test right and a request
 * @param   {Express} app
 * @param   {Object}  collectionProps
 * @param   {Object}  rightProps
 * @param   {Date}    dtstart         Start date of the request
 * @param   {Date}    dtend           end date of the request
 * @param   {Number}  nbdays          Duration in worked days
 * @returns {Promise} Resolve to absence element
 */
api.createRandomAccountRequest = function(app, collectionProps, rightProps, dtstart, dtend, nbdays) {

    let rightApi = require('./Right.api');
    let requestApi = require('./Request.api');

    return new Promise(function(resolve, reject) {
        api.createRandomAccount(app).then(function(randomUser) {
            rightApi.addTestRight(app, randomUser.user, collectionProps, rightProps).then(() => {
                randomUser.user.populate('roles.account', (err) => {
                    if (err) {
                        return reject(err);
                    }

                    requestApi.createRandomAbsence(app, randomUser.user, dtstart, dtend, nbdays).then(request => {
                        resolve(request.absence.distribution[0]);
                    }).catch(reject);
                });
            }).catch(reject);
        }).catch(reject);
    });
};


/**
 * Create random account, one test right and a request on a proportion consuption type
 * @param   {Express} app
 * @param   {Number}  attendance percentage
 * @param   {Date}    dtstart    Start date of the request
 * @param   {Date}    dtend      End date of the request
 * @param   {Number}  nbdays     Duration in worked days
 * @returns {Promise} Resolve to absence element
 */
api.createProportionConsRequest = function(app, attendance, dtstart, dtend, nbdays) {

    let uniqueName = 'proportion '+attendance+' '+dtstart+' '+nbdays;

    return api.createRandomAccountRequest(app, {
        name: uniqueName,
        attendance: attendance
    }, {
        name: uniqueName,
        consuption: 'proportion'
    },
    dtstart,
    dtend,
    nbdays
    );
};



/**
 * Create random account, one test right and a request on a business days consuption type
 * @param   {Express} app
 * @param   {Date}    dtstart
 * @param   {Date}    dtend
 * @param   {Number}  nbdays
 * @param   {Number}  availableQuantity
 * @returns {Promise} Resolve to absence element
 */
api.createBusinessDaysConsRequest = function(app, dtstart, dtend, nbdays, availableQuantity) {
    let uniqueName = 'BusinessDays '+dtstart+' '+nbdays+availableQuantity;

    let rightProps = {
        name: uniqueName,
        consuption: 'businessDays'
    };

    if (undefined !== availableQuantity) {
        rightProps.quantity = availableQuantity;
    }

    return api.createRandomAccountRequest(app, {
        name: uniqueName
    },
    rightProps,
    dtstart,
    dtend,
    nbdays
    );
};


/**
 * Create random account, one test right and a request on a working days consuption type
 * @param   {Express} app
 * @param   {Date}    dtstart
 * @param   {Date}    dtend
 * @param   {Number}  nbdays
 * @returns {Promise} Resolve to absence element
 */
api.createWorkingDaysConsRequest = function(app, dtstart, dtend, nbdays) {
    let uniqueName = 'workingDays '+dtstart+' '+nbdays;

    return api.createRandomAccountRequest(app, {
        name: uniqueName
    }, {
        name: uniqueName,
        consuption: 'workingDays'
    },
    dtstart,
    dtend,
    nbdays
    );
};
