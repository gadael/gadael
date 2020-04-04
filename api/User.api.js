'use strict';

const Charlatan = require('charlatan');

var api = {};
exports = module.exports = api;


function linkDefaultAccountCollection(app, account) {
	let link = new app.db.models.AccountCollection();
	link.account = account._id;
	link.rightCollection = '5740adf51cf1a569643cc520';
	link.from = new Date(2016,0,1,0,0,0,0);
	return link.save();
}

function linkFrenchDefaultScheduleCalendar(app, account) {
	let scheduleCalendar = new app.db.models.AccountScheduleCalendar();
	scheduleCalendar.account = account._id;
	scheduleCalendar.calendar = '5740adf51cf1a569643cc101'; // 40H full time work schedule
	scheduleCalendar.from = new Date(2000,0,1,0,0,0,0);
	return scheduleCalendar.save();
}

function linkFrenchDefaultNWDaysCalendar(app, account) {
	let nonworkingdaysCalendar = new app.db.models.AccountNWDaysCalendar();
	nonworkingdaysCalendar.account = account._id;
	nonworkingdaysCalendar.calendar = '5740adf51cf1a569643cc100'; // france metropolis
	nonworkingdaysCalendar.from = new Date(2000,0,1,0,0,0,0);
	return nonworkingdaysCalendar.save();
}


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
 * Create user with encrypted password
 * @param {Express} app
 * @param {string} email
 * @param {string} password		Encrypted password
 * @param {string} lastname
 * @param {string} firstname
 *
 * @return {User}
 */
api.createEncUser = function(app, email, password, lastname, firstname) {

	let userModel = app.db.models.User;
	let user = new userModel();

	user.password = password;
	user.email = email;
	user.lastname = lastname;
	user.firstname = firstname;

	return user;
};

/**
 * Update password by email
 * resolve to a randomUser object with a password property
 *
 * @param {Express} app
 * @param {String} email
 * @param {String} [password] Optional clear password
 *
 * @return {Promise}
 */
api.updatePassword = function(app, email, password) {

	let User = app.db.models.User;
	let clearPassword = password || Charlatan.Internet.password();

	return User.findOne()
	.where('email')
	.equals(email)
	.exec()
	.then(user => {
		if (!user) {
			throw new Error('No user with the email '+email);
		}

		return User.encryptPassword(clearPassword)
		.then(hash => {
			user.password = hash;
			return user.save();
		});
	})
	.then(user => {
		return {
            user: user,
            password: clearPassword
        };
	});
};


/**
 * Create random user
 * If all parameters are provided, there is no randomness
 * The user is not saved
 *
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]		Clear text password
 * @param {string} [lastname]
 * @param {string} [firstname]
 *
 * @return {Promise}
 */
api.createRandomUser = function(app, email, password, lastname, firstname) {


	let userModel = app.db.models.User;
	let user = new userModel();

    var clearPassword = password || Charlatan.Internet.password();

    return userModel.encryptPassword(clearPassword)
	.then(hash => {

        user.password = hash;
        user.email = email || Charlatan.Internet.safeEmail();
        user.lastname = lastname || Charlatan.Name.lastName();
		user.firstname = firstname || Charlatan.Name.firstName();

        return {
            user: user,
            password: clearPassword
        };
    });

};

/**
 * Create an admin user from encrypted password
 * This is for new user, will give the wellcome page 
 * @param {Express} app
 * @param {string} email
 * @param {string} password		Encrypted password
 * @param {string} lastname
 * @param {string} firstname
 * @return {Promise}
 */
api.createEncAdmin = function(app, email, password, lastname, firstname) {

	let user = api.createEncUser(app, email, password, lastname, firstname);
    return user.saveAdmin();
};


/**
 * Create an admin user
 * @param {Express} app
 * @param {string} [email]
 * @param {string} [password]		Clear text password
 * @param {string} [lastname]
 * @param {string} [firstname]
 * @return {Promise}
 */
api.createRandomAdmin = function(app, email, password, lastname, firstname) {

    return api.createRandomUser(app, email, password, lastname, firstname)
	 .then(randomUser => {
        return randomUser.user.saveAdmin()
		.then(() => {
            return randomUser;
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

    return api.createRandomUser(app, email, password)
	.then(randomUser => {
        randomUser.user.isActive = false;

		return randomUser.user.saveAdmin()
		.then(() => {
            return randomUser;
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
    .then(randomUser => {
        return randomUser.user.saveAccount()
		.then(user => {
			return user.getAccount();
		})
        .then(account => {
            return Promise.all([
                linkFrenchDefaultScheduleCalendar(app, account),
                linkFrenchDefaultNWDaysCalendar(app, account)
            ]);
        })
        .then(() => {
            return randomUser;
        });
    });
};


/**
 * Set general collection 100%
 * @return {Promise}
 */
api.linkToDefaultCollection = function(app, randomUser) {
	return randomUser.user.getAccount()
	.then(account => {
		return linkDefaultAccountCollection(app, account);
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
 * @returns {Promise} 			      Resolve to object
 */
api.createRandomAccountRequest = function(app, collectionProps, rightProps, dtstart, dtend, nbdays) {

    let rightApi = require('./Right.api');
    let requestApi = require('./Request.api');

    return api.createRandomAccount(app)
	.then(randomUser => {
        return rightApi.addTestRight(app, randomUser.user, collectionProps, rightProps)
		.then(() => {
            return randomUser.user.populate('roles.account')
			.execPopulate()
			.then(() => {
                return requestApi.createRandomAbsence(app, randomUser.user, dtstart, dtend, nbdays)
				.then(request => {
                    return {
						request: request,
						elem: request.absence.distribution[0],
						randomUser: randomUser
					};
                });
            });
        });
    });
};


/**
 * Create random account, one test right and a request on a proportion consumption type
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
	        consumption: 'proportion'
	    },
	    dtstart,
	    dtend,
	    nbdays
    )
	.then(o => {
		return o.elem;
	});
};



/**
 * Create random account, one test right and a request on a business days consumption type
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
        consumption: 'businessDays'
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
    ).then(o => {
		return o.elem;
	});
};


/**
 * Create random account, one test right and a request on a working days consumption type
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
        consumption: 'workingDays'
    },
    dtstart,
    dtend,
    nbdays
    ).then(o => {
		return o.elem;
	});
};
