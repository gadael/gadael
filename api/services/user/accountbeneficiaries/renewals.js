'use strict';


exports = module.exports = function(user, account) {



    /**
     * Get the promise for the stat object
     * @param   {Right} right
     * @param   {RightRenewal} renewal
     * @returns {Promise} resolve to an object
     */
    function getRenewalStat(rightDocument, renewal) {

        if (account.arrival > renewal.finish) {
            return null;
        }


        return renewal.getUserRenewalStat(user);


        // same with no cache:
        //return renewal.getUserQuantityStats(user);
    }




    /**
     * add renewals into the right object
     * @param {Right} rightDocument
     * @param {object} beneficiary      The object will be modified
     * @param {Array} renewals
     * @param {Date} moment
     * @returns {Promise}               Resolve to
     */
    function processRenewals(rightDocument, beneficiary, renewals, moment)
    {

        beneficiary.renewals = [];
        beneficiary.daysRatio = 1;
        beneficiary.errors = [];
        beneficiary.initial_quantity = 0;
        beneficiary.consumed_quantity = 0;
        beneficiary.available_quantity = 0;
        beneficiary.waiting_quantity = {
            created: 0,
            deleted: 0
        };

        /**
         * Test if the renewal is accounted in beneficiary total
         */
        function inTotal(renewal) {
            return (renewal.start <= moment && renewal.finish >= moment);
        }

        function setRenewal(renewalDocument, stat) {

            let renewalObj = renewalDocument.toObject();
            renewalObj.initial_quantity = stat.initial;
            renewalObj.consumed_quantity = stat.consumed;
            renewalObj.available_quantity = stat.available;
            renewalObj.daysRatio = stat.daysratio;

            renewalObj.waiting_quantity = {
                created: stat.waiting.created,
                deleted: stat.waiting.deleted,
                created_dispUnit: rightDocument.getDispUnit(stat.waiting.created),
                deleted_dispUnit: rightDocument.getDispUnit(stat.waiting.deleted)
            };

            renewalObj.initial_quantity_dispUnit = rightDocument.getDispUnit(renewalObj.initial_quantity);
            renewalObj.consumed_quantity_dispUnit = rightDocument.getDispUnit(renewalObj.consumed_quantity);
            renewalObj.available_quantity_dispUnit = rightDocument.getDispUnit(renewalObj.available_quantity);

            renewalObj.rtt = stat.rtt;

            beneficiary.renewals.push(renewalObj);

            if (inTotal(renewalDocument)) {
                beneficiary.initial_quantity += stat.initial;
                beneficiary.consumed_quantity += stat.consumed;
                beneficiary.available_quantity += stat.available;
                beneficiary.waiting_quantity.created += stat.waiting.created;
                beneficiary.waiting_quantity.deleted += stat.waiting.deleted;

                if (stat.daysratio && (!beneficiary.daysRatio || renewalObj.finish > new Date())) {
                    beneficiary.daysRatio = stat.daysratio;
                }
            }

            return renewalDocument;
        }

        function setUnits(rightDocument) {
            beneficiary.right.quantity_dispUnit = rightDocument.getDispUnit(beneficiary.right.quantity);
            beneficiary.initial_quantity_dispUnit = rightDocument.getDispUnit(beneficiary.initial_quantity);
            beneficiary.consumed_quantity_dispUnit = rightDocument.getDispUnit(beneficiary.consumed_quantity);
            beneficiary.available_quantity_dispUnit = rightDocument.getDispUnit(beneficiary.available_quantity);
            beneficiary.waiting_quantity.created_dispUnit = rightDocument.getDispUnit(beneficiary.waiting_quantity.created);
            beneficiary.waiting_quantity.deleted_dispUnit = rightDocument.getDispUnit(beneficiary.waiting_quantity.deleted);

        }


        let promises = renewals
        .map(renewalDocument => {
            renewalDocument.setRightForPromise(rightDocument);
            return getRenewalStat(rightDocument, renewalDocument);
        })
        .filter(promise => {
            return null !== promise;
        });



        return Promise.all(promises)
        .then(stats => {
            for (let i=0; i<renewals.length; i++) {
                let renewalDocument = renewals[i];
                let stat = stats[i];

                if (null === stat) {
                    continue;
                }

                if (stat.error) {
                    // this is for the cached version, error message is in database
                    beneficiary.errors.push({
                        renewal: renewalDocument,
                        error: stat.error
                    });
                }

                setRenewal(renewalDocument, stat);
            }
            setUnits(rightDocument);

            function sortRenewals(r1, r2) {

                if (r1.start.getTime() < r2.start.getTime()) {
                    return -1;
                }

                if (r1.start.getTime() > r2.start.getTime()) {
                    return 1;
                }

                return 0;
            }

            function sortErrors(e1, e2) {
                return sortRenewals(e1.renewal, e2.renewal);
            }

            beneficiary.renewals.sort(sortRenewals);
            beneficiary.errors.sort(sortErrors);

            return beneficiary;
        })
        .catch(err => {
            // if one renewal fail, we will have an error on the beneficiary object
            beneficiary.errors.push({
                renewal: err.renewal,
                error: err.message
            });
            return beneficiary;
        });

    }


    return processRenewals;
};
