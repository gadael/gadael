'use strict';

/**
 * Account is a user with a collection or rights
 * registrations on site create accounts
 */
exports = module.exports = function(params) {

    var mongoose = params.mongoose;

    var accountSchema = new mongoose.Schema({
        user: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String, default: '' }
        },
        isVerified: { type: Boolean, default: false },			// email verification on change
        verificationToken: { type: String, default: '' },		// email verification on change

        status: {
          id: { type: String, ref: 'Status' },
          name: { type: String, default: '' },
          userCreated: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: { type: String, default: '' },
            time: { type: Date, default: Date.now }
          }
        },
        statusLog: [params.embeddedSchemas.StatusLog],

        // date used to compute quantity on the first renewal (if this date is in the renewal interval)
        arrival: Date,

        // start date for seniority vacation rights
        seniority: Date,

        userCreated: {											// the user who create this account
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String, default: '' }
        },

        notify: {
            approvals: { type: Boolean, default: false },
            allocations: { type: Boolean, default: false }
        },

        renewalQuantity: mongoose.Schema.Types.Mixed            // specific quantity for renewals
    });

    accountSchema.index({ user: 1 });
    accountSchema.index({ 'status.id': 1 });
    accountSchema.set('autoIndex', params.autoIndex);
    
    

    /**
     * Find rights collections
     * @returns {Query} A mongoose query on the account collection schema
     */
    accountSchema.methods.getAccountCollectionQuery = function() {

        return this.model('AccountCollection')
            .find()
            .where('account').equals(this._id);
    };
    
    /**
     * Find schedule calendars
     * @returns {Query} A mongoose query on the account schedule calendar schema
     */
    accountSchema.methods.getAccountScheduleCalendarQuery = function() {
        return this.model('AccountScheduleCalendar')
            .find()
            .where('account').equals(this._id);
    };
    
    
    /**
     * Get a Q promise from a query on accountCollection
     * @param {Query} query     Mongoose query object
     * @return {Promise} resolve to a rightCollection document or null
     */
    accountSchema.methods.collectionPromise = function(query) {

        query.populate('rightCollection');

        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        query.exec(function(err, arr) {
            if (err) {
                deferred.reject(err);
                return;
            }

            if (!arr || 0 === arr.length) {
                deferred.resolve(null);
                return;
            }

            if (arr.length !== 1) {
                deferred.reject(new Error('More than one collection'));
                return;
            }

            deferred.resolve(arr[0].rightCollection);
        });

        return deferred.promise;
    };



    /**
     * Get a valid collection for a vacation request
     * resolve to null if no accountCollection
     * resolve to null if the accountCollection do not cover the whole request period
     * rejected if more than one account collection
     * resolve to the collection if one accountCollection
     *
     * @deprecated Use user.getEntryAccountCollections() instead
     *
     * @param {Date} dtstart    period start
     * @param {Date} dtend      period end
     * @param {Date} moment     request date creation or modification
     *
     * @return {Promise}
     */
    accountSchema.methods.getValidCollectionForPeriod = function(dtstart, dtend, moment) {

        var account = this;

        return account.collectionPromise(
            account.getAccountCollectionQuery()
            .where('from').lte(dtstart)
            .or([
                { to: { $gte: dtend } },
                { to: null }
            ])
            .or([
                { createEntriesFrom: { $lte: moment } },
                { createEntriesFrom: null }
            ])
            .or([
                { createEntriesTo: { $gte: moment } },
                { createEntriesTo: null }
            ])
        );
    };


    
    /**
     * Get the right collection for a specific date
     * @param {Date} moment
     *
     * @return {Promise} resolve to a rightCollection document or null
     */
    accountSchema.methods.getCollection = function(moment) {

        var account = this;

        return account.collectionPromise(
            account.getAccountCollectionQuery()
            .where('from').lte(moment)
            .where('to').gte(moment)
        ).then(function(collection) {
            if (null === collection) {
                return account.collectionPromise(
                    account.getAccountCollectionQuery()
                    .where('from').lte(moment)
                    .where('to').equals(null)
                );
            }
        });
    };
    
    




    /**
     * Set the collection for the account
     * @param {Date} moment
     *
     * @return {Promise} resolve to a AccountCollection document
     */
    accountSchema.methods.setCollection = function setCollection(rightCollection, from, to) {

        var model = this.model('AccountCollection');

        var rightCollectionId = rightCollection;

        if (rightCollection._id !== undefined) {
            rightCollectionId = rightCollection._id;
        }

        if (from === undefined) {
            from = new Date();
            from.setHours(0,0,0,0);
        }

        var accountCollection = new model();
        accountCollection.account = this._id;
        accountCollection.rightCollection = rightCollectionId;
        accountCollection.from = from;
        accountCollection.to = to;
        return accountCollection.save();
    };


    /**
     * Query for schedule calendars overlapping a period
     * @param {Date} dtstart
     * @param {Date} dtend
     * @return {Query}
     */
    accountSchema.methods.getScheduleCalendarOverlapQuery = function(dtstart, dtend) {

        var from = new Date(dtstart);
        from.setHours(0,0,0,0);
        var to = new Date(dtend);
        to.setHours(0,0,0,0);

        return this.getAccountScheduleCalendarQuery()
                        .where('from').lte(to)
                        .where('to').gte(from)
                        .populate('calendar');
    };

    /**
     * Query for schedule calendars witout end date, starting before a date
     * @param {Date} moment
     * @return {Query}
     */
    accountSchema.methods.getScheduleCalendarBeforeFromQuery = function(moment) {

        var d = new Date(moment);
        d.setHours(0,0,0,0);

        return this.getAccountScheduleCalendarQuery()
                        .where('from').lte(d)
                        .where('to').equals(null)
                        .populate('calendar');
    };

     /**
      * @param {Date} dtstart
      * @param {Date} dtend
      *
      * @see {AccountScheduleCalendar}
      * @return {Promise} resolve to an array of AccountScheduleCalendar
      */
     accountSchema.methods.getPeriodScheduleCalendars = function(dtstart, dtend) {

         var deferred = {};
         deferred.promise = new Promise(function(resolve, reject) {
             deferred.resolve = resolve;
             deferred.reject = reject;
         });

         var account = this;

         account.getScheduleCalendarOverlapQuery(dtstart, dtend)
            .exec(function(err, arr1) {

                if (err) {
                    deferred.reject(err);
                    return;
                }

                account.getScheduleCalendarBeforeFromQuery(dtend)
                    .exec(function(err, arr2) {

                    if (err) {
                        deferred.reject(err);
                        return;
                    }

                    deferred.resolve(arr1.concat(arr2));
                });

            });

         return deferred.promise;
     };



    /**
     * get schedule events in a period
     * @param {Date} dtstart
     * @param {Date} dtend
     * @return {Promise} resolve to an Era object
     */
    accountSchema.methods.getPeriodScheduleEvents = function(dtstart, dtend) {

        var jurassic = require('jurassic');

        var async = require('async');

        function isValidDate(d) {
            if ( Object.prototype.toString.call(d) !== "[object Date]" ) {
                return false;
            }
            return !isNaN(d.getTime());
        }

        if (!isValidDate(dtstart) || !isValidDate(dtend)) {
            throw new Error('Missing date interval');
        }


        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        var account = this;

        account.getPeriodScheduleCalendars(dtstart, dtend).then(function(ascList) {

            var from, to, events = new jurassic.Era();

            async.each(ascList, function(asc, callback) {
                from = asc.from > dtstart ? asc.from : dtstart;
                to = (null !== asc.to && asc.to < dtend) ? asc.to : dtend;
                asc.calendar.getEvents(from, to, function eventsCb(err, calendarEvents) {

                    if (err) {
                        return callback(err);
                    }

                    calendarEvents.forEach(function(event) {

                        events.addPeriod(event);
                        var last = events.periods.length-1;
                        events.periods[last].businessDays = events.periods[last].getBusinessDays(asc.calendar.halfDayHour);
                    });

                    callback();
                });
            }, function(err) {

                if (err) {
                    return deferred.reject(err);
                }

                deferred.resolve(events);
            });
        });

        return deferred.promise;
    };


    /**
     * get non working periods in a period
     * @param {Date} dtstart
     * @param {Date} dtend
     * @return {Promise} resolve to an Era object
     */
    accountSchema.methods.getPeriodUnavailableEvents = function(dtstart, dtend) {
        var jurassic = require('jurassic');
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        var acSchema = this;

        this.getPeriodScheduleEvents(dtstart, dtend).then(function(scheduleEvents) {

            var unavailableEvents = new jurassic.Era();
            var p = new jurassic.Period();
            p.dtstart = dtstart;
            p.dtend = dtend;
            unavailableEvents.addPeriod(p);
            unavailableEvents.subtractEra(scheduleEvents);

            // add non-working days

            var searchCals = acSchema.model('Calendar').find();
            searchCals.where('type', 'nonworkingday');
            searchCals.exec(function(err, calendars) {
                if (err) {
                    return deferred.reject(err);
                }

                var async = require('async');
                var nonWorkingDays = new jurassic.Era();

                async.each(calendars, function(calendar, endCal) {
                    calendar.getEvents(dtstart, dtend, function(err, events) {
                        if (err) {
                            return endCal(err);
                        }


                        events.forEach(function(event) {
                            nonWorkingDays.addPeriod(event);
                        });
                        endCal();
                    });
                }, function(err) {
                    if (err) {
                        return deferred.reject(err);
                    }

                    unavailableEvents.addEra(nonWorkingDays);

                    // TODO: add absence events


                    var era = unavailableEvents.getFlattenedEra();

                    deferred.resolve(era);
                });
            });
        });


        return deferred.promise;
    };


    /**
     * Get the schedule calendar for a specific date
     * @return {Promise} resolve to a calendar document or null
     */
    accountSchema.methods.getScheduleCalendar = function(moment) {

        var deferred = {};
        deferred.promise = new Promise((resolve, reject) => {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        var account = this;
        
        account.getScheduleCalendarOverlapQuery(moment, moment)
            .exec(function(err, arr) {

                if (err) {
                    deferred.reject(err);
                    return;
                }
            
                if (!arr || 0 === arr.length) {
                    
                    account.getScheduleCalendarBeforeFromQuery(moment)
                        .exec(function(err, arr) {
                        
                        if (err) {
                            deferred.reject(err);
                            return;
                        }
                        
                        if (!arr || 0 === arr.length) {
                            deferred.resolve(null);
                            return; 
                        }
                        
                        deferred.resolve(arr[0].calendar);
                    });
                    
                    return;
                }
            
                deferred.resolve(arr[0].calendar);
            });
        
        return deferred.promise;
    };
    
    

    /**
     * Get the ongoing right collection
     * @return {Promise} resolve to a rightCollection document or null
     */
    accountSchema.methods.getCurrentCollection = function() {
        var today = new Date();
        return this.getCollection(today);
    };
    
    /**
     * Get the ongoing schedule calendar
     * @return {Promise} resolve to a calendar document or null
     */
    accountSchema.methods.getCurrentScheduleCalendar = function() {
        var today = new Date();
        return this.getScheduleCalendar(today);
    };
    
    
    /**
     * 
     * Get the list of rights beneficiaries associated to an account
     * @param {Date} moment  optional date parameter
     * 
     * @return {Promise} resolve to an array of beneficiary documents
     */
    accountSchema.methods.getRightBeneficiaries = function(moment) {
        
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        
        if (!moment) {
            moment = new Date();
        }
        


        var account = this;
        
        
        this.getCollection(moment).then(function(rightCollection) {

            if (!account.user.id) {
                return deferred.reject('The user.id property is missing on user.roles.account');
            }
            
            var userDocuments = [account.user.id];

            if (rightCollection) {
                userDocuments.push(rightCollection._id);
            }

            deferred.resolve(
                account.model('Beneficiary')
                .where('document').in(userDocuments)
                .populate('right')
                .exec()
            );
            
        }).catch(deferred.reject);
        
        return deferred.promise;
    };
    
    /**
     * 
     * @param {Date} moment  optional date parameter
     * @return {Promise} resolve to an array of rights
     */
    accountSchema.methods.getRights = function(moment) {

        let deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        
        this.getRightBeneficiaries(moment).then(function(beneficiaries) {
            let rights = [];
            
            for(var i=0; i< beneficiaries.length; i++) {
                rights.push(beneficiaries[i].right);
            }

            deferred.resolve(rights);
        }).catch(deferred.reject);
        
        return deferred.promise;
    };
    




    /**
     * Get the given quantity for a renewal
     * @param {RightRenewal} renewal
     * @return {Number}
     */
    accountSchema.methods.getQuantity = function(renewal) {

        if (this.renewalQuantity !== undefined && this.renewalQuantity[renewal._id] !== undefined) {
            return this.renewalQuantity[renewal._id];
        }

        if (renewal.right.quantity === undefined) {
            throw new Error('Missing right quantity');
        }

        return renewal.right.quantity;
    };



    /**
     * Get the account requests
     *
     * @return {Promise}
     */
    accountSchema.methods.getRequests = function() {

        var model = this.model('Request');
        var query = model.find();

        query.where('user.id', this.user.id);
        query.sort({ timeCreated: 'desc' });

        return query.exec();
    };


    params.db.model('Account', accountSchema);
};
