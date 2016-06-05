'use strict';


exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;

	var rightRenewalSchema = new mongoose.Schema({
        
        right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true },
        timeCreated: { type: Date, default: Date.now },
        lastUpdate: { type: Date, default: Date.now },
        start: { type: Date, required: true },
        finish: { type: Date, required: true },

        adjustments: [params.embeddedSchemas.RightAdjustment]
	});
  
	rightRenewalSchema.set('autoIndex', params.autoIndex);
  
	
    
    /**
     * Ensure that the renewal interval do not overlap another renewal period
     */
    rightRenewalSchema.pre('save', function(next) {
		
		var renewal = this;

        renewal.checkOverlap()
            .then(function() {
                return renewal.updateMonthlyAdjustment.call(renewal);
            })
            .catch(next)
            .then(next);
	});



    /**
     * @return {Promise}
     */
    rightRenewalSchema.methods.checkOverlap = function()
    {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        var model = params.db.models.RightRenewal;

        model.find({ right: this.right })
            .where('start').lt(this.finish)
            .where('finish').gt(this.start)
            .where('_id').ne(this._id)
            .count(function(err, renewals) {
                if (err) {
                    return deferred.reject(err);
                }

                if (renewals > 0) {
                    return deferred.reject(new Error('The renewals periods must not overlap'));
                }

                deferred.resolve(true);
            }
        );
        
        return deferred.promise;
    };
    
    
    /**
     * The last renewal end date
     * @return {Promise}
     */
    rightRenewalSchema.methods.updateMonthlyAdjustment = function()
    {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        var renewal = this;

        renewal.getRightPromise().then(function(right) {

            renewal.removeFutureAdjustments();
            renewal.createAdjustments(right);
            deferred.resolve(true);
        }).catch(deferred.reject);

        return deferred.promise;
    };


    /**
     * remove future adjustments in the monthly adjustments
     */
    rightRenewalSchema.methods.removeFutureAdjustments = function() {

        if (undefined === this.adjustments) {
            return;
        }

        var now = new Date();

        for (var i = this.adjustments.length - 1; i >= 0; i--) {
            if (this.adjustments[i].from >= now) {
                this.adjustments.splice(i, 1);
            }
        }
    };


    /**
     * Create adjustments from the next month 1st day to the limit
     * @return {bool}
     */
    rightRenewalSchema.methods.createAdjustments = function(right) {

        var renewal = this;

        if (renewal.finish <= new Date()) {
            return false;
        }


        if (undefined === right.addMonthly.quantity || 0 === right.addMonthly.quantity || null === right.addMonthly.quantity) {
            // functionality has been disabled
            return false;
        }

        function getNextMonthStart(date)
        {
            date.setDate(1);
            date.setHours(0,0,0,0);
            date.setMonth(date.getMonth()+1);

            return date;
        }

        var max = right.getMonthlyMaxQuantity();
        var loop = getNextMonthStart(new Date());


        if (loop < renewal.start) {
            loop = getNextMonthStart(new Date(renewal.start));
        }


        // start at the begining of the next month



        var inserted = 0;

        while(loop <= renewal.finish && renewal.getMonthlyAdjustmentsQuantity(right) <= max) {
            renewal.adjustments.push({
                from: new Date(loop),
                quantity: right.addMonthly.quantity
            });

            loop.setMonth(loop.getMonth()+1);

            inserted++;
        }

        return (inserted > 0);

    };



    /**
     * get the quantity in the monthly adjustments list
     * cap quantity to max because past adjustments are never removed
     * but max can be modified afterward
     * @return {Number}
     */
    rightRenewalSchema.methods.getMonthlyAdjustmentsQuantity = function(right) {
        var quantity = 0;
        this.adjustments.forEach(function(adjustment) {
            quantity += adjustment.quantity;
        });

        if (quantity>right.getMonthlyMaxQuantity()) {
            quantity = right.getMonthlyMaxQuantity();
        }

        return quantity;
    };


    
    /**
     * Get a user adjustement quantity, can be a negative value
     * adjustments on renewal
     * 
     * @param {Document} user
     * 
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserAdjustmentQuantity = function(user) {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        var model = params.db.models.Adjustment;
        var renewal = this;

        model.find({ rightRenewal: renewal._id, user: user._id }, 'quantity', function (err, docs) {
            
            if (err) {
                deferred.reject(err);
            }
            
            var adjustments = 0;
            for(var i=0; i<docs.length; i++) {
                adjustments += docs[i].quantity;
            }
            
            deferred.resolve(adjustments);
        });
        
        return deferred.promise;
    };
    
    
    
    /**
     * Get the right linked to the renewal
     * return a promise and resolve to a Right document
     *
     * @return {Promise}
     */
    rightRenewalSchema.methods.getRightPromise = function() {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        var renewal = this;
        
        if (renewal.right && renewal.right._id) {
            // allready populated
            deferred.resolve(renewal.right);

        } else if (!renewal.right) {
            
            // No right, should not happen, a renewal must be linked to a right
            deferred.resolve(null);

        } else {
            
            renewal.populate('right', function(err, renewal) {
                if (err) {
                    return deferred.reject(err);
                }
                
                deferred.resolve(renewal.right);
            });   
        }
        
        return deferred.promise;
    };
    
    
    
    /**
     * Get a user initial quantity 
     * default right quantity + adjustments on renewal from the monthly updates + manual adjustments on renewal for the user
     * The default quantity from right is accessible only after the account arrival date
     * for renewals straddling the arrival date, the quantiy is computed using the percentage of account valid time
     *
     * @todo duplicated with accountRight object
     * 
     * @param {User} user
     * 
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserQuantity = function(user) {
        
        var renewal = this;
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        
        Promise.all([renewal.getRightPromise(), renewal.getUserAdjustmentQuantity(user)])
            .then(function(arr) {

                /**
                 * Default right quantity available for the renewal
                 * if the user account arrival date is > renewal.start
                 * a pro rata of the quantity is computed for the default quantity
                 * @var {Number}
                 */
                var rightQuantity = arr[0].quantity;

                /**
                 * Manual adjustment created by administrators on the account-right page
                 * @var {Number}
                 */
                var userAdjustment = arr[1];

                if (user.roles.account.arrival > renewal.finish) {
                    // this will not be used via the REST API because invalid renewal are disacarded before
                    return deferred.resolve(0);
                }


                if (user.roles.account.arrival > renewal.start) {
                    var renewalDuration = renewal.finish.getTime() - renewal.start.getTime();
                    var availableDuration = renewal.finish.getTime() - user.roles.account.arrival.getTime();

                    rightQuantity = Math.round(rightQuantity * availableDuration / renewalDuration);
                }

                /**
                 * If the right is configured with monthly quantity update,
                 * this variable will contain adjustments in renewal from the arrival date to the current date
                 * @var {Number}
                 */
                var renewalAdjustment = 0;
                var now = new Date();

                renewal.adjustments.forEach(function(adjustment) {
                    if (adjustment.from >= user.roles.account.arrival && adjustment.from <= now) {
                        renewalAdjustment += adjustment.quantity;
                    }
                });


                deferred.resolve(rightQuantity + renewalAdjustment + userAdjustment);
            })
            .catch(deferred.reject);
            
        return deferred.promise;
    };
    
    /**
     * Quantity moved to time saving accounts
     * sum of quantities in deposits for this renewal
     *
     * @param {User} user
     *
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserSavedQuantity = function(user) {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        var model = this.model('Request');
        model.find({
            'time_saving_deposit.from.renewal.id': this._id,
            'user.id': user._id
        }, 'time_saving_deposit.quantity', function (err, docs) {
            if (err) {
                deferred.reject(err);
            }

            var deposits = 0;
            for(var i=0; i<docs.length; i++) {
                deposits += docs[i].time_saving_deposit[0].quantity;
            }

            deferred.resolve(deposits);
        });

        return deferred.promise;
    };

    
    /**
     * Get a user consumed quantity 
     * sum of quantities in requests and saved from this renewal
     *
     * @todo duplicated with accountRight object
     * 
     * @param {User} user
     * 
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserConsumedQuantity = function(user) {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        var model = this.model('AbsenceElem');
        var renewal = this;
        model.find({ 'right.renewal.id': renewal._id, 'user.id': user._id }, 'quantity', function(err, docs) {
            if (err) {
                deferred.reject(err);
            }
            
            var consumed = 0;
            for(var i=0; i<docs.length; i++) {
                consumed += docs[i].quantity;
            }
            
            renewal.getUserSavedQuantity(user).then(function(savedQuantity) {
                deferred.resolve(consumed - savedQuantity);
            }, deferred.reject);
        });
        
        return deferred.promise;
    };


    /**
     * If the associated right is a time saving account
     * sum of quantities in deposits for this renewal
     *
     * @param {User} user
     *
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserTimeSavingDepositsQuantity = function(user) {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        var model = this.model('Request');
        model.find({
            'time_saving_deposit.to.renewal.id': this._id,
            'user.id': user._id
        }, 'time_saving_deposit.quantity', function (err, docs) {
            if (err) {
                deferred.reject(err);
            }

            var deposits = 0;
            for(var i=0; i<docs.length; i++) {
                deposits += docs[i].time_saving_deposit[0].quantity;
            }

            deferred.resolve(deposits);
        });

        return deferred.promise;
    };


    /**
     * A ratio to convert quantities in day
     * if the associated right is in days, this will always be 1
     * if the associated right is in hour, the ratio will be the one from the working times calendar associated to the user
     * on the current date if current date is in the renewal period or else the finish date of the renewal period
     *
     * @param {User} user
     *
     * @returns {Promise} Number
     */
    rightRenewalSchema.methods.getDaysRatio = function(user) {

        let renewal = this;
        let now = new Date();
        let workingTimesDate;

        if (renewal.start <= now && renewal.finish >= now) {
            workingTimesDate = now;
        } else {
            workingTimesDate = renewal.finish;
        }

        return new Promise((resolve, reject) => {

            if (!renewal.populated('right')) {
                throw new Error('right must be populated');
            }

            if (!user.populated('roles.account')) {
                throw new Error('roles.account must be populated');
            }

            if ('D' === renewal.right.quantity_unit) {
                return resolve(1);
            }

            user.roles.account.getScheduleCalendar(workingTimesDate).then(calendar => {

                if (null === calendar) {
                    // no schedule calendar on period
                    return resolve(0);
                }

                resolve(1/calendar.hoursPerDay);

            }).catch(reject);
        });
    };

        
    
    /**
     * Get a user available quantity 
     * the user quantity - the consumed quantity + deposits quantity
     *
     * @todo duplicated with accountRight object
     *
     * @param {User} user
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserAvailableQuantity = function(user) {
        
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        Promise.all([
            this.getUserQuantity(user),
            this.getUserConsumedQuantity(user),
            this.getUserTimeSavingDepositsQuantity(user)
        ]).then(function(arr) {
            deferred.resolve(arr[0] - arr[1] + arr[2]);
        }).catch(deferred.reject);
        
        return deferred.promise;
    };
    
    
    /**
     * Get a user available, consumed and initial quantity
     *
     * @param {User} user
     * @returns {Promise} resolve to an object
     */
    rightRenewalSchema.methods.getUserQuantityStats = function(user) {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        let renewal = this;

        user.populate('roles.account', (err) => {

            if (err) {
                return deferred.reject(err);
            }

            Promise.all([
                renewal.getUserQuantity(user),
                renewal.getUserConsumedQuantity(user),
                renewal.getUserTimeSavingDepositsQuantity(user),
                renewal.getDaysRatio(user)
            ]).then(function(arr) {
                deferred.resolve({
                    initial: arr[0],
                    consumed: arr[1],
                    deposits: arr[2],
                    available: (arr[0] - arr[1] + arr[2]),
                    daysratio: arr[3]
                });
            }).catch(deferred.reject);
        });



        return deferred.promise;
    };



    /**
     * Get the saving period for the renewal
     * With start and finish properties
     *
     * @param {Right} [right]
     * @return {Object}
     */
    rightRenewalSchema.methods.getSavingPeriod = function(right) {

        if (undefined === right || null === right) {
            if (undefined !== this.populated('right')) {
                right = this.right;
            } else {
                throw new Error('missing right as parameter or by populate');
            }
        }



        if (undefined === right.timeSaving || !right.timeSaving.active) {
            return null;
        }

        if (undefined === right.timeSaving.savingInterval) {
            return null;
        }

        if (right.timeSaving.savingInterval.useDefault) {
            return {
                start: this.start,
                finish: this.finish
            };
        }

        var savingPeriod = {
            start: new Date(this.start),
            finish: new Date(this.finish)
        };

        savingPeriod.start.setFullYear(savingPeriod.start.getFullYear() - right.timeSaving.savingInterval.min);
        savingPeriod.finish.setFullYear(savingPeriod.finish.getFullYear() - right.timeSaving.savingInterval.max);

        return savingPeriod;
    };




    /**
     * get number of week-end days in the renewal for one user
     * @throws {Error} [[Description]]
     * @param   {Account}   user [[Description]]
     * @returns {Promise} Int
     */
    rightRenewalSchema.methods.getWeekEndDays = function(account) {

        let renewal = this;

        return new Promise((resolve, reject) => {
            account.getPeriodScheduleEvents(renewal.start, renewal.finish).then(ScheduleEra => {

                let scheduledDays = Object.keys(ScheduleEra.getDays()).length;
                resolve(renewal.getDays() - scheduledDays);

            }).catch(reject);
        });
    };



    /**
     * Get number of days in renewal period
     * in classical cases, this will be 365
     *
     * @returns {Number} Integer
     */
    rightRenewalSchema.methods.getDays = function() {

        function treatAsUTC(date) {
            var result = new Date(date);
            result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
            return result;
        }

        var millisecondsPerDay = 24 * 60 * 60 * 1000;
        return (treatAsUTC(this.finish) - treatAsUTC(this.start)) / millisecondsPerDay;
    };








    /**
     * Get number of planned working days on the period
     * This method should be called on the renewal associated to the annual paid leave because
     * the associated right will be excluded from computed quantity and only this right will be taken into account
     *
     * @exemple 365 - 104 week-ends days - 25 days of annual paid leaves - 8 non working days = 228
     *
     * @param {User} user
     * @return {Promise}
     */
    rightRenewalSchema.methods.getPlannedWorkDayNumber = function(user) {

        let renewal = this;
        let weekEnds, nonWorkingDays;

        return user.getAccount().then(account => {

            return Promise.all([
                renewal.getWeekEndDays(account),
                account.getNonWorkingDayEvents(renewal.start, renewal.finish)
            ]);

        }).then(r => {

            weekEnds = r[0];
            nonWorkingDays = Object.keys(r[1].getDays()).length;

            return renewal.getUserQuantity(user);


        }).then(initalQuantity => {

            console.log(weekEnds);
            console.log(initalQuantity);
            console.log(nonWorkingDays);

            return (renewal.getDays() - weekEnds - initalQuantity - nonWorkingDays);
        });

    };



    params.db.model('RightRenewal', rightRenewalSchema);
    
    
    
};


