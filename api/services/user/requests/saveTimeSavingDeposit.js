'use strict';

var Q = require('q');

/**
 * @throws Error
 * @param {Object}  wrParams        Worperiod recover request parmeters from post|put request
 */
function testRequired(wrParams)
{
    if (undefined === wrParams.quantity || wrParams.quantity <= 0) {
        throw new Error('The quantity parameter must be positive number');
    }

    if (undefined === wrParams.from) {
        throw new Error('The from parameter is mandatory');
    }

    if (undefined === wrParams.to) {
        throw new Error('The to parameter is mandatory');
    }

    if (undefined === wrParams.from.renewal) {
        throw new Error('The from.renewal parameter is mandatory');
    }

    if (undefined === wrParams.to.renewal) {
        throw new Error('The to.renewal parameter is mandatory');
    }

    return true;
}





/**
 * Get object to set into request.workperiod_recover on save
 *
 * @param {apiService}  service
 * @param {Object}      wrParams        Worperiod recover request parmeters from post|put request
 *
 *
 * @return {Promise}
 */
function getFieldsToSet(service, wrParams)
{

    var deferred = Q.defer();
    var async = require('async');

    try {
        testRequired(wrParams);
    } catch (e) {
        deferred.reject(e.message);
        return deferred.promise;
    }


    var refTemplate = {
        right: null,
        name: null,

        renewal: {
            id: null,
            start: null,
            finish: null
        },

        setRenewal: function(renewal) {
            this.renewal.id = renewal.id;
            this.renewal.start = renewal.start;
            this.renewal.finish = renewal.finish;

            this.right = renewal.right.id;
            this.name = renewal.right.name;
        }
    };

    var from = {};
    from.prototype = refTemplate;

    var to = {};
    to.prototype = refTemplate;

    var fieldsToSet = {
        from: from,
        to: to
    };


    var renewalModel = service.app.db.models.rightRenewal;


    /**
     * Parallel task from "from" and "to"
     * @param {Object} target
     * @param {String} id           posted parameter
     * @param {Function} cb         Callback
     */
    function setFromRenewalId(target, id, cb) {
        var query = renewalModel.findOne({ _id: id });
        query.populate('right');

        query.exec(function(err, renewal) {
            if (err) {
                return cb(err);
            }

            target.setRenewal(renewal);
            cb();
        });
    }


    // the real quantity from the list of events, must be in the quantity unit of the recover quantity
    fieldsToSet.quantity = wrParams.quantity;


    async.parallel([
        function(cb) {
            setFromRenewalId(fieldsToSet.from, fieldsToSet.from.renewal, cb);
        },
        function(cb) {
            setFromRenewalId(fieldsToSet.to, fieldsToSet.to.renewal, cb);
        }
    ], function(err) {
        if (err) {
            return deferred.reject(err);
        }

        deferred.resolve(fieldsToSet);
    });


    return deferred.promise;

}




exports = module.exports = {
    getFieldsToSet: getFieldsToSet
};
