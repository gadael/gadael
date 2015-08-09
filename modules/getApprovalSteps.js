'use strict';

/**
 * Get approvaSteps to init a workflow
 * @param {User} user       Request owner
 * @return {Promise}        Promised array of approval steps
 */
exports = module.exports = function getApprovalStepsModule(user) {

    var Q = require('q');


    function getStepPromise(department)
    {
        var deferred = Q.defer();
        department.getManagers(function(err, managers) {
            if (err) {
                deferred.reject(err);
            }

            var step = {};
            step.operator = department.operator;
            step.department = department.name;
            step.approvers = [];
            for(var j=0; j< managers.length; j++) {
                step.approvers.push(managers[j].user.id);
            }

            deferred.resolve(step);

        });

        return deferred.promise;
    }



    /**
     * Get approval steps from the departments and ancestors
     * bypass steps with no approvers (departments without manager)
     *
     * @param {Array} departments
     * @return {Promise} resolve to the list of steps
     */
    function getApprovalSteps(departments)
    {

        var async =require('async');

        var deferred = Q.defer();
        var steps = [];


        async.eachSeries(departments, function iterator(department, callback) {

            getStepPromise(department).then(function addStep(step) {

                if (0 !== step.approvers.length) {
                    steps.push(step);
                }

                callback();
            }, callback);
        }, function done(err) {
            if (err) {
                return deferred.reject(err);
            }

            // set the first step in waiting status
            if (steps.length > 0) {
                steps[steps.length -1].status = 'waiting';
            }

            deferred.resolve(steps);
        });


        return deferred.promise;
    }


    return user.getDepartmentsAncestors().then(getApprovalSteps);
};
