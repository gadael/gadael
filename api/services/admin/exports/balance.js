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
                let i;

                function addRowToData(right)
                {
                    let row = {};

                    row[NAME]           = users[i].getName();
                    row[DEPARTMENT]     = users[i].department.name;
                    row[RIGHT]          = right.name;
                    row[COLLECTION]     = userAttributes[i][0].name;
                    row[RENEWAL_START]  = 0;
                    row[RENEWAL_FINISH] = 0;
                    row[QUANTITY]       = 0;
                    row[CONSUMED]       = 0;
                    row[BALANCE]        = 0;

                    data.push(row);
                }


                for (i=0; i<users.length; i++) {
                    userAttributes[i][1].forEach(addRowToData);
                }

                resolve(data);
            })
            .catch(reject);

        });
    });
};
