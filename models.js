'use strict';

var models = {};

exports = module.exports = models;

// Default set of options used when loading models
// the requirements are overwritten defferently in company api and in tests
models.requirements = {
	mongoose: null,		 // the mongoose object
	db: null,			 // database connexion to link with shemas
	autoIndex: false,	 // boolean used to autoindex schemas
	removeIndex: false,	 // Remove index on start, autoIndex must be true to recreate the index
    embeddedSchemas: [], // collect embedable schemas in this array
	app: null			 // reference to application, not really fully loaded when load() is called
};



/**
 * Load all models
 * return a promise for indexation
 * @return {Promise}
 */
models.load = function() {

	var requirements = this.requirements;

	//embeddable docs first
	require('./schema/Status')(requirements);
	require('./schema/StatusLog')(requirements);
	require('./schema/RequestLog')(requirements);
    require('./schema/ApprovalStep')(requirements);
	require('./schema/Right_Rule')(requirements);
    require('./schema/RightAdjustment')(requirements);
    require('./schema/Request_WorkperiodRecover')(requirements);
    require('./schema/Request_TimeSavingDeposit')(requirements);
    require('./schema/ValidInterval')(requirements);
    require('./schema/CompulsoryLeaveRequest')(requirements);

	//then regular docs


    require('./schema/AccountCollection')(requirements);
    require('./schema/AccountScheduleCalendar')(requirements);
    require('./schema/AccountNWDaysCalendar')(requirements);
	require('./schema/Company')(requirements);
	require('./schema/User')(requirements);
	require('./schema/User_Admin')(requirements);
	require('./schema/User_Account')(requirements);
	require('./schema/User_Manager')(requirements);
	require('./schema/Department')(requirements);
	require('./schema/LoginAttempt')(requirements);
    require('./schema/Request_AbsenceElem')(requirements);
	require('./schema/Request')(requirements);
    require('./schema/RecoverQuantity')(requirements);
    require('./schema/CompulsoryLeave')(requirements);

	require('./schema/RightCollection')(requirements);
	require('./schema/Type')(requirements);
	require('./schema/Right')(requirements);
    require('./schema/Right_Renewal')(requirements);
	require('./schema/Calendar')(requirements);
	require('./schema/CalendarEvent')(requirements);
    require('./schema/Beneficiary')(requirements);
    require('./schema/Adjustment')(requirements);
    require('./schema/Message')(requirements);
	require('./schema/Invitation')(requirements);
	require('./schema/UserRenewalStat')(requirements);


	if (!requirements.autoIndex) {
		// Nothing to index
		return Promise.resolve([]);
	}

	let promises = [];

	requirements.db.modelNames().forEach(name => {

		let indexPromise = new Promise((resolve, reject) => {

			let indexes = requirements.db.models[name].schema.indexes();

			if (indexes.length === 0) {
				// nothing to index
				return resolve(true);
			}

			/**
			 * Add a on index to capture indexation errors
			 */
	        requirements.db.models[name].on('index', function(err) {
	            if (err) {
		            return reject(err);
	            }

				resolve(true);
	        });
		});


		promises.push(indexPromise);


        if (requirements.removeIndex) {
            requirements.db.models[name].collection.dropAllIndexes((err, results) => {
                if (err) {
                    console.error(err);
                }
                console.log('removeIndex=true Indexes where removed on '+name);
            });
        }
    });

	return Promise.all(promises);
};
