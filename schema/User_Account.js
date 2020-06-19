'use strict';

const jurassic = require('jurassic');
const util = require('util');
const userAccountCustomize = require('./plugins/userAccountCustomize');

/**
 * Account is a user with a collection or rights
 * registrations on site create accounts
 */
exports = module.exports = function(params) {
    const mongoose = params.mongoose;
    const accountSchema = new mongoose.Schema({
        user: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, unique: true },
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

        // date used to compte age
        birth: Date,

        // date used to compute quantity on the first renewal (if this date is in the renewal interval)
        // also the default lunch breaks start if lunch.from is not defined
        arrival: Date,

        // start date for seniority vacation rights
        seniority: Date,

        userCreated: {											// the user who create this account
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String, default: '' }
        },

        notify: {
            approvals: { type: Boolean, default: true }
        },

        sage: {
            registrationNumber: String // Used in sage export
        },

        renewalStatsOutofDate: { type: Boolean, default: false }, // force user renewal stats refresh

        lunch: {
            active: { type: Boolean, default: true },
            createdUpTo: { type: Date, default: Date.now() },
            from: Date,
            to: Date
        },

        overtimeSettlements: [params.embeddedSchemas.OvertimeSettlement]
    });

    accountSchema.index({ user: 1 });
    accountSchema.index({ 'status.id': 1 });
    accountSchema.set('autoIndex', params.autoIndex);
    accountSchema.plugin(userAccountCustomize);


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
     * Find non-working days calendars
     * @returns {Query} A mongoose query on the account schedule calendar schema
     */
    accountSchema.methods.getAccountNWDaysCalendarQuery = function() {
        return this.model('AccountNWDaysCalendar')
            .find()
            .where('account').equals(this._id);
    };


    /**
     * Get a promise from a query on accountCollection
     * @param {Query} query     Mongoose query object
     * @return {Promise} resolve to a rightCollection document or null
     */
    accountSchema.methods.collectionPromise = function(query) {

        query.populate('rightCollection');

        return query.exec()
        .then(arr => {
            if (!arr || 0 === arr.length) {
                return null;
            }

            if (arr.length !== 1) {
                throw new Error('More than one collection: '+arr.length);
            }

            return arr[0].rightCollection;
        });
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
     * Get the collection crossing the period in dtstart - dtend
     * if multiple accountCollection match, get the nearest account collection from moment
     * @param {Date} dtstart
     * @param {Date} dtend
     * @param {Date} moment     Optional
     * @return {Promise}        Resolve to one collection
     */
    accountSchema.methods.getIntersectCollection = function(dtstart, dtend, moment) {

        if (!moment) {
            moment = new Date();
        }

        let account = this;
        let position = moment.getTime();

        /**
         * Get distance from position
         * @param {Int} t Milliseconds
         * @return {Int}
         */
        function getTimeDist(t) {
            return Math.abs(position - t);
        }

        /**
         * @param {accountCollection} accountCollection
         * @return {Int}
         */
        function getDistance(accountCollection) {
            let s = accountCollection.from.getTime();
            let e;
            if (!accountCollection.to) {
                e = Infinity;
            } else {
                e = accountCollection.to.getTime();
            }

            return Math.min(getTimeDist(s), getTimeDist(e));
        }

        let criterion = {
            $and: [
                { from: { $lt: dtend }},
                { $or: [
                    { to: { $gt: dtstart }},
                    { to: null }
                ]}
            ]
        };


        return account.getAccountCollectionQuery()
        .where(criterion)
        .populate('rightCollection')
        .exec()
        .then(arr => {

            if (0 === arr.length) {
                return null;
            }

            if (1 === arr.length) {
                return arr[0].rightCollection;
            }

            let nearest = arr[0];
            for (let i=1; i<arr.length; i++) {
                if (getDistance(nearest) > getDistance(arr[i])) {
                    nearest = arr[i];
                }
            }

            return nearest.rightCollection;
        });
    };



    /**
     * Get the right collection associated to the user (with history)
     *
     *
     * @return {Promise} resolve to an array of collections
     */
    accountSchema.methods.getCollections = function() {
        const account = this;

        let query = account.getAccountCollectionQuery();
        query.populate('rightCollection');

        return query.exec()
        .then(accountCollections => {
            return accountCollections.map(ac => {
                return ac.rightCollection;
            });
        });
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

            return collection;
        });
    };






    /**
     * Set the collection for the account
     * @param {String|ObjectId|RightCollection} rightCollection
     * @param {Date} from
     * @param {Date} to
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
     *
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
     * Query for non-working days calendars overlapping a period
     * @param {Date} dtstart
     * @param {Date} dtend
     * @return {Query}
     */
    accountSchema.methods.getNWDaysCalendarOverlapQuery = function(dtstart, dtend) {

        var from = new Date(dtstart);
        from.setHours(0,0,0,0);
        var to = new Date(dtend);
        to.setHours(0,0,0,0);

        return this.getAccountNWDaysCalendarQuery()
                        .where('from').lte(to)
                        .where('to').gte(from)
                        .populate('calendar');
    };


    /**
     * Query for non-working days calendars witout end date, starting before a date
     *
     * @param {Date} moment
     * @return {Query}
     */
    accountSchema.methods.getNWDaysCalendarBeforeFromQuery = function(moment) {

        var d = new Date(moment);
        d.setHours(0,0,0,0);

        return this.getAccountNWDaysCalendarQuery()
                        .where('from').lte(d)
                        .where('to').equals(null)
                        .populate('calendar');
    };













     /**
      * Get schedule calendars associated to account in a period
      *
      * @param {Date} dtstart
      * @param {Date} dtend
      *
      * @see {AccountScheduleCalendar}
      * @return {Promise} resolve to an array of AccountScheduleCalendar
      */
     accountSchema.methods.getPeriodScheduleCalendars = function(dtstart, dtend) {

         var account = this;

         return account.getScheduleCalendarOverlapQuery(dtstart, dtend).exec()
        .then(function(arr1) {

            return account.getScheduleCalendarBeforeFromQuery(dtend).exec()
            .then(function(arr2) {
                return arr1.concat(arr2);
            });
        });
     };




    /**
      * Get non-working days calendars associated to account in a period
      *
      * @param {Date} dtstart
      * @param {Date} dtend
      *
      * @see {AccountNWDaysCalendar}
      * @return {Promise} resolve to an array of AccountNWDaysCalendar
      */
     accountSchema.methods.getPeriodNWDaysCalendars = function(dtstart, dtend) {

         var account = this;

         return account.getNWDaysCalendarOverlapQuery(dtstart, dtend).exec()
        .then(function(arr1) {

            return account.getNWDaysCalendarBeforeFromQuery(dtend).exec()
            .then(function(arr2) {
                return arr1.concat(arr2);
            });
        });
     };


    /**
     * Get list of events from a list of planning documents (schedule calendars or non-working days calendars)
     * @param {Array} plannings Array of AccountScheduleCalendar
     * @param {Date} dtstart   [[Description]]
     * @param {Date} dtend     [[Description]]
     *
     * @return {Promise}
     */
    accountSchema.methods.getPlanningEvents = function(plannings, dtstart, dtend) {


        let from, to, events = new jurassic.Era();


        return Promise.all(
            plannings.map(asc => {
                from = asc.from > dtstart ? asc.from : dtstart;
                to = (null !== asc.to && asc.to < dtend) ? asc.to : dtend;
                return asc.calendar.getEvents(from, to);
            })
        )
        .then(allPlannings => {
            for (let i=0; i<allPlannings.length; i++) {
                let calendarEvents = allPlannings[i];
                let calendar = plannings[i].calendar;

                for (let j=0; j<calendarEvents.length; j++) {
                    if (calendarEvents[j].dtstart < dtstart) {
                        calendarEvents[j].dtstart = dtstart;
                    }
                    if (calendarEvents[j].dtend > dtend) {
                        calendarEvents[j].dtend = dtend;
                    }
                    if (calendarEvents[j].dtend <= dtstart || calendarEvents[j].dtstart >= dtend) {
                        continue;
                    }
                    events.addPeriod(calendarEvents[j]);
                    var last = events.periods.length-1;
                    events.periods[last].businessDays = events.periods[last].getBusinessDays(calendar.halfDayHour);
                }
            }

            return events;
        });
    };



    accountSchema.methods.checkInterval = function(dtstart, dtend) {
        function isValidDate(d) {
            if ( Object.prototype.toString.call(d) !== "[object Date]" ) {
                return false;
            }
            return !isNaN(d.getTime());
        }

        if (!isValidDate(dtstart) || !isValidDate(dtend)) {
            throw new Error('Missing date interval');
        }
    };


    /**
     * get schedule events in a period
     * @param {Date} dtstart
     * @param {Date} dtend
     * @return {Promise} resolve to an Era object
     */
    accountSchema.methods.getPeriodScheduleEvents = function(dtstart, dtend) {

        let account = this;

        account.checkInterval(dtstart, dtend);

        return account.getPeriodScheduleCalendars(dtstart, dtend)
        .then(function(ascList) {
            return account.getPlanningEvents(ascList, dtstart, dtend);
        });

    };


    /**
     * Get non-working days events in a period
     * @param   {Date} dtstart [[Description]]
     * @param   {Date} dtend   [[Description]]
     * @returns {Promise} Resolve to an Era object
     */
    accountSchema.methods.getNonWorkingDayEvents = function(dtstart, dtend) {

        let account = this;

        account.checkInterval(dtstart, dtend);

        return account.getPeriodNWDaysCalendars(dtstart, dtend)
        .then(function(nwdcList) {
            return account.getPlanningEvents(nwdcList, dtstart, dtend);
        });
    };



    /**
     * get non working days in a period (non working days + week-ends + non worked periods in worked days)
     * @param {Date} dtstart
     * @param {Date} dtend
     * @return {Promise} resolve to an Era object
     */
    accountSchema.methods.getPeriodNonWorkingDaysEvents = function(dtstart, dtend) {

        let account = this;

        return Promise.all([
            account.getPeriodScheduleEvents(dtstart, dtend),
            account.getNonWorkingDayEvents(dtstart, dtend)
        ]).then(function(res) {

            let scheduleEvents = res[0];
            let nonWorkingDays = res[1];

            let unavailableEvents = new jurassic.Era();
            let p = new jurassic.Period();
            p.dtstart = dtstart;
            p.dtend = dtend;
            unavailableEvents.addPeriod(p);
            unavailableEvents.subtractEra(scheduleEvents);

            // add non-working days
            unavailableEvents.addEra(nonWorkingDays);

            return unavailableEvents.getFlattenedEra();

        });
    };

    /**
     * Get Era object from calendar event query
     * @param {} query
     * @return {Promise}
     */
    accountSchema.methods.getEventsEra = function(query) {
        const leaves = new jurassic.Era();
        return query.exec().then(events => {
            events.forEach(evt => {
                try {
                    leaves.addPeriod(evt.toObject());
                } catch(e) {
                    // ignore invalid periods
                    console.log(e, evt);
                }
            });
            return leaves;
        });
    };

    /**
     * Get leave events from requests, deleted requests are excluded
     * @param {Date} dtstart [[Description]]
     * @param {Date} dtend   [[Description]]
     * @return {Promise}  Era object
     */
    accountSchema.methods.getLeaveEvents = function(dtstart, dtend) {

        return this.getEventsEra(this.model('CalendarEvent').find()
            .where('user.id', this.user.id)
            .where('status').ne('CANCELED')
            .where('dtstart').lt(dtend)
            .where('dtend').gt(dtstart));
    };

    /**
     * Get confirmed leave events with no lunch payments
     * @param {Date} dtstart [[Description]]
     * @param {Date} dtend   [[Description]]
     * @return {Promise}  Era object
     */
    accountSchema.methods.getConfirmedNoLunchLeaveEvents = function(dtstart, dtend) {

        return this.getEventsEra(this.model('CalendarEvent').find()
            .where('user.id', this.user.id)
            .where('status', 'CONFIRMED')
            .where('dtstart').lt(dtend)
            .where('dtend').gt(dtstart)
            .where('lunch', false));
    };

    /**
     * get non working periods in a period
     * @param {Date} dtstart
     * @param {Date} dtend
     * @return {Promise} resolve to an Era object
     */
    accountSchema.methods.getPeriodUnavailableEvents = function(dtstart, dtend) {

        let account = this;

        return Promise.all([
            account.getPeriodNonWorkingDaysEvents(dtstart, dtend),
            account.getLeaveEvents(dtstart, dtend)
        ]).then(res => {

            let unavailableEra = res[0];
            return unavailableEra.getFlattenedEra(res[1]);
        });
    };


    /**
     * Get the schedule calendar for a specific date
     * @param {Date} moment
     * @return {Promise} resolve to a calendar document or null
     */
    accountSchema.methods.getScheduleCalendar = function(moment) {

        var account = this;

        return account.getScheduleCalendarOverlapQuery(moment, moment).exec()
        .then(function(arr) {

            if (arr && arr.length > 0) {
                return arr[0].calendar;
            }

            return account.getScheduleCalendarBeforeFromQuery(moment).exec()
            .then(function(arr) {


                if (!arr || 0 === arr.length) {
                    return null;
                }

                return arr[0].calendar;
            });
        });
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
     * Get an array with the account ID and the collection id for the moment date
     * This array can be used to filter associated beneficiaries
     * If the moment is undefined, we get all document id from history
     *
     * @param {Date} [moment]
     *
     * @return {Promise}
     */
    accountSchema.methods.getBeneficiaryDocumentIds = function(moment) {

        if (!moment) {
            moment = new Date();
        }

        let account = this;

        if (!account.user.id) {
            return Promise.reject(new Error('The user.id property is missing on user.roles.account'));
        }


        /**
         * @param {Array} collection
         * @return {Array}
         */
        function getUserDocuments(collections) {

            var userDocuments = [account.user.id];

            collections.forEach(rightCollection => {
                userDocuments.push(rightCollection._id);
            });

            return userDocuments;
        }




        if (moment !== undefined) {
            return this.getCollection(moment)
            .then((rightCollection) => {

                if (null === rightCollection) {
                    return getUserDocuments([]);
                }

                return getUserDocuments([rightCollection]);
            });
        }

        // get all collections from the user history

        return this.getCollections()
        .then(collections => getUserDocuments(collections));
    };


    /**
     *
     * Get the list of rights beneficiaries associated to an account
     * @param {Date} moment  optional date parameter
     *
     * @return {Promise} resolve to an array of beneficiary documents
     */
    accountSchema.methods.getRightBeneficiaries = function(moment) {

        let account = this;

        return account.getBeneficiaryDocumentIds(moment)
        .then(function(userDocuments) {

            return account.model('Beneficiary')
                .find()
                .where('document').in(userDocuments)
                .populate('right')
                .exec();
        });

    };

    /**
     * Get the beneficiary document or null if the right is not associated
     *
     * @param {String} rightId
     * @param {Date} moment     Optional
     *
     * @return {Promise}  Resolve to the beneficiary document
     */
    accountSchema.methods.getRightBeneficiary = function(rightId, moment) {

        let account = this;

        return account.getBeneficiaryDocumentIds(moment)
        .then(function(userDocuments) {

            return account.model('Beneficiary')
                .findOne()
                .where('document').in(userDocuments)
                .where('right').equals(rightId)
                .populate('right')
                .exec();
        });
    };



    /**
     *
     * @param {Date} moment  optional date parameter
     * @return {Promise} resolve to an array of rights
     */
    accountSchema.methods.getRights = function(moment) {

        return this.getRightBeneficiaries(moment)
        .then(function(beneficiaries) {
            let rights = [];

            for(var i=0; i< beneficiaries.length; i++) {
                rights.push(beneficiaries[i].right);
            }

            return rights;
        });
    };





    function addPair(output, beneficiary, renewals) {

        for(var i=0; i< renewals.length; i++) {

            if (null === renewals[i]) {
                continue;
            }

            output.push({
                beneficiary: beneficiary,
                renewal: renewals[i]
            });
        }
    }


    /**
     * Get pairs of renewal/beneficiary object
     * beneficiary with no valid renewal for the moment are ignored
     * @param {Date} [moment] optional moment date
     * @return {Promise}
     */
    accountSchema.methods.getBeneficiariesRenewals = function(moment) {

        let output = [];

        return this.getRightBeneficiaries(moment) // moment is optional here
        .then(beneficiaries => {
            if (undefined !== moment) {
                return Promise.all(
                    beneficiaries.map(b => b.right.getMomentRenewal(moment))
                )
                .then(renewals => {
                    for(var i=0; i< beneficiaries.length; i++) {
                        addPair(output, beneficiaries[i], [renewals[i]]);
                    }

                    return output;
                });
            }


            return Promise.all(
                beneficiaries.map(b => b.right.getAllRenewals())
            )
            .then(lists => {
                for(var i=0; i< beneficiaries.length; i++) {
                    addPair(output, beneficiaries[i], lists[i]);
                }

                return output;
            });

        });
    };





    /**
     * Get associated renewals on a date
     * @param {Date} moment optional date, if not set this is now
     * @return {Promise} resolve to renewals array
     */
    accountSchema.methods.getMomentRenewals = function(moment) {
        return this.getRights(moment)
        .then(rights => {
			return Promise.all(
    			rights.map(right => {
    				return right.getMomentRenewal(moment);
    			})
            );
		});
    };


    /**
     * Get the given quantity for a renewal
     * This is the initial quantity without the adjustements
     *
     * TODO: remove this method, not necessary
     *
     * @param {RightRenewal} renewal
     * @return {Number}
     */
    accountSchema.methods.getQuantity = function(renewal) {

        if (renewal.right.quantity === undefined) {
            throw new Error('Missing right quantity');
        }

        return renewal.right.quantity;
    };



    /**
     * Get the account requests
     *
     * @param {Date}    from optional
     * @param {Date}    to   optional
     *
     * @return {Promise}
     */
    accountSchema.methods.getRequests = function(from, to) {

        var model = this.model('Request');
        var query = model.find();
        query.populate('absence.distribution');
        query.where('user.id', this.user.id);

        if (undefined !== from) {
            query.where({ 'events.dtend': { $gt: from }});
        }

        if (undefined !== to) {
            query.where({ 'events.dtstart': { $lt: to }});
        }

        query.sort({ timeCreated: 'desc' });

        return query.exec();
    };


    /**
     * Get number of hours per week on a period
     * If there are more than one shedule period on the requested interval, the method will return the average
     * This is used to compute number of RTT days
     *
     * @param {Date} dtstart
     * @param {Date} dtend
     * @return {Promise} resolve to an object with number of hours and the number of worked days
     */
    accountSchema.methods.getWeekHours = function(dtstart, dtend) {
        let account = this;
        const gt = params.app.utility.gettext;
        let weekLoop = new Date(dtstart);
        // go to next monday

        weekLoop.setDate(weekLoop.getDate() + (8 - weekLoop.getDay()) % 7);

        // wee need at least one week
        let limit = new Date(weekLoop);
        limit.setDate(limit.getDate() + 7);

        if (limit > dtend) {
            throw new Error('Interval must contain one week starting on a monday '+dtstart+' - '+dtend);
        }

        /**
         * contain hours per day in current week
         * properties are week days
         * @var {Array}
         */
        let currentWeek = {};
        let weeks = [];

        /**
         * Forward to next week
         */
        function next() {
            let week = {
                nbDays: 0,
                hours: 0
            };

            for(let wd in currentWeek) {
                if (currentWeek.hasOwnProperty(wd)) {
                    week.nbDays++;
                    week.hours += currentWeek[wd];
                }
            }

            weeks.push(week);
            currentWeek = {};
            weekLoop.setDate(weekLoop.getDate() + 7);
            limit.setDate(limit.getDate() + 7);
        }

        return account.getPeriodScheduleEvents(weekLoop, dtend)
        .then(era => {
            era.getFlattenedEra().periods.forEach(p => {

                if (p.dtstart > limit) {
                    next();
                }

                let wd = p.dtstart.getDay();
                if (undefined === currentWeek[wd]) {
                    currentWeek[wd] = 0;
                }

                currentWeek[wd] += (p.dtend.getTime() - p.dtstart.getTime())/3600000;
            });

            if (0 === weeks.length) {
                throw new Error(util.format(gt.gettext('No weeks found for %s'), account.user.name));
            }

            // average days per week and hours per week
            let nbDaySum = 0, hourSum = 0;
            weeks.forEach(w => {
                nbDaySum += w.nbDays;
                hourSum += w.hours;
            });

            return {
                nbDays: (nbDaySum / weeks.length),
                hours: (hourSum / weeks.length)
            };
        });
    };

    /**
     * Get lunch breaks on a period
     * @param {Date} dtstart
     * @param {Date} dtend
     * @return {Promise} resolve to alist of dates
     */
    accountSchema.methods.getLunchBreaks = function(dtstart, dtend) {
        const account = this;

        return Promise.all([
            account.getPeriodScheduleEvents(dtstart, dtend),
            account.getNonWorkingDayEvents(dtstart, dtend),
            account.getConfirmedNoLunchLeaveEvents(dtstart, dtend)
        ]).then(function(res) {
            const scheduleEvents = res[0];
            scheduleEvents.subtractEra(res[1]);
            scheduleEvents.subtractEra(res[2]);
            // Count days with work on morning AND afternoon
            const dayIndex = {};
            scheduleEvents.getFlattenedEra().periods.forEach(p => {
                const k = p.dtstart.toDateString();
                if (undefined === dayIndex[k]) {
                    dayIndex[k] = {
                        'day': p.dtstart,
                        'am': false,
                        'pm': false
                    };
                }
                if (p.dtend.getHours() < 14) {
                    dayIndex[k].am = true;
                }
                if (p.dtstart.getHours() > 12) {
                    dayIndex[k].pm = true;
                }
            });

            return Object.values(dayIndex)
                .filter(p => p.am && p.pm)
                .map(p => {
                    const day = p.day;
                    day.setHours(12,0,0,0);
                    return day;
                });
        });
    };

    /**
     * Save lunch breaks in database
     * @param {Date} limit optional argument to limit creation period
     * @return {Promise}
     */
    accountSchema.methods.saveLunchBreaks = function(limit) {
        let start = this.lunch.createdUpTo;
        if (this.arrival && (!start || start < this.arrival)) {
            start = this.arrival;
        }
        if (this.lunch.from && start < this.lunch.from) {
            start = this.lunch.from;
        }
        start.setHours(0, 0, 0, 0);

        let end = new Date();
        end.setDate(-1);
        if (this.lunch.to && end > this.lunch.to) {
            end = this.lunch.to;
        }
        end.setHours(23, 59, 59, 999);

        if (limit !== undefined && limit < end && limit > start) {
            end = limit;
        }

        if (this.lunch.from && this.lunch.from < this.lunch.createdUpTo) {
            // start date has been specified in the past, recreate lunchs
            this.lunch.createdUpTo = this.lunch.from;
            start = this.lunch.from;
        }

        if (end <= this.lunch.createdUpTo) {
            // Nothing to save
            return Promise.resolve();
        }

        const Lunch = this.model('Lunch');
        return Lunch.deleteMany({ 'user.id': this.user.id, day: { $gte: start }})
        .exec()
        .then(() => {
            return this.getLunchBreaks(start, end);
        })
        .then(lunchs => {
            const promises = lunchs.map(day => {
                const lunch = new Lunch();
                lunch.day = day;
                lunch.user = this.user;
                return lunch.save();
            });

            return Promise.all(promises);
        })
        .then(() => {
            this.lunch.createdUpTo = end;
            this.lunch.createdUpTo.setHours(0, 0, 0, 0);
            this.lunch.createdUpTo.setDate(this.lunch.createdUpTo.getDate() + 1);
            return this.save();
        });
    };

    /**
     * Get overtime unsettled quantity
     * @return {Promise} int
     */
    accountSchema.methods.getOvertimeQuantity = function() {
        const aggregate = this.model('Overtime').aggregate();

        let userId = this.user.id;
        if (this.user.id instanceof this.model('User')) {
            userId = this.user.id._id;
        }
        aggregate.match({ 'user.id': userId });
        aggregate.match({ 'settled': false });
        aggregate.group({
            _id: null,
            total: { $sum: '$quantity' },
            settled: { $sum: '$settlements.quantity' }
        });

        return aggregate.exec().then(list => {
            return (list[0].total - list[0].settled);
        });
    };

    params.db.model('Account', accountSchema);
};
