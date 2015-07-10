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

        var Q = require('q');
        var deferred = Q.defer();

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
    accountSchema.methods.setCollection = function(rightCollection, from, to) {

        var account = this;

        var model = this.model('AccountCollection');

        var rightCollectionId = rightCollection;

        if (rightCollection._id !== undefined) {
            rightCollectionId = rightCollection._id;
        }

        var accountCollection = new model();
        accountCollection.account = this._id;
        accountCollection.rightCollection = rightCollectionId;
        accountCollection.from = from;
        accountCollection.to = to;
        return accountCollection.save();
    };







    /**
     * Get the schedule calendar for a specific date
     * @return {Promise} resolve to a calendar document or null
     */
    accountSchema.methods.getScheduleCalendar = function(moment) {

        var Q = require('q');
        var deferred = Q.defer();
        var account = this;

        moment.setHours(0,0,0,0);
        
        account.getAccountScheduleCalendarQuery()
            .where('from').lte(moment)
            .where('to').gte(moment)
            .populate('calendar')
            .exec(function(err, arr) {

                if (err) {
                    deferred.reject(err);
                    return;
                }
            
                if (!arr || 0 === arr.length) {
                    
                    account.getAccountScheduleCalendarQuery()
                        .where('from').lte(moment)
                        .where('to').equals(null)
                        .populate('calendar')
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
        
        var deferred = require('q').defer();
        
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

            account.model('Beneficiary')
            .where('document').in(userDocuments)
            .populate('right')
            .populate('right.type')
            .exec(deferred.makeNodeResolver());
            
        }).catch(deferred.reject);
        
        return deferred.promise;
    };
    
    /**
     * 
     * @param {Date} moment  optional date parameter
     * @return {Promise} resolve to an array of rights
     */
    accountSchema.methods.getRights = function(moment) {

        var deferred = require('q').defer();
        
        this.getRightBeneficiaries(moment).then(function(beneficiaries) {
            var rights = [];
            
            for(var i=0; i< beneficiaries.length; i++) {
                rights.push(beneficiaries[i].right);
            }
            
            deferred.resolve(rights);
        }).catch(deferred.reject);
        
        return deferred.promise;
    };
    


    /**
     * Get the accountRight object
     * @param {RightRenewal} renewal
     * @return {accountRight}
     */
    accountSchema.methods.getAccountRight = function(renewal) {
        var accountRight = require('../modules/accountright');

        return new accountRight(this, renewal);
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


    params.db.model('Account', accountSchema);
};
