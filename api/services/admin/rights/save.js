'use strict';




/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['name'])) {
        return;
    }


    saveRight(service, params);
}





/**
 * Prepare the document to save
 * @param   {apiService} service     Save service
 * @param   {object}     params      Put or Posted parameters
 * @param   {object}     fieldsToSet
 * @returns {Promise}    Resolve ro a right document, saved or not
 */
function prepareDocument(service, params, fieldsToSet) {

    let RightModel = service.app.db.models.Right;

    if (params.id)
    {
        let postedRules = [];
        let postedRulesId = [];
        let newRules = [];

        params.rules.forEach(function(rule) {
            if (undefined !== rule._id) {
                postedRules.push(rule);
                postedRulesId.push(rule._id);
            } else {
                newRules.push(rule);
            }
        });

        return RightModel.findById(params.id).exec()
        .then(document => {

            document.set(fieldsToSet);

            postedRules.forEach(function(existingRule) {
                document.rules.id(existingRule._id).set(existingRule);
            });

            document.rules.forEach(function(rule, position) {
                if (-1 === postedRulesId.indexOf(rule.id)) {
                    document.rules[position].remove();
                }
            });

            newRules.forEach(function(newRule) {
                document.rules.push(newRule);
            });

            return document;
        });

    }




    if (undefined === params.rules) {
        fieldsToSet.rules = params.rules;
    }

    let right = new RightModel();
    right.set(fieldsToSet);

    return Promise.resolve(right);


}







/**
 * Update/create the vacation right document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveRight(service, params) {
    const gt = service.app.utility.gettext;
    const postpone = service.app.utility.postpone;

    let type;
    if (undefined !== params.type) {
        type = params.type;
        if (undefined !== params.type._id) {
            type = params.type._id;
        }
    }

    let fieldsToSet = {
        name: params.name,
        description: params.description,
        type: type,
        require_approval: params.require_approval,
        activeFor: params.activeFor,
        hide: params.hide,
        rules: params.rules,
        addMonthly: params.addMonthly,
        autoAdjustment: params.autoAdjustment,
        timeSaving: params.timeSaving,
        timeSavingAccount: params.timeSavingAccount,
        sortkey: params.sortkey,
        quantity_unit: params.quantity_unit || 'D',
        quantity: params.quantity,
        defaultAbsenceLength: params.defaultAbsenceLength,
        special: params.special,
        consumption: params.consumption,
        consumptionBusinessDaysLimit: params.consumptionBusinessDaysLimit,
        activeSpan: params.activeSpan,
        halfDays: params.halfDays,
        lunch: params.lunch
    };

    if (undefined !== fieldsToSet.addMonthly && undefined !== fieldsToSet.addMonthly.quantity && 0 >= fieldsToSet.addMonthly.quantity) {
        // this field is hidden anyway
        fieldsToSet.addMonthly.max = null;
    }

    if (undefined !== params.rules) {
        // force unit
        for (let i=0; i<params.rules.length; i++) {

            if (undefined === params.rules[i].interval) {
                params.rules[i].interval = {};
            }

            switch (params.rules[i].type) {
                case 'seniority':
                case 'age':
                    params.rules[i].interval.unit = 'Y';
                    break;
            }
        }
    }


    let message;

    prepareDocument(service, params, fieldsToSet)
    .then(right => {

        if (right.isNew) {
            message = gt.gettext('The vacation right has been created');
        } else {
            message = gt.gettext('The vacation right has been modified');
        }

        return right.save();
    })
    .then(savedRight => {
        return postpone(savedRight.updateUsersStat.bind(savedRight))
        .then(() => savedRight);
    })
    .then(savedRight => {
        service.resolveSuccessGet(savedRight._id, message);
    })
    .catch(service.error);
}










/**
 * Construct the right save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the right save service
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};
