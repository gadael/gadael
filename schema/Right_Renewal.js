'use strict';

const consumptionHistory = require('../modules/consumptionHistory');
const util = require('util');


exports = module.exports = function(params) {

    var mongoose = params.mongoose;


    var rightRenewalSchema = new mongoose.Schema({

        right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true, index: true },
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
    rightRenewalSchema.pre('save', function() {
        return this.checkOverlap()
            .then(this.updateMonthlyAdjustment.bind(this));
    });



    /**
     * Pre remove hook
     */
    rightRenewalSchema.pre('remove', function() {
        return this.removeUserRenewalStat();
    });


    /**
     * Remove user renewal stat cache when renewal is deleted
     * @return {Promise}
     */
    rightRenewalSchema.methods.removeUserRenewalStat = function()
    {
        let renewal = this;
        let UserRenewalStat = params.db.models.UserRenewalStat;
        return UserRenewalStat.find({ renewal: renewal._id })
        .exec()
        .then(arr => {
            return Promise.all(arr.map(s => s.remove()));
        });
    };


    /**
     * @return {Promise}
     */
    rightRenewalSchema.methods.checkOverlap = function()
    {
        const gt = params.app.utility.gettext;
        const model = params.db.models.RightRenewal;

        return model.find({ right: this.right })
            .where('start').lt(this.finish)
            .where('finish').gt(this.start)
            .where('_id').ne(this._id)
            .countDocuments()
            .exec()
            .then(renewals => {
                if (renewals > 0) {
                    throw new Error(gt.gettext('The renewals periods must not overlap'));
                }

                return true;
            }
        );
    };






    /**
     * Remove auto adjustments linked to this right renewal
     * @param {User} user
     * @return {Promise}
     */
    rightRenewalSchema.methods.removeAutoAdjustement = function(user) {

        let Adjustment = params.db.models.Adjustment;

        return Adjustment.find()
        .where('rightRenewal').equals(this._id)
        .where('autoAdjustment').equals(true)
        .exec()
        .then(adjustments => {
            let promises = [];

            adjustments.forEach(a => {
                promises.push(a.remove());
            });

            return Promise.all(promises);
        });
    };


    /**
     * Add adjustement for one user
     * @param {User} user
     * @param {Date} moment
     * @param {Number} quantity
     *
     * @return {Promise}
     */
    rightRenewalSchema.methods.addAutoAdjustment = function(user, moment, quantity) {

        let renewal = this;
        let Adjustment = params.db.models.Adjustment;

        let adjust = new Adjustment();

        adjust.rightRenewal = renewal._id;
        adjust.user = user._id;
        adjust.timeCreated = moment;    // TODO: use a different field name
        adjust.quantity = quantity;
        adjust.autoAdjustment = true;

        return adjust.save();
    };



    /**
     * Update the auto adjustements list for one user
     *
     * if autoAdjustment configured on right
     * get the consumption quantity on all selected types
     * create the adjustements with timeCreated match the consumption date
     *
     * consumption is from consumedQuantity field in absence elements
     * moved quantity to time saving account is not considered as a consumption
     *
     * @param {User} user
     *
     * @return {Promise}     Promise the number of modified adjustments
     */
    rightRenewalSchema.methods.updateAutoAdjustments = function(user) {

        let renewal = this;

        return renewal.removeAutoAdjustement()
        .then(() => {
            return renewal.getRightPromise();
        })
        .then(right => {
            if (undefined !== right.autoAdjustment &&
            undefined !== right.autoAdjustment.quantity &&
            null !== right.autoAdjustment.quantity) {

                return consumptionHistory.getConsuptionHistory(user, right.autoAdjustment.types)
                .then(history => {

                    let current = 0;
                    let promises = [];

                    history.forEach(h => {
                        current += h.consumedQuantity;
                        if (current >= right.autoAdjustment.step) {
                            current = 0;
                            promises.push(renewal.addAutoAdjustment(user, h.events[0].dtstart, right.autoAdjustment.quantity));
                        }
                    });

                    return Promise.all(promises);
                });
            }

            return Promise.resolve([]);
        });
    };


    /**
     * Update the rightAdjustment object linked to this right renewal
     * Do not change ajustements in the past
     * @return {Promise}
     */
    rightRenewalSchema.methods.updateMonthlyAdjustment = function()
    {
        return this.getRightPromise()
        .then(right => {
            this.removeFutureRightAdjustments();
            this.createRightAdjustments(right);
            return true;
        });
    };


    /**
     * remove future adjustments in the monthly adjustments
     */
    rightRenewalSchema.methods.removeFutureRightAdjustments = function() {

        if (undefined === this.adjustments) {
            return;
        }

        let now = new Date();

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
    rightRenewalSchema.methods.createRightAdjustments = function(right) {

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

        let Adjustment = params.db.models.Adjustment;
        let renewal = this;

        return Adjustment.find({ rightRenewal: renewal._id, user: user._id }, 'quantity')
        .then(docs => {
            let adjustments = 0, i;
            for (i=0; i<docs.length; i++) {
                adjustments += docs[i].quantity;
            }

            return adjustments;
        });

    };

    /**
     * Set the right document to return in getRightPromise
     * This is a performance optimization
     *
     */
    rightRenewalSchema.methods.setRightForPromise = function(right) {
        let renewal = this;

        renewal.promiseRight = right;
    };


    /**
     * Get the right linked to the renewal
     * return a promise and resolve to a Right document
     *
     * @return {Promise}
     */
    rightRenewalSchema.methods.getRightPromise = function() {

        let renewal = this;

        if (!renewal.right) {
            throw new Error('Missing right on renewal document');
        }


        if (undefined !== renewal.promiseRight) {
            return Promise.resolve(renewal.promiseRight);
        }

        return renewal.populate('right').execPopulate()
        .then(() => {
            return renewal.right;
        });
    };


    /**
     * Get the initial quantity for a user without adjustments
     * this shoud be the quantity set by administrator on the right or a computed quantity
     * if this is a special right
     *
     * @param {User} user User document with account role
     *
     * @returns {Promise} resolve to an object, the value property is the right initial quantity
     */
    rightRenewalSchema.methods.getUserRightInitialQuantity = function(user) {

        let renewal = this;

        return renewal.getRightPromise()
        .then(right => {
            let specialright = right.getSpecialRight();

            if (null === specialright) {

                if (null === right.quantity) {
                    return {
                        value: Infinity,
                        special: false
                    };
                }

                return {
                    value: right.quantity,
                    special: false
                };
            }

            return specialright.getQuantity(renewal, user);
        });

    };


    /**
     * Get a user initial quantity
     * default right quantity + adjustments on renewal from the monthly updates + manual adjustments on renewal for the user
     * The default quantity from right is accessible only after the account arrival date
     * for renewals straddling the arrival date, the quantiy is computed using the percentage of account valid time
     *
     * @todo duplicated with accountRight object
     *
     * @param {User}    user        User document with account role
     * @param {Date}    [moment]    the adjutments will be added up to this date, default is now
     *
     * @returns {Promise} resolve to an object, the value property is the user initial quantity
     */
    rightRenewalSchema.methods.getUserQuantity = function(user, moment) {

        let renewal = this;

        if (undefined === moment) {
            moment = new Date();
        }

        return Promise.all([
            renewal.getUserRightInitialQuantity(user),
            renewal.getUserAdjustmentQuantity(user)
        ])
        .then(function(arr) {

            /**
             * Default right quantity available for the renewal
             * if the user account arrival date is > renewal.start
             * a pro rata of the quantity is computed for the default quantity
             *
             * @var {Number}
             */
            let rightQuantity = arr[0].value;

            /**
             * Manual adjustment created by administrators on the account-right page
             * @var {Number}
             */
            let userAdjustment = arr[1];


            if (rightQuantity === Infinity) {
                return {
                    value: Infinity
                };
            }


            if (user.roles.account.arrival > renewal.finish) {
                // this will not be used via the REST API because invalid renewal are disacarded before
                return {
                    value: 0
                };
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

            renewal.adjustments.forEach(function(adjustment) {
                if (adjustment.from >= user.roles.account.arrival && adjustment.from <= moment) {
                    renewalAdjustment += adjustment.quantity;
                }
            });


            return {
                value: (rightQuantity + renewalAdjustment + userAdjustment),
                details: {
                    renewalAdustment: renewalAdjustment,
                    userAdjustment: userAdjustment,
                    rtt: arr[0].rtt
                }
            };
        });
    };


    /**
     * Quantity moved to time saving accounts
     * sum of quantities in deposits for this renewal
     *
     * @param {User} user
     * @param {Date} moment
     *
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserSavedQuantity = function(user, moment, addDepositQuantity) {

        let Request = this.model('Request');

        return Request.find(
            {
                'time_saving_deposit.from.renewal.id': this._id,
                'user.id': user._id
            },
            'time_saving_deposit.quantity'
        )
        .then(docs => {


            for(var i=0; i<docs.length; i++) {

                let status = docs[i].getDateStatus(moment);
                addDepositQuantity(status, docs[i].time_saving_deposit[0].quantity);


            }

            return true;
        });
    };



    /**
     * Confirmed quantity moved to time saving accounts
     * sum of quantities in deposits for this renewal
     *
     * @param {User} user
     * @param {Date} moment
     *
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserSavedConfirmedQuantity = function(user, moment) {

        let savedQuantity = 0;

        return this.getUserSavedQuantity(user, moment, function(status, quantity) {
            if ('confirmed' === status.created) {
                savedQuantity += quantity;
            }
        }).then(() => {
            return savedQuantity;
        });
    };


    /**
     * Get user consumed quantity (leaves only)
     * @see rightRenewalSchema.getUserConsumedQuantity() for full consumption
     *
     * @param {User} user        Request owner
     * @param {Date} moment        Only request approved on this date
     * @param {Function} collector Get quantity and status
     *
     * @returns {Promise}         resolve to true
     */
    rightRenewalSchema.methods.getUserAbsenceQuantity = function(user, moment, collector)
    {
        let renewal = this;
        let AbsenceElem = this.model('AbsenceElem');

        return AbsenceElem.find()
        .where('user.id', user._id)
        .where('right.renewal.id', renewal._id)
        .populate('request')
        .select('consumedQuantity request')
        .exec()
        .then(elements => {



            elements.forEach(element => {

                let status = {
                    created: 'accepted',
                    deleted: null
                };

                if (element.request) {
                    status = element.request.getDateStatus(moment);
                } else {
                    console.error('Absence element '+element.id+' does not contain the link to the request');
                }

                collector(status, element.consumedQuantity);
            });

            return true;
        });


    };


    /**
     * Get user quantity in the absences requests and by approval status
     *
     * @param {User} user        Request owner
     * @param {Date} moment        Only request approved on this date
     *
     * @returns {Promise}         resolve to a number
     */
    rightRenewalSchema.methods.getUserAbsenceRequestsQuantity = function(user, moment) {
        let consumed = 0;

        let waiting = {
            created: 0,
            deleted: 0
        };

        return this.getUserAbsenceQuantity(user, moment, function(status, quantity) {
            if (status.created === 'accepted') {
                consumed += quantity;
            }

            if (status.created === 'waiting') {
                waiting.created += quantity;
            }

            if (status.deleted === 'waiting') {
                waiting.deleted += quantity;
            }
        })
        .then(() => {
            return {
                consumed: consumed,
                waiting: waiting
            };
        });
    };


    /**
     * Get user consumed quantity (leaves only)
     * @see rightRenewalSchema.getUserConsumedQuantity() for full consumption
     *
     * @param {User} user        Request owner
     * @param {Date} moment        Only request approved on this date
     *
     * @returns {Promise}         resolve to a number
     */
    rightRenewalSchema.methods.getUserAbsenceConsumedQuantity = function(user, moment) {
        return this.getUserAbsenceRequestsQuantity(user, moment)
        .then(requests => {
            return requests.consumed;
        });
    };


    /**
     * Get a user waiting quantity
     * sum of quantities in requests and saved from this renewal
     *
     * @param {User} user        Request owner
     * @param {Date} moment        Only request in waiting state on this date
     *
     * @return {Promise}     resolve to an object
     */
    rightRenewalSchema.methods.getUserWaitingQuantity = function(user, moment) {
        return this.getUserAbsenceRequestsQuantity(user, moment)
        .then(requests => {
            return requests.waiting;
        });
    };


    /**
     * Get a user consumed quantity
     * sum of quantities in requests and saved from this renewal
     *
     * @todo duplicated with accountRight object
     *
     * @param {User} user        Request owner
     * @param {Date} moment        Only request approved on this date
     *
     * @returns {Promise} resolve to an object with consumed and waiting property
     */
    rightRenewalSchema.methods.getUserConsumedQuantity = function(user, moment) {

        let renewal = this;

        return Promise.all([
            renewal.getUserAbsenceRequestsQuantity(user, moment),
            renewal.getUserSavedConfirmedQuantity(user, moment)        // time saving account only
        ])
        .then(all => {
            let requests = all[0];
            requests.consumed = requests.consumed - all[1];
            return requests;
        });
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

        let Request = this.model('Request');

        return Request.find({
            'time_saving_deposit.to.renewal.id': this._id,
            'user.id': user._id
        }, 'time_saving_deposit.quantity')
        .then(docs => {

            var deposits = 0;
            for(var i=0; i<docs.length; i++) {
                deposits += docs[i].time_saving_deposit[0].quantity;
            }

            return deposits;
        });
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

        return renewal.getRightPromise()
        .then(right => {
            if ('D' === right.quantity_unit) {
                return Promise.resolve(1);
            }

            return user.getAccount()
            .then(account => {
                return account.getScheduleCalendar(workingTimesDate);
            })
            .then(calendar => {

                if (null === calendar || !calendar.hoursPerDay) {
                    // no schedule calendar on period
                    return 0;
                }

                return (1/calendar.hoursPerDay);
            });
        });
    };



    /**
     * Get a user available quantity
     * the user initial quantity (adjustments included)
     *     - the confirmed consumed quantity
     *     - waiting quantity (future consumption)
     *  + confirmed deposits quantity (if we are on a time saving deposit account)
     *
     *
     * @todo duplicated with accountRight object
     *
     * @param {User} user
     * @returns {Promise} resolve to a number
     */
    rightRenewalSchema.methods.getUserAvailableQuantity = function(user) {

        return Promise.all([
            this.getUserQuantity(user),
            this.getUserConsumedQuantity(user),
            this.getUserTimeSavingDepositsQuantity(user)
        ]).then(function(arr) {
            let requests = arr[1];
            return (arr[0].value - requests.consumed - requests.waiting.created + arr[2]);
        });
    };



    /**
     * Get a user available, consumed and initial quantity
     *
     * @param {User} user
     * @returns {Promise} resolve to an object
     */
    rightRenewalSchema.methods.getUserQuantityStats = function(user) {


        let renewal = this;

        return user.getAccount()
        .then(() => {

            return Promise.all([
                renewal.getUserQuantity(user),
                renewal.getUserConsumedQuantity(user),
                renewal.getUserTimeSavingDepositsQuantity(user),
                renewal.getDaysRatio(user)
            ]);

        })
        .then(arr => {

            let requests = arr[1];
            const initialQuantity = arr[0].value;


            let stat = {
                initial: initialQuantity,
                consumed: requests.consumed,
                deposits: arr[2],
                available: (initialQuantity - requests.consumed - requests.waiting.created + arr[2]),
                waiting: requests.waiting,
                daysratio: arr[3]
            };

            if (undefined !== arr[0].details && arr[0].details.rtt !== undefined) {
                stat.rtt = arr[0].details.rtt;
            }

            return stat;
        })
        .catch(err => {

            // set renewal on error for services/user/accountbeneficiaries/renewals
            err.renewal = renewal;
            return {};
        });
    };


    /**
     * Get users associated to the right
     * @param {Date}    moment  Optional date for collection association to users
     * @return {Promise}
     */
    rightRenewalSchema.methods.getBeneficiaryUsers = function(moment) {
        let renewal = this;
        return renewal.getRightPromise()
        .then(right => {
            return right.getBeneficiaryUsers(moment);
        });
    };


    /**
     * Force cache refresh for one user
     * @param {User} user
     * @param {beneficiary} beneficiary
     * @return {Promise}
     */
    rightRenewalSchema.methods.updateUserStat = function(user, beneficiary) {
        let renewal = this;

        return renewal.getUserQuantityStats(user)
        .then(validStat => {
            // overwrite previous error
            validStat.error = null;
            return renewal.saveUserRenewalStat(user, beneficiary, validStat);
        })
        .catch(err => {

            console.log('Error saved to stat', err.stack);

            return renewal.saveUserRenewalStat(user, beneficiary, {
                initial: 0,
                available: 0,
                error: err.message
            });
        });
    };

    /**
     * Force cache refresh for all users whith access to this renewal
     * Set only the outofdate status, chache refresh will be done afterward
     * @param {Date}    moment  Optional date for collection association to users
     * @return {Promise}
     */
    rightRenewalSchema.methods.setUsersStatOutOfDate = function(moment) {
        return this.getBeneficiaryUsers(moment)
        .then(beneficiaries => {
            const accountIds = beneficiaries.map(b => b.user.roles.account);
            return params.db.models.Account.updateMany(
                { _id: { $in: accountIds } },
                { $set: { renewalStatsOutofDate: true } }
            ).exec();
        });
    };


    /**
     * Force cache refresh for all users whith access to this renewal
     * @param {Date}    moment  Optional date for collection association to users
     * @return {Promise}
     */
    rightRenewalSchema.methods.updateUsersStat = function(moment) {
        return this.getBeneficiaryUsers(moment)
        .then(users => {
            return Promise.all(users.map(ub => {
                // this update all renewals for the user:
                return ub.user.updateRenewalsStat(moment);

                // This update only the current renewal:
                //return renewal.updateUserStat(ub.user, ub.beneficiary);
            }));
        });
    };


    /**
     * @return {Promise}
     */
    rightRenewalSchema.methods.deleteUserRenewalStat = function(user) {

        let renewal = this;
        let UserRenewalStat = renewal.model('UserRenewalStat');

        return UserRenewalStat.find({
            user: user._id,
            renewal: renewal._id
        })
        .exec()
        .then(arr => arr.map(s => s.remove()));
    };


    /**
     * Save stat object to database
     * @param {User} user
     * @param {Beneficiary} beneficiary
     * @param {Object} stat Stat object to save
     *
     * @return {Promise} resolve to the new saved document
     */
    rightRenewalSchema.methods.saveUserRenewalStat = function(user, beneficiary, stat) {
        let renewal = this;
        let UserRenewalStat = renewal.model('UserRenewalStat');

        return UserRenewalStat.find({
            user: user._id,
            renewal: renewal._id
        })
        .exec()
        .then(arr => {
            if (0 === arr.length) {
                let newStat = new UserRenewalStat();
                newStat.user = user._id;
                newStat.renewal = renewal._id;

                return renewal.getRightPromise()
                .then(right => {

                    return right.getType()
                    .then(type => {
                        let typeCache;
                        if (null !== type && undefined !== type) {
                            typeCache = {
                                name: type.name,
                                color: type.color
                            };
                        }

                        newStat.right = {
                            id: right._id,
                            name: right.name,
                            type: typeCache
                        };

                        return newStat;
                    });

                });


            }


            for (let i=1; i<arr.length; i++) {
                arr[i].remove();
            }

            return arr[0];
        })
        .then(newStat => {
            newStat.set(stat);
            newStat.beneficiary = beneficiary._id;
            return beneficiary.getAccountCollection(user)
            .then(accountCollection => {
                if (null !== accountCollection) {
                    newStat.accountCollection = accountCollection._id;
                }
                return newStat.save();
            });
        });
    };



    /**
     * get UserRenewalStat cache stat object from DB
     * @param {User} user
     *
     * @return {Promise} resolve to the saved document or NULL
     */
    rightRenewalSchema.methods.getUserRenewalStat = function(user) {

        let renewal = this;
        let UserRenewalStat = renewal.model('UserRenewalStat');

        return UserRenewalStat.findOne({
            user: user._id,
            renewal: renewal._id
        })
        .exec();
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



        if (undefined === right.timeSavingAccount || 'timesavingaccount' !== right.special) {
            return null;
        }

        if (undefined === right.timeSavingAccount.savingInterval) {
            return null;
        }

        let savingInterval = right.timeSavingAccount.savingInterval;


        if (savingInterval.useDefault) {
            return {
                start: this.start,
                finish: this.finish
            };
        }

        let savingPeriod = {
            start: new Date(this.start),
            finish: new Date(this.finish)
        };

        savingPeriod.start.setFullYear(savingPeriod.start.getFullYear() - savingInterval.min);
        savingPeriod.finish.setFullYear(savingPeriod.finish.getFullYear() - savingInterval.max);

        return savingPeriod;
    };


    /**
     * Get worked days on renewal for one account, use the user workschedule
     * with a cache
     * OR
     * Get worked days on renewal for one account, use the collection custom schedule week
     *
     * @param   {Account}   account
     * @return {Promise}
     */
    rightRenewalSchema.methods.getWorkedDays = function(account) {
        const renewal = this;

        return account.getCollection(renewal.start)
        .then(collection => {

            if (null === collection || collection.useWorkschedule) {
                return account.getPeriodScheduleEvents(renewal.start, renewal.finish)
                .then(ScheduleEra => {
                    return ScheduleEra.getDays();
                });
            }

            const workedDays = collection.getCustomScheduleDays();

            let days = {};
            let loop = new Date(renewal.start);
            loop.setHours(0,0,0,0);

            while (loop.getTime() < renewal.finish.getTime()) {
                if (-1 !== workedDays.indexOf(loop.getDay())) {
                    days[loop.getTime()] = new Date(loop);
                }
                loop.setDate(loop.getDate() + 1);
            }

            return days;
        });
    };



    /**
     * get number of week-end days in the renewal for one user
     *
     * @param   {Account}   account
     * @returns {Promise} Int
     */
    rightRenewalSchema.methods.getWeekEndDays = function(account) {

        const renewal = this;

        return renewal.getWorkedDays(account)
        .then(days => {
            const scheduledDays = Object.keys(days).length;
            return (renewal.getDays() - scheduledDays);
        });
    };



    /**
     * Get number of days in renewal period
     * in classical cases, this will be 365
     *
     * @returns {Number} Integer
     */
    rightRenewalSchema.methods.getDays = function() {

        return (
            1+ (
                Date.UTC(this.finish.getFullYear(), this.finish.getMonth(), this.finish.getDate()) -
                 Date.UTC(this.start.getFullYear(), this.start.getMonth(), this.start.getDate())
            ) / 86400000
        );
    };


    /**
     * Get paid leave quantity
     * get number set in initial quantity on the right with adjustments only
     * if adjusted initial quantity is greater than right quantity
     * -> more annual leaves will lower number of RTT
     *
     * @return {Promise}
     */
    rightRenewalSchema.methods.getPaidLeavesQuantity = function(user) {

        const renewal = this;
        const gt = params.app.utility.gettext;
        const Type = renewal.model('Type');

        return Type.findOne({ _id: '5740adf51cf1a569643cc508'}).exec()
        .then(type => {
            if (null === type) {
                throw new Error(gt.gettext('To compute the number of planned working days, the annual leave type is required'));
            }

            return type.getInitialQuantityInPeriod(user, renewal.start, renewal.finish);
        });
    };





    rightRenewalSchema.methods.getNonWorkingDayQuantity = function(account) {
        const renewal = this;

        const promise = Promise.all([
            account.getNonWorkingDayEvents(renewal.start, renewal.finish),
            renewal.getWorkedDays(account)
        ])
        .then(all => {
            const nonWorkingDays = all[0].getDays();
            const workedDays = all[1];
            // count number of non-working days on working periods
            let count = 0;
            for (let ts in nonWorkingDays) {
                if (workedDays[ts] !== undefined) {
                    count++;
                }
            }

            return count;
        });

        return promise;
    };



    /**
     * Get number of planned working days on the period
     *
     *
     * @exemple 365 - 104 week-ends days - 25 days of annual paid leaves - 8 non working days = 228
     *
     * @param {User} user
     * @return {Promise}
     */
    rightRenewalSchema.methods.getPlannedWorkDayNumber = function(user) {

        const gt = params.app.utility.gettext;
        const renewal = this;

        return user.getAccount().then(account => {

            return Promise.all([
                renewal.getWeekEndDays(account),
                renewal.getNonWorkingDayQuantity(account),
                renewal.getPaidLeavesQuantity(user)
            ]);

        }).then(r => {

            const weekEnds = r[0];
            const nonWorkingDays = r[1];
            const paidLeaves = r[2];


            if (0 === paidLeaves) {
                throw new Error(gt.gettext('To compute the number of planned working days on a year, the annual leave initial quantity is required'));
            }

            const renewalDays = renewal.getDays();

            // Number of days on the renewal period     ~365
            // - Number of weeks-ends days                 ~104
            // - Initial quantity of annual paid leaves ~25
            // - Non working days                         ~11
            // console.log(renewal.start.getFullYear(), renewal.getDays(), weekEnds, paidLeaves, nonWorkingDays);
            return {
                value: (renewalDays - weekEnds - paidLeaves - nonWorkingDays),
                renewalDays: renewalDays,
                weekEnds: weekEnds,
                paidLeaves: paidLeaves,
                nonWorkingDays: nonWorkingDays
            };
        });

    };



    /**
     * Create a new date using day and month of the date in parameter
     * the date must match the renewal period
     *
     * @param {Date} dayMonth
     *
     * @return {Date}
     */
    rightRenewalSchema.methods.createDateFromDayMonth = function(dayMonth) {
        let renewal = this;
        const gt = params.app.utility.gettext;

        let d = new Date(dayMonth);
        d.setFullYear(renewal.start.getFullYear());

        if (d.getTime() < renewal.start.getTime()) {
            d.setFullYear(renewal.finish.getFullYear());
        }

        if (d.getTime() > renewal.finish.getTime()) {
            throw new Error(util.format(gt.gettext('Invalid renewal, the renewal is too short and does not contain the requested date: %s'), d.toString()));
        }

        return d;
    };





    params.db.model('RightRenewal', rightRenewalSchema);



};
