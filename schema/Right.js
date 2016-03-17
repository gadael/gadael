'use strict';

exports = module.exports = function(params) {
    
    var mongoose = params.mongoose;
    
	var rightSchema = new params.mongoose.Schema({
		name: { type: String, unique: true, required: true },
        description: String,
		timeCreated: { type: Date, default: Date.now },
        type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
        require_approval: { type: Boolean, default:true },
        sortkey: Number,
        
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

        var right = this;
        var async = require('async');

        this.getAllRenewals().then(function(arr) {

            var rightRenewalSchema = params.db.models.RightRenewal;

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
    
	
	params.db.model('Right', rightSchema);
};





