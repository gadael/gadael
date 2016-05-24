'use strict';

const gt = require('./../modules/gettext');

exports = module.exports = function(params) {
    
    let mongoose = params.mongoose;
    
	let rightSchema = new params.mongoose.Schema({
		name: { type: String, unique: true, required: true },
        description: String,
		timeCreated: { type: Date, default: Date.now },
        type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
        require_approval: { type: Boolean, default:true },
        sortkey: Number,
        
        consuption: {                             // consuption type
            type: String,
            enum:['proportion', 'businessDays', 'workingDays'],  // proportion: user the attendance percentage defined in user right collection
            required: true,                                      // businessDays: next business days are consumed up to consuptionBusinessDaysLimit
            default: 'proportion'                                // workingDays: full working days are consumed
        },

        consuptionBusinessDaysLimit: { type: Number, default: 5 }, // Used if consuption=businessDays

        // automatic distribution on this right on request creation
        autoDistribution: { type: Boolean, default:true },
        
        quantity: { type: Number, min:0, required: true },
        quantity_unit: { type: String, enum:['D', 'H'], required: true },
        
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
        
        timeSaving: {
            active: { type: Boolean, default: false },
            max: { type: Number, min:1 },          // max quantity per renewal
            savingInterval: {
                useDefault: { type: Boolean, default:true },
                min: Number, // years before renewal start date
                max: Number  // years before renewal end date
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

    
    rightSchema.pre('save', function(next) {
        // set monthly adjustments from today
        this.updateAdjustments(next);

    });


    /**
     * update monthly adjustments
     */
    rightSchema.methods.updateAdjustments = function(next) {

        let right = this;
        let async = require('async');

        this.getAllRenewals().then(function(arr) {

            let rightRenewalSchema = params.db.models.RightRenewal;

            async.each(arr,function(renewal, renewalDone) {

                renewal.removeFutureAdjustments();
                if (renewal.createAdjustments(right)) {

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
     * Get renewal by date interval or null if no renewal
     * requests straddling two periods are not allowed
     *
     * @param {Date} dtstart
     * @param {Date} dtend
     * @returns {Promise}
     */
    rightSchema.methods.getPeriodRenewal = function(dtstart, dtend) {
        
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        

        this.getRenewalsQuery()
            .where('start').lte(dtstart)
            .where('finish').gte(dtend)
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
        
        return require('../modules/dispunits')(this.quantity_unit, quantity);
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

                return require('./data/'+company.country.toLowerCase());

            } catch(e) {
                return null;
            }
        }


        /**
         * [[Description]]
         * @returns {Number} In days
         *//*
        function getPaidLeaveQuantity() {
            switch(company.country) {
                case 'FR':
                case 'AT': // Autriche
                case 'BO': // Bolivie
                case 'GR': // Grece
                case 'SE': // Suede
                case 'FI': // Finlande
                case 'LU': // Luxembourg
                    return 25;

                case 'UK':
                    return 28;

                case 'VE': // Venezuela
                case 'MT': // Malte
                    return 24;

                case 'HU': // Hongrie
                    return 23;

                case 'ES': // Espagne
                case 'PT': // Portugal
                case 'PE': // Perou
                case 'BR': // Bresil
                    return 22;

                case 'NO': // Norvege
                    return 21;

                case 'CY': // Chypre
                case 'JP': // Japon
                case 'PL': // Pologne
                case 'HR': // Croatie
                case 'AR': // Argentine
                case 'IT': // Italie
                case 'AU': // Australie
                case 'BE': // Belgique
                    return 20;

            }

            return 20;
        }
        */



        /**
         * Save one right, add one renewal, add right in a collection
         * @return {Promise}
         */
        function saveRight(rightData) {

            let now = new Date();
            let start = new Date();
            start.setHours(0,0,0,0);

            start.setMonth(rightData.renewal.month);
            start.setDate(rightData.renewal.day);

            if (start > now) {
                start.setFullYear(start.getFullYear()-1);
            }

            let finish = new Date(start);
            finish.setFullYear(finish.getFullYear()+1);
            finish.setDate(finish.getDate()-1);


            return new Promise((resolve, reject) => {

                let right = new model();

                right.name = rightData.name || gt.gettext('Paid annual leave');
                right.quantity_unit = rightData.quantity_unit || 'D';
                right.quantity = rightData.quantity || 20;
                right.type = rightData.type || '5740adf51cf1a569643cc508';
                right.rules = rightData.rules;

                right.save().then(right => {

                    // put right in collection

                    let beneficiaryModel = right.model('Beneficiary');
                    let beneficiary = new beneficiaryModel();

                    beneficiary.right = right._id;
                    beneficiary.ref = 'RightCollection';
                    beneficiary.document = rightData.collection || '5740adf51cf1a569643cc520';


                    // create renewal
                    let renewalModel = right.model('RightRenewal');
                    let renewal = new renewalModel();

                    renewal.right = right._id;
                    renewal.start = start;
                    renewal.finish = finish;

                    resolve(
                        Promise.all([
                            beneficiary.save(),
                            renewal.save()
                        ])
                    );
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





