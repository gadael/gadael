'use strict';

const SpecialRightIndex = require('../api/specialrights/index');


exports = module.exports = function(params) {

    const dispunits = params.app.utility.dispunits;
    const mongoose = params.mongoose;

	let rightSchema = new params.mongoose.Schema({
		name: { type: String, unique: true, required: true },
        description: String,
		timeCreated: { type: Date, default: Date.now },
        type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
        require_approval: { type: Boolean, default:true },
        sortkey: Number,

        special: { type: String },                               // quantity evaluation rule used instead of the default quantity
                                                                 // name will be readonly
                                                                 // special rights are stored in api/specialrights/*
                                                                 // proposed special rights will be filtered by company.country

        consumption: {                                           // consumption type
            type: String,
            enum:[
                'proportion',                                    // proportion: user the attendance percentage defined in user right collection
                'businessDays',                                  // businessDays: next business days are consumed up to consumptionBusinessDaysLimit
                'workingDays',                                   // workingDays: full working days are consumed
                'duration',                                      // duration: consumption equal worked duration
                'length'                                         // length: number of days or between the two dates (not usefull for hours)
            ],
            default: 'proportion'
        },

        consumptionBusinessDaysLimit: { type: Number, default: 5 }, // Used if consumption=businessDays

        // automatic distribution on this right on request creation
        autoDistribution: { type: Boolean, default:true },

        quantity: Number,                                           // initial quantity for each renewal
                                                                    // this can be overwritten by special quantity from a custom rule (ex: RTT)
                                                                    // This can be null for infinite quantity (sickness leave)

        quantity_unit: { type: String, enum:['D', 'H'], required: true },   // Days our Hours

        halfDays: { type: Boolean, default:true },                  // if quantiy_unit === 'D'

        defaultAbsenceLength: Number,                               // defaut duration of the absence period
                                                                    // this is used for a meternity leave for example

        /**
         * Add "quantity" every first day of month
         * on each modification of the right, an array of rightAdjustments will be created in renewal
         * from the current date to once the "max" quantity is reached or to the renewal date
         * The adjustments array should be updated if new renewal is added or removed or if the right
         * is modified but only for futur adjustments
         */
        addMonthly: {
            quantity: { type: Number, min:0 },
            max: { type: Number, min:0 }
        },

        /**
         * Auto create adjustements
         * Create one adjustement of "quantity" for every "step" of consumed quantity in the types "types"
         * list of adjustements will be computed on each modification of consumed quantity for each beneficiary of this right.
         */
        autoAdjustment: {
            types: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Type' }],
            quantity: Number,
            step: Number
        },

        timeSaving: {
            active: { type: Boolean, default: false },              // The right quantity can be saved to CET or not
            max: { type: Number, min:1 }                            // max saveable quantity from renewal
        },

        timeSavingAccount: {                                        // used only if special==='timesavingaccount'
            max: { type: Number, min:1 },                           // max saveable quantity into renewal
            savingInterval: {
                useDefault: { type: Boolean, default: true },       // default saving interval is the renewal period
                min: Number,                                        // years before renewal start date
                max: Number                                         // years before renewal end date
            }
        },

        activeFor: {
            account: { type: Boolean, default:true },

            // manager substituting one of his subordinate
            manager: { type: Boolean, default:true },

            // admin substituting one of the user with vacation account
            admin: { type: Boolean, default:true }
        },

        // Hide the right in user list,
        // but can be visible in step 2 when creating a request if active for account
        hide: Boolean,

        // activeSpan.min minimal number of days between entry date and request start date
        // this is the time given to the approvers
        // activeSpan.max maximal number of days between entry date and request end date
        // by default, the parameter is set globally
        activeSpan: {
            useDefault: { type: Boolean, default:true },
            min: Number,
            max: Number
        },

        rules: [params.embeddedSchemas.RightRule],

        // Count lunch on absence event if linked to this right, ex on a traineeship
        lunch: { type: Boolean, default: false }
	});


    rightSchema.index({ 'name': 1 }, { unique: true });
	rightSchema.set('autoIndex', params.autoIndex);


    /**
     * Pre save hook
     */
    rightSchema.pre('save', function(next) {
        // set monthly adjustments from today
        this.updateAdjustments(next);

    });


    /**
     * Pre remove hook
     */
    rightSchema.pre('remove', function(next) {
        let right = this;

        let promises = [];

        promises.push(right.removeRenewals());
        promises.push(right.removeBeneficiaries());

        Promise.all(promises).then(() => {
            next();
        }).catch(next);
    });



    /**
     * delete all renewals linked to this right
     * remove on model have no query hook so it not used here because we may have to chain multiple pre remove middlewares
     * @return {Promise}
     */
    rightSchema.methods.removeRenewals = function() {

        let right = this;

        let RightRenewal = right.model('RightRenewal');

        return RightRenewal.find()
        .where('right', right._id)
        .exec()
        .then(renewals => {
            let removePromises = [];

            renewals.forEach(renewal => {
                removePromises.push(renewal.remove());
            });

            return Promise.all(removePromises);
        });
    };

    /**
     * Delete all beneficiaries linked to this right
     * @return {Promise}
     */
    rightSchema.methods.removeBeneficiaries = function() {
        let Beneficiary = this.model('Beneficiary');

        return Beneficiary.find()
        .where('right', this._id)
        .exec()
        .then(beneficiaries => {
            let removePromises = [];

            beneficiaries.forEach(b => {
                removePromises.push(b.remove());
            });

            return Promise.all(removePromises);
        });
    };


    /**
     * Get all users linked to this right with the beneficiary period
     * resolve to array with objects :
     *  -user           User document
     *  -beneficiary
     *
     * @param {Date}    moment  Optional date for collection association to users
     *
     * @return {Promise}
     */
    rightSchema.methods.getBeneficiaryUsers = function(moment) {
        let Beneficiary = this.model('Beneficiary');

        return Beneficiary.find()
        .where('right', this._id)
        .exec()
        .then(beneficiaries => {
            let promises = beneficiaries.map(b => {
                return b.getUsers(moment);
            });

            return Promise.all(promises)
            .then(all => {

                let list = [];

                function push(user) {
                    list.push({
                        user: user,
                        beneficiary: this
                    });
                }

                for (let i=0; i<all.length; i++) {
                    let beneficiary = beneficiaries[i];
                    let users       = all[i];

                    users.forEach(push.bind(beneficiary));
                }

                return list;
            });
        });
    };


    /**
     * Check if the right is a time saving account
     * @returns {boolean}
     */
    rightSchema.methods.isTimeSavingAccount = function() {
        return ('timesavingaccount' === this.special);
    };


    /**
     * Count uses in requests
     * @return {Promise} Resolve to a number
     */
    rightSchema.methods.countUses = function() {

        let right = this;

        let AbsenceElem = this.model('AbsenceElem');
        let Request = this.model('Request');


        let absences = AbsenceElem.countDocuments()
        .where('right.id', right._id)
        .exec();

        let tsdOrWorkRecover = Request.countDocuments({ $and: [
            { 'status.deleted' : { $ne: 'accepted' } },
            { $or:
                 [
                     { 'time_saving_deposit.from.right': right._id },
                     { 'time_saving_deposit.to.right': right._id },
                     { 'workperiod_recover.right.id': right._id }
                 ]
            }
        ]})
        .exec();

        return Promise.all([absences, tsdOrWorkRecover])
        .then(all => {
            return (all[0] + all[1]);
        });
    };


    /**
     * update monthly adjustments
     */
    rightSchema.methods.updateAdjustments = function(next) {

        let right = this;
        let async = require('async');

        this.getAllRenewals()
        .then(function(arr) {

            let rightRenewalSchema = params.db.models.RightRenewal;

            async.each(arr,function(renewal, renewalDone) {

                renewal.removeFutureRightAdjustments();
                if (renewal.createRightAdjustments(right)) {

                    // do not call pre save hook on renewal
                    rightRenewalSchema
                        .findByIdAndUpdate(renewal._id, { $set: { adjustments: renewal.adjustments }})
                        .exec(renewalDone);
                } else {
                    renewalDone();
                }
            }, next);
        });
    };


    /**
     * Get max value or infinity if not set
     * @return {Number}
     */
    rightSchema.methods.getMonthlyMaxQuantity = function() {
        var max = Infinity;

        if (undefined !== this.addMonthly.max && 0 !== this.addMonthly.max) {
            max = this.addMonthly.max;
        }

        return max;
    };







    /**
     * Create renewal
     * @return {Promise}
     */
    rightSchema.methods.createRenewal = function createRenewal(start, finish) {
        var model = this.model('RightRenewal');

        var rightRenewal = new model();

        rightRenewal.right = this._id;
        rightRenewal.start = start;
        rightRenewal.finish = finish;

        return rightRenewal.save();
    };

    /**
     * create a renewal for overtime conversion
     * @param {Object} params  Renewal parameters
     * @return {Promise}
     */
    rightSchema.methods.createOvertimeConversionRenewal = function createOvertimeConversionRenewal(params) {
        if (!params.start) {
            params.start = new Date();
        }

        if (!params.finish) {
            params.finish = new Date(params.start);
            params.finish.setFullYear(params.finish.getFullYear() + 1);
        }

        // round to full days
        params.start.setHours(0,0,0,0);
        params.finish.setHours(23,59,59,999);
        return this.createRenewal(params.start, params.finish);
    };

    /**
     * create a renewal for a recover request
     * start on the date of the recovery period end end one year later
     *
     * @param {Object} request  Request document
     * @return {Promise}
     */
    rightSchema.methods.createRecoveryRenewal = function createRecoveryRenewal(request) {
        if (0 === request.events.length) {
            throw new Error('No events on the recovery request');
        }

        if (undefined === request.events[0].dtstart) {
            throw new Error('events must be populated on request');
        }

        return this.createOvertimeConversionRenewal(request.workperiod_recover[0].right.renewal);
    };



    rightSchema.methods.getBeneficiaryRef = function() {
        let Beneficiary = this.model('Beneficiary');

        return Beneficiary.findOne()
        .where('right', this._id)
        .exec()
        .then(b => {
            if (null === b) {
                return undefined;
            }
            return b.ref;
        });
    };


    /**
     * Check if the right can be linked to a collection
     * the methods verify that no user is linked to the right
     * @return {Promise}
     */
    rightSchema.methods.canLinkToCollection = function() {
        let model = this.model('Beneficiary');

        return model.find()
        .where('right', this._id)
        .where('ref', 'User')
        .exec()
        .then(arr => {
            if (arr.length > 0) {
                throw new Error('The right is linked to one or more users, linking to a collection is only allowed if there is no users linked to the right');
            }

            return true;
        });
    };


    /**
     * Check if the right can be linked to a user
     * the methods verify that no colletion is linked to the right
     * @return {Promise}
     */
    rightSchema.methods.canLinkToUser = function() {
        let model = this.model('Beneficiary');

        return model.find()
        .where('right', this._id)
        .where('ref', 'RightCollection')
        .exec()
        .then(arr => {
            if (arr.length > 0) {
                throw new Error('The right is linked to one or more collections, please link the user to a collection, direct link to a right is only allowed on orphan rights');
            }

            return true;
        });
    };


    /**
     * Link the right to a collection
     * The right must not be linked to a user
     *
     * @param {RightCollection|ObjectId} collection
     * @return {Promise}
     */
    rightSchema.methods.addCollectionBeneficiary = function addCollectionBeneficiary(collection) {
        let model = this.model('Beneficiary');

        let id = collection;
        if (undefined !== collection._id) {
            id = collection._id;
        }

        return this.canLinkToCollection()
        .then(() => {
            let beneficiary = new model();
            beneficiary.right = this._id;
            beneficiary.document = id;
            beneficiary.ref = 'RightCollection';

            return beneficiary.save();
        });
    };


    /**
     * Link the right to one user, use a beneficary document with a user ref instead of a right collection
     * The right must not be linked to a collection
     *
     * @param {User|ObjectId|string} user
     * @return {Promise}
     */
    rightSchema.methods.addUserBeneficiary = function addUserBeneficiary(user) {
        let model = this.model('Beneficiary');

        let id = user;
        if (undefined !== user._id) {
            id = user._id;
        }

        return this.canLinkToUser()
        .then(() => {
            let beneficiary = new model();
            beneficiary.right = this._id;
            beneficiary.document = id;
            beneficiary.ref = 'User';

            return beneficiary.save();
        });
    };


    /**
     * Get special right object or null
     *
     * @return {SpecialRight}
     */
    rightSchema.methods.getSpecialRight = function() {

        let index = new SpecialRightIndex(params.app);
        let list = index.objects;
        let right = this;

        if (null === right.special || undefined === right.special) {
            return null;
        }

        if (undefined === list[right.special]) {
            throw new Error('Undefined special right object '+right.special);
        }


        let SpecialRight = list[this.special];

        return new SpecialRight(params.app);
    };


    /**
     * Find right renewals
     * @returns {Query} A mongoose query on the right renewal schema
     */
    rightSchema.methods.getRenewalsQuery = function() {
        return this.model('RightRenewal')
            .find()
            .where('right').equals(this._id);
    };


    /**
     * Get all renewals
     * @return {Promise} mongoose
     */
    rightSchema.methods.getAllRenewals = function() {
        return this.getRenewalsQuery().exec();
    };


    /**
     * Get renewal using a id, but verifiy that the renewal is linked to the right
     * @param   {String} id
     * @returns {Promise}
     */
    rightSchema.methods.getRenewal = function(id) {
        return this.getRenewalsQuery()
        .where('_id').equals(id)
        .exec()
        .then(arr => {
            if (!arr || 0 === arr.length) {
                return null;
            }

            return arr[0];
        });
    };


    /**
     * Get renewal by date interval or null if no renewal
     * requests straddling two periods are not allowed
     *
     * @param {Date} dtstart
     * @param {Date} dtend
     * @returns {Promise}
     */
    rightSchema.methods.getPeriodRenewal = function(dtstart, dtend) {

        return this.getRenewalsQuery()
        .where('start').lte(dtstart)
        .where('finish').gte(dtend)
        .exec()
        .then(arr => {

            if (!arr || 0 === arr.length) {
                return null;
            }

            return arr[0];
        });
    };


    /**
     * Get renewal With same date interval
     *
     * @param {Date} dtstart
     * @param {Date} dtend
     * @returns {Promise}
     */
    rightSchema.methods.getSameRenewal = function(dtstart, dtend) {

        return this.getRenewalsQuery()
        .where('start', dtstart)
        .where('finish', dtend)
        .exec()
        .then(arr => {

            if (!arr || 0 === arr.length) {
                return null;
            }

            return arr[0];
        });
    };


    /**
     * Get the quantity added on initial quantity between two dates
     * this include initial quantity of the right and monthly updates
     *
     * @param {User} user
     * @param {Date} dtstart
     * @param {Date} dtend
     *
     * @returns {Promise}
     */
    rightSchema.methods.getInitialQuantityInPeriod = function(user, dtstart, dtend, field) {

        let right = this;

        if (null === right.quantity) {
            return Promise.resolve(Infinity);
        }

        if (undefined === field) {
            // Will take first the renewal overlapping the start date
            field = 'start';
        }

        let criterion = {};
        criterion[field] = { $gte: dtstart, $lt: dtend };


        return this.getRenewalsQuery()
        .where(criterion)
        .exec()
        .then(arr => {

            let promises = [];

            arr.forEach(renewal => {

                // on each renewal, get the max initial quantity in period
                promises.push(renewal.getUserQuantity(user, dtend));
            });

            return Promise.all(promises);
        })
        .then(all => {

            if (0 === all.length) {

                if ('finish' === field) {
                    return 0;
                }

                // no renewals found in period
                // retry with renewal end date as a second option
                return right.getInitialQuantityInPeriod(user, dtstart, dtend, 'finish');
            }

            return all.reduce((sum, initialQuantity) => {
                return sum + initialQuantity.value;
            }, 0);
        });
    };



    /**
     * Get current renewal or null if no renewal
     * @returns {Promise}
     */
    rightSchema.methods.getCurrentRenewal = function() {
        return this.getPeriodRenewal(new Date(), new Date());
    };

    /**
     * Get renewal on date or null if no renewal
     * @param {Date} moment     Optional date
     * @returns {Promise}
     */
    rightSchema.methods.getMomentRenewal = function(moment) {

        if (!moment) {
            moment = new Date();
        }

        return this.getPeriodRenewal(moment, moment);
    };


    /**
     * Get last renewal
     * @returns {Promise}
     */
    rightSchema.methods.getLastRenewal = function() {

        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        this.getRenewalsQuery()
            .limit(1)
            .sort('-start')
            .exec(function(err, arr) {

                if (err) {
                    deferred.reject(err);
                    return;
                }

                if (!arr || 0 === arr.length) {
                    deferred.resolve(null);
                    return;
                }

                deferred.resolve(arr[0]);
            });

        return deferred.promise;
    };


    rightSchema.methods.getDispUnit = function(quantity) {

        return dispunits(this.quantity_unit, quantity);
    };


    /**
     * Validate right rules
     * return false if one of the rules is not appliquable (ex: for request date when the request does not exists)
     *
     * @param {RightRenewal} renewal        Right renewal
     * @param {User}         user           Request appliquant
     * @param {Date}         dtstart        Request start date
     * @param {Date}         dtend          Request end date
     * @param {Date}         [timeCreated]  Request creation date
     *
     * @return {Promise}        Resolve to true or RightRule
     */
    rightSchema.methods.validateRules = function(renewal, user, dtstart, dtend, timeCreated) {

        if (undefined === timeCreated) {
            timeCreated = new Date();
        }

        let promises = this.rules.map(rule => {
            return rule.validateRule(renewal, user, dtstart, dtend, timeCreated);
        });

        return Promise.all(promises)
        .then(all => {
            for(let i=0; i<all.length; i++) {
                if (!all[i]) {
                    return this.rules[i];
                }
            }

            return true;
        });

    };



    /**
     * Get the consumed quantity proportionally to attendance
     * @param   {Number} attendance Attendance percentage
     * @param   {Number} quantity   Period duration quantity
     * @returns {Number}
     */
    rightSchema.methods.getConsumedQuantityByAttendance = function(attendance, quantity) {

        if (100 === attendance || undefined === attendance) {
            return quantity;
        }

        // 50% -> x2
        // 75% -> x1.333
        // 25% -> x4
        // 100% -> x1

        const m = 100*(1/attendance);
        return (m*quantity);
    };



    /**
     * Count the number of business days up to the back to work date
     * @throws {Error} Right must be in days
     *
     * @param {RightCollection} collection collection associated to the request appliquant
     *                                     must be the collection in effect on the absence element period
     * @param {AbsenceElem}     elem       Absence element
     *
     * @returns {Promise}
     */
    rightSchema.methods.getConsumedQuantityByBusinessDays = function(collection, elem) {

        let right = this;

        if ('D' !== right.quantity_unit) {
            throw new Error('Consuption by business days must be used on a right with days as quantity unit');
        }

        let businessDays = collection.getDays();

        let count = 0;

        return new Promise((resolve, reject) => {

            elem.getBackDate().then(backDate => {

                let loop = new Date(elem.events[0].dtstart);
                loop.setHours(0,0,0,0);


                while(loop < backDate) {

                    if (-1 !== businessDays.indexOf(loop.getDay())) {
                        count++;
                    }

                    loop.setDate(loop.getDate()+1);
                }

                if (count <= 0) {
                    return reject('getConsumedQuantityByBusinessDays failed to get the consumption');
                }

                resolve(count);
            }).catch(reject);
        });
    };







    /**
     * Get the consumed quantity on right from the duration quantity in an absence element
     *
     * @param {RightCollection} collection collection associated to the request appliquant
     *                                     must be the collection in effect on the absence element period
     * @param {AbsenceElem}     elem       Absence element
     *
     * @return {Promise}
     */
    rightSchema.methods.getConsumedQuantity = function(collection, elem) {

        let right = this;


        if ('proportion' === right.consumption) {
            // consume more than duration quantity if attendance percentage lower than 100
            return Promise.resolve(right.getConsumedQuantityByAttendance(collection.attendance, elem.quantity));
        }

        if ('businessDays' === right.consumption) {
            // consume number of business days up to back to work date
            return right.getConsumedQuantityByBusinessDays(collection, elem);
        }

        if ('workingDays' === right.consumption) {
            // consume exact number of working days (no half-days)
            return elem.getWorkingDays();
        }

        if ('duration' === right.consumption) {
            // consume duration
            return Promise.resolve(elem.quantity);
        }

        if ('length' === right.consumption) {
            return elem.getLength();
        }

        return Promise.reject('Unexpected consumption type '+right.consumption);
    };



    /**
     * get type promise
     *
     *
     * @return {Promise}
     */
    rightSchema.methods.getType = function() {

        let right = this;

        return right.populate('type')
        .execPopulate()
		.then(populatedRight => {
            return populatedRight.type;
        });

    };

    /**
     * Update user stat linked to the current renewal
     * @return {Promise}
     */
    rightSchema.methods.updateUsersStat = function() {
        let right = this;

        return right.getMomentRenewal()
        .then(renewal => {

            if (null === renewal) {
                return;
            }

            // ignore error on renewal
            // a simple catch does not work here
            return new Promise(resolve => {
                renewal.updateUsersStat()
                .catch(resolve)
                .then(resolve);
            });

        });
    };


    /**
     * Get a task to initialize rights when the database is created
     * @param   {Company}  company Company document not yet saved
     * @returns {Function} async task function for parallels initialization of tables
     */
    rightSchema.statics.getInitTask = function(company) {

        let model = this;


        /**
         * get rights data
         * warning, security risk, company.country must be clean
         * If no country set on company, the default.js file is used
         *
         * @returns {object}
         */
        function getData() {

            if (undefined === company.country || null === company.country) {
                try {
                    return require('./data/default')(params.app);

                } catch(e) {
                    return null;
                }
            }

            if (!company.country.match(/^[A-Z]{2}$/)) {
                return null;
            }

            try {
                return require('./data/'+company.country.toLowerCase())(params.app);

            } catch(e) {
                return null;
            }
        }



        /**
         * Link to specified collectionId or all existing collections if not set
         * @param {Right} right
         * @param {String} collectionId
         * @return {Promise}
         */
        function linkToCollection(right, collectionId) {

            let CollectionModel = right.model('RightCollection');


            if (undefined !== collectionId) {
                return right.addCollectionBeneficiary(collectionId);
            }

            return CollectionModel.find({})
            .exec()
            .then(all => {
                return Promise.all(all.map(collection => {
                    return right.addCollectionBeneficiary(collection);
                }));
            });
        }





        /**
         * Save one right, add one renewal, add right in a collection
         * @return {Promise}
         */
        function saveRight(rightData) {

            function getRenewal() {

                if (undefined === rightData.renewal) {
                    return null;
                }

                let period = {};

                // company.timeCreated can be set to another date for tests
                // or screenshots generation
                let now = new Date(company.timeCreated);
                period.start = new Date(company.timeCreated);
                period.start.setHours(0,0,0,0);


                period.start.setMonth(rightData.renewal.start.month, rightData.renewal.start.day);

                if (period.start > now) {
                    period.start.setFullYear(period.start.getFullYear()-1);
                }

                let nbYears = 1;
                if (undefined !== rightData.renewal && undefined !== rightData.renewal.nbYears) {
                    nbYears = rightData.renewal.nbYears;
                }

                period.finish = new Date(period.start);
                period.finish.setFullYear(period.finish.getFullYear() + nbYears);
                period.finish.setDate(period.finish.getDate()-1);
                period.finish.setHours(23,59,59,999);

                return period;
            }



            const right = new model();

            if (undefined !== rightData._id) {
                right._id = rightData._id;
            }

            right.special = rightData.special;
            right.name = rightData.name;
            right.quantity_unit = rightData.quantity_unit || 'D';
            right.quantity = rightData.quantity;
            right.defaultAbsenceLength = rightData.defaultAbsenceLength;
            right.type = rightData.type;
            right.rules = rightData.rules;

            return right.save()
            .then(right => {

                let promises = [];
                if (rightData.defaultAbsenceLength === undefined) {
                    promises.push(linkToCollection(right, rightData.collection));
                }

                // create renewal

                let period = getRenewal();
                if (null !== period) {

                    let renewalModel = right.model('RightRenewal');
                    let renewal = new renewalModel();

                    renewal.right = right._id;
                    renewal.set(period);
                    promises.push(renewal.save());
                }

                return Promise.all(promises);
            });
        }





        /**
         * initialize default rights on database creation
         * @return {Promise}
         */
        function createDefaults() {

            let data = getData();
            if (null === data) {
                return Promise.resolve([]);
            }

            return Promise.all(
                data.rights.map(rightData => {
                    return saveRight(rightData);
                })
            );
        }

        return createDefaults;
    };



	params.db.model('Right', rightSchema);
};
