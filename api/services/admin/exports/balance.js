'use strict';



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

    const gt = service.app.utility.gettext;

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


    if (!moment || 'undefined' === moment) {
        return Promise.reject(new Error('missing moment parameter'));
    }

    moment = new Date(moment);

    let findUsers = service.app.db.models.User.getMomentUsersFind(moment);
    findUsers.where('roles.account').exists();

    findUsers.populate('department');
    findUsers.populate('roles.account');



    return findUsers.exec()
    .then(users => {
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

        return Promise.all(userPromises)
        .then(userAttributes => {

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
                    row[QUANTITY]       = 0.0;
                    row[CONSUMED]       = 0.0;
                    row[WAITING]        = 0.0;
                    row[BALANCE]        = 0.0;
                    row[WAITDEL]        = 0.0;

                    return Promise.resolve(0);
                }

                return Promise.all([
                    renewal.getUserQuantity(user, moment),
                    renewal.getUserConsumedQuantity(user, moment)
                ])
                .catch(() => {
                    return null;
                })
                .then(all => {

                    if (null === all) {
                        // error on this right, ignore
                        row[QUANTITY]       = 0.0;
                        row[CONSUMED]       = 0.0;
                        row[WAITING]        = 0.0;
                        row[BALANCE]        = 0.0;
                        row[WAITDEL]        = 0.0;
                        data.push(row);
                        return 0;
                    }

                    let requests = all[1];

                    row[QUANTITY]       = all[0].value;
                    row[CONSUMED]       = requests.consumed;
                    row[WAITING]        = requests.waiting.created;
                    row[BALANCE]        = (row[QUANTITY] - row[CONSUMED] - requests.waiting.created);
                    row[WAITDEL]        = requests.waiting.deleted;

                    data.push(row);

                    return 0;
                });
            }


            let userRenewalsPromises = getUserRenewalsPromises(users, userAttributes, moment);


            // loop to create rows once renewals are resolved
            return Promise.all(userRenewalsPromises)
            .then(usersRenewals => {

                let rowPromises = [];
                for (i=0; i<users.length; i++) {
                    let rights = userAttributes[i][1];
                    for(j=0; j<rights.length; j++) {
                        rowPromises.push(
                            addRowToData(rights[j], usersRenewals[i][j])
                        );
                    }
                }

                return Promise.all(rowPromises);

            }).then(() => {
                return data;
            });
        });
    });

};
