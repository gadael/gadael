'use strict';

/**
 * Create recovery right from request
 * Return the overtime conversion to save in account
 * @parma {Right} RightModel
 * @param {string} userId
 * @param {OvertimeSettlement} settlement
 * @param {Date} startDate
 * @return {Promise}
 */
function createRecoveryRight(RightModel, userId, settlement, startDate) {

    /**
     * @param {apiService   service
     * @param {Object} wrParams
     * @return {Promise}
     */
    function createRight()
    {
        const right = new RightModel();
        right.name = settlement.right.name;
        right.type = '5740adf51cf1a569643cc50a';
        right.quantity = settlement.quantity;
        right.quantity_unit = 'H';
        right.rules = [{
            title: 'Active for request dates in the renewal period',
            type: 'request_period'
        }];

        return right.save();
    }

    if (undefined === settlement.right) {
        return Promise.resolve(settlement);
    }

    return createRight()
    .then(right => {
        if (null === right) {
            return settlement;
        }
        settlement.right.id = right._id;
        return right.createOvertimeConversionRenewal({ start: startDate })
        .then(renewal => {
            if (undefined === renewal._id) {
                throw new Error('The new renewal ID is required');
            }
            settlement.right.renewal.id = renewal._id;
            settlement.right.renewal.start = renewal.start;
            settlement.right.renewal.finish = renewal.finish;

            right.addUserBeneficiary(userId);

            return settlement;
        });
    });
}

/**
 * convert overtimes quantity to a right or just settle quantity with a comment
 * @param {apiService} service
 * @param {Object} params
 */
function convertOvertimeQuantity(service, params) {
    const gt = service.app.utility.gettext;
    const AccountModel = service.app.db.models.Account;
    const OvertimeModel = service.app.db.models.Overtime;
    const RightModel = service.app.db.models.Right;

    if (service.needRequiredFields(params, ['userCreated', 'user', 'quantity'])) {
        return;
    }

    const userId = params.user.id ? params.user.id : params.user;

    AccountModel.findOne()
    .where('user.id', userId)
    .then(account => {
        if (!account) {
            throw new Error('Account not found');
        }

        return OvertimeModel.find()
        .where('settled', false)
        .where('user.id', userId)
        .sort({ 'day': 1 })
        .then(overtimes => {
            if (undefined === account.overtimeConversions) {
                account.overtimeConversions = [];
            }

            const settlement = {};

            if (undefined !== params.right && undefined !== params.right.name) {
                settlement.right = {
                    name: params.right.name,
                    renewal: {}
                };
            }

            settlement.comment = params.comment;
            settlement.quantity = params.quantity;
            settlement.userCreated = {
                id: params.userCreated._id,
                name: params.userCreated.getName()
            };

            function updateSettlementWithRight() {
                if (!settlement.right) {
                    return Promise.resolve(settlement);
                }
                return createRecoveryRight(RightModel, userId, settlement, params.right.startDate || new Date());
            }

            updateSettlementWithRight(settlement)
            .then(settlement => {
                let remainQuantity = params.quantity;
                const documentsToSave = [];
                overtimes.forEach(overtime => {
                    if (remainQuantity <= 0) {
                        return;
                    }
                    if (undefined === overtime.settledQuantity) {
                        overtime.settledQuantity = 0;
                    }
                    if (undefined === overtime.settlements) {
                        overtime.settlements = [];
                    }

                    if (overtime.quantity < remainQuantity) {
                        remainQuantity -= overtime.quantity;
                        overtime.settledQuantity = overtime.quantity;
                        overtime.settled = true;
                    } else {
                        overtime.settledQuantity += remainQuantity;
                        remainQuantity = 0;
                    }
                    overtime.settlements.push(settlement);
                    documentsToSave.push(overtime);
                });

                if (remainQuantity > 0) {
                    throw new Error(gt.gettext('Not enough overtime quantity'));
                }

                account.overtimeSettlements.push(settlement);
                documentsToSave.push(account);
                return Promise.all(documentsToSave.map(doc => doc.save()));
            });
        });
    })
    .then(() => {
        service.resolveSuccess(
            params,
            gt.gettext('Overtime quantity has been settled')
        );
    })
    .catch(service.error);
}

/**
 * Construct the overtimesummary save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {
    const service = new services.save(app);

    /**
     * Call the lunch refresh month service
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        convertOvertimeQuantity(service, params);
        return service.deferred.promise;
    };

    return service;
};
