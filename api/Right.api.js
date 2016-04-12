'use strict';

var api = {};
exports = module.exports = api;



/**
 * Create a random right
 * @returns {Promise}
 */
api.createRight = function(app) {
    let rightModel = app.db.models.Right;
    let right = new rightModel();

    right.name = 'Test right';
    right.quantity = 10;
    right.quantity_unit = 'D';
    right.addMonthly = {
        quantity: null
    };

    return new Promise((resolve, reject) => {
        right.save().then(right => {
            api.createRenewal(app, right).then(renewal => {
                resolve(right);
            }).catch(reject);
        }).catch(reject);
    });
};


api.createRenewal = function(app, right) {
    let rightRenewalModel = app.db.models.RightRenewal;
    let renewal = new rightRenewalModel();

    renewal.right = right._id;
    renewal.start = new Date();
    renewal.start.setHours(0,0,0,0);
    renewal.finish = new Date(renewal.start);
    renewal.finish.setFullYear(renewal.finish.getFullYear()+1);

    return renewal.save();
};


/**
 * create collection with random right
 * @param   {object}   app [[Description]]
 * @returns {Promise} Beneficiary
 */
api.createCollection = function(app) {


    return new Promise((resolve, reject) => {

        let collectionModel = app.db.models.RightCollection;
        let beneficiaryModel = app.db.models.Beneficiary;

        let collection = new collectionModel();

        collection.name = 'Test';



        collection.save().then(collection => {

            api.createRight(app).then(right => {

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
 * @param {User} user account
 * @return {Promise} collection
 */
api.addTestRight = function(app, user) {



    return new Promise((resolve, reject) => {

        let accountCollectionModel = app.db.models.AccountCollection;
        let start = new Date();
        start.setHours(0,0,0,0);

        api.createCollection(app).then(collection => {
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
