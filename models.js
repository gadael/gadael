'use strict';

//embeddable docs first
const Status = require('./schema/Status');
const StatusLog = require('./schema/StatusLog');
const RequestLog = require('./schema/RequestLog');
const ApprovalStep = require('./schema/ApprovalStep');
const Right_Rule = require('./schema/Right_Rule');
const RightAdjustment = require('./schema/RightAdjustment');
const Request_WorkperiodRecover = require('./schema/Request_WorkperiodRecover');
const Request_TimeSavingDeposit = require('./schema/Request_TimeSavingDeposit');
const ValidInterval = require('./schema/ValidInterval');
const CompulsoryLeaveRequest = require('./schema/CompulsoryLeaveRequest');
const OvertimeSettlement = require('./schema/OvertimeSettlement');

//then regular docs


const AccountCollection = require('./schema/AccountCollection');
const AccountScheduleCalendar = require('./schema/AccountScheduleCalendar');
const AccountNWDaysCalendar = require('./schema/AccountNWDaysCalendar');
const Company = require('./schema/Company');
const User = require('./schema/User');
const User_Admin = require('./schema/User_Admin');
const User_Account = require('./schema/User_Account');
const User_Manager = require('./schema/User_Manager');
const Department = require('./schema/Department');
const LoginAttempt = require('./schema/LoginAttempt');
const Request_AbsenceElem = require('./schema/Request_AbsenceElem');
const Request = require('./schema/Request');
const RecoverQuantity = require('./schema/RecoverQuantity');
const CompulsoryLeave = require('./schema/CompulsoryLeave');

const RightCollection = require('./schema/RightCollection');
const Type = require('./schema/Type');
const Right = require('./schema/Right');
const Right_Renewal = require('./schema/Right_Renewal');
const Calendar = require('./schema/Calendar');
const CalendarEvent = require('./schema/CalendarEvent');
const Beneficiary = require('./schema/Beneficiary');
const Adjustment = require('./schema/Adjustment');
const Message = require('./schema/Message');
const Invitation = require('./schema/Invitation');
const UserRenewalStat = require('./schema/UserRenewalStat');
const Lunch = require('./schema/Lunch');
const Overtime = require('./schema/Overtime');

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

	const requirements = this.requirements;
	let promises = [];

	//embeddable docs first
	Status(requirements);
	StatusLog(requirements);
	RequestLog(requirements);
    ApprovalStep(requirements);
	Right_Rule(requirements);
    RightAdjustment(requirements);
    Request_WorkperiodRecover(requirements);
    Request_TimeSavingDeposit(requirements);
    ValidInterval(requirements);
    CompulsoryLeaveRequest(requirements);
    OvertimeSettlement(requirements);

	//then regular docs


    AccountCollection(requirements);
    AccountScheduleCalendar(requirements);
    AccountNWDaysCalendar(requirements);
	Company(requirements);
	User(requirements);
	User_Admin(requirements);
	User_Account(requirements);
	User_Manager(requirements);
	Department(requirements);
	LoginAttempt(requirements);
    Request_AbsenceElem(requirements);
	Request(requirements);
    RecoverQuantity(requirements);
    CompulsoryLeave(requirements);

	RightCollection(requirements);
	Type(requirements);
	Right(requirements);
    Right_Renewal(requirements);
	Calendar(requirements);
	CalendarEvent(requirements);
    Beneficiary(requirements);
    Adjustment(requirements);
    Message(requirements);
	Invitation(requirements);
	UserRenewalStat(requirements);
    Lunch(requirements);
    Overtime(requirements);

	if (!requirements.autoIndex) {
		// Nothing to index
		return Promise.resolve([]);
	}

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
					return reject(new Error('on index '+requirements.db.name+'.'+name+' model -> '+err.message));
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
