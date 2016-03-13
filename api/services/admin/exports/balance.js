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

        let findUsers = service.app.db.models.Users.getMomentUsersFind(moment);
        findUsers.where('roles.account').exists();

        findUsers.populate('department');
        findUsers.populate('roles.account');

        let userPromises = [];

        findUsers.exec((err, users) => {
            if (err) {
                return reject(err);
            }


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

            Promise.all(userPromises).then(p => {
                let allCollections = p[0];
                let allRights = p[0];
                let data = [];

                let user;
                let collection;

                function addRowToData(right)
                {
                    let row = {};

                    row[NAME]           = user.getName();
                    row[DEPARTMENT]     = user.department.name;
                    row[RIGHT]          = right.name;
                    row[COLLECTION]     = collection.name;
                    row[RENEWAL_START]  = 0;
                    row[RENEWAL_FINISH] = 0;
                    row[QUANTITY]       = 0;
                    row[CONSUMED]       = 0;
                    row[BALANCE]        = 0;

                    data.push(row);
                }


                for (let i=0; i<users.length; i++) {

                    user = users[i];
                    collection = allCollections[i];
                    let rights = allRights[i];

                    rights.forEach(addRowToData);
                }

                resolve(data);
            });

        });
    });
};
