'use strict';

/**
 * convert overtimes quantity to a right or just settle quantity with a comment
 * @param {apiService} service
 * @param {Object} params
 */
function convertOvertimeQuantity(service, params) {
    const gt = service.app.utility.gettext;
    const AccountModel = service.app.db.models.Account;
    const OvertimeModel = service.app.db.models.Overtime;
    const OvertimeSettlementModel = service.app.db.models.OvertimeSettlement;

    if (service.needRequiredFields(params, ['userCreated', 'user.id', 'quantity', 'comment'])) {
        return;
    }

    AccountModel.findOne()
    .where('user.id', params['user.id'])
    .then(account => {
        if (!account) {
            throw new Error('Account not found');
        }

        return OvertimeModel.find()
        .where('settled', false)
        .sort({ 'timeCreated': 1 })
        .then(overtimes => {
            if (undefined === account.overtimeConversions) {
                account.overtimeConversions = [];
            }

            const settlement = new OvertimeSettlementModel();

            if (undefined !== params['right.name']) {
                settlement.right = {
                    name: params['right.name']
                };
            }

            settlement.comment = params.comment;
            settlement.quantity = params.quantity;
            settlement.userCreated = {
                id: params.userCreated._id,
                name: params.userCreated.getName()
            };

            return settlement.createRecoveryRight()
            .then(settlement => {
                let remainQuantity = params.quantity;
                const documentsToSave = [];
                overtimes.forEach(overtime => {
                    if (remainQuantity <= 0) {
                        return;
                    }
                    if (overtime.quantity < remainQuantity) {
                        remainQuantity -= overtime.quantity;
                        overtime.settledQuantity = overtime.quantity;
                        overtime.settled = true;
                    } else {
                        overtime.settledQuantity = remainQuantity;
                        remainQuantity = 0;
                    }
                    overtime.settlements = [settlement];
                    documentsToSave.push(overtime);
                });

                if (remainQuantity > 0) {
                    throw new Error(gt.gettext('Not enough overtime quantity'));
                }

                account.overtimeConversions.push(settlement);
                documentsToSave.push(account);
                return Promise.all(documentsToSave.map(doc => doc.save()));
            });
        });
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
