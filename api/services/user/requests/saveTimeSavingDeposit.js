'use strict';

const async = require('async');

/**
 * @throws Error
 * @param {Object}  tsdParams        Worperiod recover request parmeters from post|put request
 */
function testRequired(tsdParams)
{
    if (undefined === tsdParams.quantity || tsdParams.quantity <= 0) {
        throw new Error('The quantity parameter must be positive number');
    }

    if (undefined === tsdParams.from) {
        throw new Error('The from parameter is mandatory');
    }

    if (undefined === tsdParams.to) {
        throw new Error('The to parameter is mandatory');
    }

    if (undefined === tsdParams.from.renewal) {
        throw new Error('The from.renewal parameter is mandatory');
    }

    if (undefined === tsdParams.to.renewal) {
        throw new Error('The to.renewal parameter is mandatory');
    }

    return true;
}





/**
 * Get object to set into request.workperiod_recover on save
 *
 * @param {apiService}  service
 * @param {Object}      tsdParams        Worperiod recover request parmeters from post|put request
 *
 *
 * @return {Promise}
 */
function getFieldsToSet(service, tsdParams)
{

    try {
        testRequired(tsdParams);
    } catch (e) {
        return Promise.reject(e);
    }

    function setRenewal(obj, renewal) {

        if (tsdParams.quantity_unit !== renewal.right.quantity_unit) {
            throw new Error('Quantity unit missmatch');
        }

        obj.renewal.id = renewal._id;
        obj.renewal.start = renewal.start;
        obj.renewal.finish = renewal.finish;

        obj.right = renewal.right.id;
        obj.name = renewal.right.name;
    }

    var from = {
        right: null,
        name: null,
        renewal: {
            id: null,
            start: null,
            finish: null
        }
    };

    var to = {
        right: null,
        name: null,
        renewal: {
            id: null,
            start: null,
            finish: null
        }
    };

    var fieldsToSet = {
        from: from,
        to: to
    };

    let renewalModel = service.app.db.models.RightRenewal;


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

            setRenewal(target, renewal);
            cb();
        });
    }


    // the real quantity from the list of events, must be in the quantity unit of the recover quantity
    fieldsToSet.quantity = tsdParams.quantity;
    fieldsToSet.quantity_unit = tsdParams.quantity_unit;

    return new Promise((resolve, reject) => {
        async.parallel([
            function(cb) {
                setFromRenewalId(fieldsToSet.from, tsdParams.from.renewal._id, cb);
            },
            function(cb) {
                setFromRenewalId(fieldsToSet.to, tsdParams.to.renewal._id, cb);
            }
        ], function(err) {
            if (err) {
                return reject(err);
            }

            resolve(fieldsToSet);
        });
    });



}




exports = module.exports = {
    getFieldsToSet: getFieldsToSet
};
