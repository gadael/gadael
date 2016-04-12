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

    return right.save();
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

            api.createRight().then(right => {

                let beneficiary = new beneficiaryModel();
                beneficiary.right = right._id;
                beneficiary.ref = 'Collection';
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
 */
api.addTestRight = function(app, user) {

};
