'use strict';

var api = {};
exports = module.exports = api;



/**
 * Create a random right
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

    return new Promise((resolve, reject) => {
        right.save().then(right => {
            api.createRenewal(app, right).then(() => {
                resolve(right);
            }).catch(reject);
        }).catch(reject);
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


    return new Promise((resolve, reject) => {

        let collectionModel = app.db.models.RightCollection;
        let beneficiaryModel = app.db.models.Beneficiary;

        let collection = new collectionModel();

        if (undefined !== collectionProps) {
            collection.set(collectionProps);
        }

        if (!collection.name) {
            collection.name = 'Test';
        }


        collection.save().then(collection => {

            api.createRight(app, rightProps).then(right => {

                let beneficiary = new beneficiaryModel();
                beneficiary.right = right._id;
                beneficiary.ref = 'RightCollection';
                beneficiary.document = collection._id;

                beneficiary.save().then(() => {
                    resolve(collection);
                }).catch(reject);

            }).catch(reject);

        }).catch(reject);

    });
};


/**
 * Add a test right to the user
 * @param {Express} app
 * @param {User}    user        Account
 * @param {Object}  collection  Collection properties
 * @return {Promise} collection
 */
api.addTestRight = function(app, user, collection, right) {


    return new Promise((resolve, reject) => {

        let accountCollectionModel = app.db.models.AccountCollection;
        let start = new Date(2000,0,1,0,0,0,0);

        api.createCollection(app, collection, right).then(collection => {
            let ac = new accountCollectionModel();
            ac.rightCollection = collection._id;
            ac.from = start;
            ac.account = user.roles.account;

            ac.save().then(() => {
                resolve(collection);
            }).catch(reject);
        }).catch(reject);

    });
};

