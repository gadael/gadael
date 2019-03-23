'use strict';

var api = {};
exports = module.exports = api;



/**
 * Create a random right with renewal from 2016,0,1
 * @param {Express} app
 * @param {object} props
 * @returns {Promise}
 */
api.createRight = function(app, props) {
    let rightModel = app.db.models.Right;
    let right = new rightModel();

    if (undefined !== props) {
        right.set(props);
    }

    if (!right.name) {
        right.name = 'Test right';
    }

    if (!right.quantity) {
        right.quantity = 10;
    }

    if (!right.quantity_unit) {
        right.quantity_unit = 'D';
    }

    if (undefined === right.addMonthly.quantity) {
        right.addMonthly = {
            quantity: null
        };
    }


    return right.save()
    .then(right => {
        return api.createRenewal(app, right)
        .then(() => {
            return right;
        });
    });
};


/**
 * Create a renwal for the year 2016
 * @param   {Express} app
 * @param   {Right}   right
 * @returns {Promise}
 */
api.createRenewal = function(app, right) {
    let rightRenewalModel = app.db.models.RightRenewal;
    let renewal = new rightRenewalModel();

    renewal.right = right._id;
    renewal.start = new Date(2016,0,1,0,0,0,0);
    renewal.finish = new Date(renewal.start);
    renewal.finish.setFullYear(renewal.finish.getFullYear()+1);

    return renewal.save();
};


/**
 * create collection with one right
 * @param   {Express} app
 * @param   {object}  props Collection properties
 * @returns {Promise} Beneficiary
 */
api.createCollection = function(app, collectionProps, rightProps) {

    let collectionModel = app.db.models.RightCollection;

    let collection = new collectionModel();

    if (undefined !== collectionProps) {
        collection.set(collectionProps);
    }

    if (!collection.name) {
        collection.name = 'Test';
    }


    return collection.save()
    .then(collection => {

        return api.createRight(app, rightProps)
        .then(right => {
            return right.addCollectionBeneficiary(collection);
        })
        .then(() => {
            return collection;
        });

    });

};


api.linkToDefaultCollection = function(app, right) {

    let beneficiaryModel = app.db.models.Beneficiary;

    let beneficiary = new beneficiaryModel();
    beneficiary.right = right._id;
    beneficiary.ref = 'RightCollection';
    beneficiary.document = '5740adf51cf1a569643cc520';

    return beneficiary.save();

};



/**
 * Add a test right to the user
 * @param {Express} app
 * @param {User}    user        Account
 * @param {Object}  collection  Collection properties
 * @param {Object}  right       Right properties
 * @return {Promise} collection
 */
api.addTestRight = function(app, user, collection, right) {
    let accountCollectionModel = app.db.models.AccountCollection;
    let start = new Date(2000,0,1,0,0,0,0);

    return api.createCollection(app, collection, right)
    .then(collection => {
        let ac = new accountCollectionModel();
        ac.rightCollection = collection._id;
        ac.from = start;
        ac.account = user.roles.account;

        ac.save()
        .then(() => {
            return collection;
        });
    });
};
