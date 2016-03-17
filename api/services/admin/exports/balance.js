'use strict';


let Gettext = require('node-gettext');
let gt = new Gettext();


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
    const BALANCE           = gt.gettext('Remaining quantity');


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
                 */
                function addRowToData(right, renewal)
                {
                    let row = {};

                    row[NAME]           = users[i].getName();
                    row[DEPARTMENT]     = users[i].department.name;
                    row[RIGHT]          = right.name;
                    row[COLLECTION]     = userAttributes[i][0].name;
                    if (renewal) {
                        row[RENEWAL_START]  = renewal.start;
                        row[RENEWAL_FINISH] = renewal.finish;
                    } else {
                        row[RENEWAL_START]  = '';
                        row[RENEWAL_FINISH] = '';
                    }

                    row[QUANTITY]       = 0;
                    row[CONSUMED]       = 0;
                    row[BALANCE]        = 0;

                    data.push(row);
                }

                let momentRenewalPromises = {};
                let userRenewalsPromises = [];

                // loop 1 to create a list of promised renewals per user

                for (i=0; i<users.length; i++) {

                    if (undefined === momentRenewalPromises[users[i].id]) {
                        momentRenewalPromises[users[i].id] = [];
                    }

                    let rights = userAttributes[i][1];

                    for (j=0; j<rights.length; j++) {
                        momentRenewalPromises[users[i].id].push(rights[j].getMomentRenewal(moment));
                    }

                    userRenewalsPromises.push(Promise.all(momentRenewalPromises[users[i].id]));


                }

                // loop to create rows once renwals are resolved


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
