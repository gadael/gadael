'use strict';

const SpecialRightIndex = require('./../api/specialrights/index');


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

        consuption: {                                            // consuption type
            type: String,
            enum:['proportion', 'businessDays', 'workingDays'],  // proportion: user the attendance percentage defined in user right collection
                                                                 // businessDays: next business days are consumed up to consuptionBusinessDaysLimit
            default: 'proportion'                                // workingDays: full working days are consumed
        },

        consuptionBusinessDaysLimit: { type: Number, default: 5 }, // Used if consuption=businessDays

        // automatic distribution on this right on request creation
        autoDistribution: { type: Boolean, default:true },

        quantity: { type: Number, min:0 },                          // initial quantity for each renewal
                                                                    // this can be overwritten by special quantity from a custom rule (ex: RTT)

        quantity_unit: { type: String, enum:['D', 'H'], required: true },   // Days our Hours

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

        // activeSpan.min minimal number of days between entry date and request start date
        // this is the time given to the approvers
        // activeSpan.max maximal number of days between entry date and request end date
        // by default, the parameter is set globally
        activeSpan: {
            useDefault: { type: Boolean, default:true },
            min: Number,
            max: Number
        },

        rules: [params.embeddedSchemas.RightRule]
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


        let absences = AbsenceElem.count()
        .where('right.id', right._id)
        .exec();

        let tsdOrWorkRecover = Request.count({ $and: [
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

        this.getAllRenewals().then(function(arr) {

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
     * create a renewal for a recover request
     * @param {Object} recover  the workperiod_recover property of a Request document
     * @return {Promise}
     */
    rightSchema.methods.createRecoveryRenewal = function createRecoveryRenewal(recover) {
        var r = recover.renewal;
        return this.createRenewal(r.start, r.finish);
    };


    /**
     * Link the right to one user, use a beneficary document with a user ref instead of a right collection
     * @param {User} user
     * @return {Promise}
     */
    rightSchema.methods.addUserBeneficiary = function addUserBeneficiary(user) {
        var model = this.model('Beneficiary');
        var beneficiary = new model();
        beneficiary.right = this._id;
        beneficiary.document = user._id;
        beneficiary.ref = 'User';

        return beneficiary.save();
    };


    /**
     * Get special right object or null
     *
     * @return {SpecialRight}
     */
    rightSchema.methods.getSpecialRight = function() {

        let index = new SpecialRightIndex(params.app);
        let list = index.objects;



        if (undefined === list[this.special]) {
            return null;
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
    rightSchema.methods.getInitialQuantityInPeriod = function(user, dtstart, dtend) {

        return this.getRenewalsQuery()
        .where({
            start: { $gte: dtstart, $lt: dtend }
        })
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
                // no renewals found in period
                return 0;
            }

            return all.reduce((sum, initialQuantity) => {
                return sum + initialQuantity;
            });
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
     * @param {Date} moment
     * @returns {Promise}
     */
    rightSchema.methods.getMomentRenewal = function(moment) {
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
     * @return {boolean}
     */
    rightSchema.methods.validateRules = function(renewal, user, dtstart, dtend, timeCreated) {

        if (undefined === timeCreated) {
            timeCreated = new Date();
        }

        for(var i=0; i<this.rules.length; i++) {
            if (!this.rules[i].validateRule(renewal, user, dtstart, dtend, timeCreated)) {
                return false;
            }
        }

        return true;
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

        return new Promise((resolve, reject) => {
            if ('proportion' === right.consuption) {
                // consume more than duration quantity if attendance percentage lower than 100
                return resolve(right.getConsumedQuantityByAttendance(collection.attendance, elem.quantity));
            }

            if ('businessDays' === right.consuption) {
                // consume number of business days up to back to work date
                return resolve(right.getConsumedQuantityByBusinessDays(collection, elem));
            }

            if ('workingDays' === right.consuption) {
                // consume exact number of working days (no half-days)
                return resolve(elem.getWorkingDays());
            }
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
         * @returns {object}
         */
        function getData() {

            if (undefined === company.country || null === company.country) {
                return null;
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
            let beneficiaryModel = right.model('Beneficiary');

            function link(id) {
                let beneficiary = new beneficiaryModel();

                beneficiary.right = right._id;
                beneficiary.ref = 'RightCollection';
                beneficiary.document = id;
                return beneficiary.save();
            }


            if (undefined !== collectionId) {
                return link(collectionId);
            }

            return CollectionModel.find({})
            .exec()
            .then(all => {
                return Promise.all(all.map(collection => {
                    return link(collection._id);
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

                let now = new Date();
                period.start = new Date();
                period.start.setHours(0,0,0,0);


                period.start.setMonth(rightData.renewal.start.month, rightData.renewal.start.day);

                if (period.start > now) {
                    period.start.setFullYear(period.start.getFullYear()-1);
                }



                period.finish = new Date(period.start);
                period.finish.setFullYear(period.finish.getFullYear()+1);
                period.finish.setDate(period.finish.getDate()-1);
                period.finish.setHours(23,59,59,999);

                return period;
            }

            return new Promise((resolve, reject) => {

                let right = new model();

                if (undefined !== rightData._id) {
                    right._id = rightData._id;
                }

                right.special = rightData.special;
                right.name = rightData.name;
                right.quantity_unit = rightData.quantity_unit || 'D';
                right.quantity = rightData.quantity;
                right.type = rightData.type;
                right.rules = rightData.rules;

                right.save().then(right => {

                    let promises = [];
                    promises.push(linkToCollection(right, rightData.collection));

                    // create renewal

                    let period = getRenewal();
                    if (null !== period) {
                        let renewalModel = right.model('RightRenewal');
                        let renewal = new renewalModel();

                        renewal.right = right._id;
                        renewal.set(period);
                        promises.push(renewal.save());
                    }

                    resolve(Promise.all(promises));
                });

            });
        }





        /**
         * initialize default rights on database creation
         * @param {function} done   Callback
         */
        function createDefaults(done) {

            let promises = [];

            let data = getData();
            if (null === data) {
                return done();
            }

            data.rights.forEach(rightData => {
                promises.push(saveRight(rightData));
            });

            Promise.all(promises)
                .then(() => { done(); })
                .catch(done);
        }

        return createDefaults;
    };



	params.db.model('Right', rightSchema);
};
