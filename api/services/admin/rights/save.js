'use strict';

const gt = require('./../../../../modules/gettext');



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
 * Update/create the vacation right document
 * 
 * @param {apiService} service
 * @param {Object} params
 */  
function saveRight(service, params) {

    
    var RightModel = service.app.db.models.Right;
    

    var type;
    if (undefined !== params.type) {
        type = params.type;
        if (undefined !== params.type._id) {
            type = params.type._id;
        }
    }

    
    var fieldsToSet = { 
        name: params.name,
        description: params.description,
        type: type,
        require_approval: params.require_approval,
        activeFor: params.activeFor,
        rules: params.rules,
        addMonthly: params.addMonthly,
        timeSaving: params.timeSaving,
        timeSavingAccount: params.timeSavingAccount,
        sortkey: params.sortkey,
        quantity_unit: params.quantity_unit || 'D',
        quantity: params.quantity || 0,
        special: params.special,
        consuption: params.consuption,
        consuptionBusinessDaysLimit: params.consuptionBusinessDaysLimit
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

    if (params.id)
    {
        var postedRules = [];
        var postedRulesId = [];
        var newRules = [];

        params.rules.forEach(function(rule) {
            if (undefined !== rule._id) {
                postedRules.push(rule);
                postedRulesId.push(rule._id);
            } else {
                newRules.push(rule);
            }
        });

        RightModel.findById(params.id, function(err, document) {
            if (service.handleMongoError(err))
            {
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

                document.save(function(err, document) {

                    if (service.handleMongoError(err)) {

                        // for compatibility with the list service
                        document.populate('type', function(err, document) {

                            if (service.handleMongoError(err)) {

                                service.resolveSuccess(
                                    document,
                                    gt.gettext('The vacation right has been modified')
                                );
                            }
                        });
                    }
                });
            }
        });

    } else {

        if (undefined === params.rules) {
            fieldsToSet.rules = params.rules;
        }

        let right = new RightModel();
        right.set(fieldsToSet);

        right.save(function(err, document) {

            if (service.handleMongoError(err))
            {

                service.resolveSuccess(
                    document, 
                    gt.gettext('The vacation right has been created')
                );
            }
        });
    }
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
     * Call the calendar save service
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


