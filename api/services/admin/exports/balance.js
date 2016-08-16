'use strict';


const gt = require('./../../../../modules/gettext');



/**
 * Get a two level promises list for right renewals
 * level 1: users
 * level 2: rights
 *
 * @param {Array} users
 * @param {Array} userAttributes    rights and collection for each users
 * @param {Date}  moment
 *
 * @return {Array}
 */
function getUserRenewalsPromises(users, userAttributes, moment) {

    let i, j;
    let userRenewalsPromises = [];

    for (i=0; i<users.length; i++) {

        let userPromises = [];
        let rights = userAttributes[i][1];

        for (j=0; j<rights.length; j++) {
            userPromises.push(rights[j].getMomentRenewal(moment));
        }

        userRenewalsPromises.push(Promise.all(userPromises));
    }

    return userRenewalsPromises;
}





/**
 * Export leave rights on a date
 * @param {apiService} service
 * @param {Date}       moment
 * @return {Promise}           Promised data is the array compatible with xlsx-writestream
 */
exports = module.exports = function(service, moment) {



    const NAME              = gt.gettext('Name');
    const DEPARTMENT        = gt.gettext('Department');
    const RIGHT             = gt.gettext('Right');
    const COLLECTION        = gt.gettext('Collection');
    const RENEWAL_START     = gt.gettext('Renewal start');
    const RENEWAL_FINISH    = gt.gettext('Renewal finish');
    const QUANTITY          = gt.gettext('Quantity'); // initial quantity with adjustments
    const CONSUMED          = gt.gettext('Consumed quantity');
    const WAITING           = gt.gettext('Waiting quantity');
    const BALANCE           = gt.gettext('Remaining quantity');
    const WAITDEL           = gt.gettext('Pending delete');


    return new Promise((resolve, reject) => {

        if (!moment || 'undefined' === moment) {
            return reject('missing moment parameter');
        }

        moment = new Date(moment);

        let findUsers = service.app.db.models.User.getMomentUsersFind(moment);
        findUsers.where('roles.account').exists();

        findUsers.populate('department');
        findUsers.populate('roles.account');



        findUsers.exec((err, users) => {
            if (err) {
                return reject(err);
            }

            let userPromises = [];

            users.forEach(user => {
                let account = user.roles.account;

                // TODO: getRights use getCollection to get rights
                // this can be rewritten to use the same query for both
                let collectionPromise = account.getCollection(moment);
                let rightsPromise = account.getRights(moment);

                userPromises.push(
                    Promise.all([collectionPromise, rightsPromise])
                );
            });


            // build rows

            Promise.all(userPromises).then(userAttributes => {

                let data = [];
                let i, j;


                /**
                 * Add one row
                 * @param {Model} right   Right for row, mandatory
                 * @param {Model} renewal Active renewal on moment date if exists
                 *
                 * @return {Promise}
                 */
                function addRowToData(right, renewal)
                {
                    let row = {};

                    let user = users[i];

                    row[NAME]           = user.getName();
                    row[DEPARTMENT]     = user.getDepartmentName();
                    row[RIGHT]          = right.name;
                    row[COLLECTION]     = userAttributes[i][0].name;
                    if (renewal) {
                        row[RENEWAL_START]  = renewal.start;
                        row[RENEWAL_FINISH] = renewal.finish;
                    } else {
                        row[RENEWAL_START]  = '';
                        row[RENEWAL_FINISH] = '';
                    }

                    return Promise.all([
                        renewal.getUserQuantity(user, moment),
                        renewal.getUserConsumedQuantity(user, moment),
                        renewal.getUserWaitingQuantity(user, moment)
                    ])
                    .then(all => {

                        let waiting = all[2];

                        row[QUANTITY]       = all[0];
                        row[CONSUMED]       = all[1];
                        row[WAITING]        = waiting.created;
                        row[BALANCE]        = (row[QUANTITY] - row[CONSUMED] - waiting.created);
                        row[WAITDEL]        = waiting.deleted;

                        data.push(row);
                    });
                }


                let userRenewalsPromises = getUserRenewalsPromises(users, userAttributes, moment);


                // loop to create rows once renewals are resolved
                Promise.all(userRenewalsPromises).then(usersRenewals => {

                    for (i=0; i<users.length; i++) {
                        let rights = userAttributes[i][1];
                        for(j=0; j<rights.length; j++) {
                            addRowToData(rights[j], usersRenewals[i][j]);
                        }
                    }

                    resolve(data);
                }).catch(reject);





            })
            .catch(reject);

        });
    });
};
