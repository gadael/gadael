'use strict';


/**
 * Get approvaSteps to init a workflow
 * @param {User} user       Request owner
 * @return {Promise}        Promised array of approval steps
 */
exports = module.exports = function getApprovalStepsModule(user) {



    function getStepPromise(department)
    {

        return department.getManagers()
        .then(managers => {
            var step = {};
            step.operator = department.operator;
            step.department = department.name;
            step.approvers = [];
            for(var j=0; j< managers.length; j++) {
                step.approvers.push(managers[j].user.id);
            }

            return step;

        });
    }



    /**
     * Get approval steps from the departments and ancestors
     * bypass steps with no approvers (departments without manager)
     * last array item is the first approval step
     *
     * @param {Array} departments
     * @return {Promise} resolve to the list of steps
     */
    function getApprovalSteps(departments)
    {
        var async =require('async');

        var steps = [];

        return new Promise((resolve, reject) => {
            async.eachSeries(departments, function iterator(department, callback) {

                getStepPromise(department).then(function addStep(step) {

                    if (0 !== step.approvers.length) {
                        steps.push(step);
                    }

                    callback();
                }, callback);
            }, function done(err) {
                if (err) {
                    return reject(err);
                }

                // set the first step in waiting status
                if (steps.length > 0) {
                    steps[steps.length -1].status = 'waiting';
                }

                resolve(steps);
            });
        });
    }


    return user.getDepartmentsAncestors().then(getApprovalSteps);
};
