define([], function() {

    'use strict';

    /**
     * Set stats on the scope object
     * Informations on the selected period
     * Information for the approval steps progression status
     *
     * @param {Resource|object} request
     */
    return function getRequestStat(request) {

        var stat = {
            consumed: {
                D: 0,
                H: 0
            },
            duration: {
                D: 0,
                H: 0
            },
            approval: {
                steps: 0,
                position: 0,
                department: null
            }
        };


        // stats on period

        function updateStatFromObj(requestObj)
        {
            var elem, i;
            for(i=0; i<requestObj.absence.distribution.length; i++) {
                elem = requestObj.absence.distribution[i];

                stat.consumed[elem.right.quantity_unit] += elem.consumedQuantity;
                stat.duration[elem.right.quantity_unit] += elem.quantity;
            }

            // set progression information for request in "waiting approval" status
            // this can be displayed in list where the full steps list is not visible

            var total = request.approvalSteps.length;

            for(i=0; i<total; i++) {
                if ('waiting' !== request.approvalSteps[i].status) {
                    continue;
                }

                stat.approval.position = Math.abs(i-total);

                if (undefined !== request.approvalSteps[i]) {
                    stat.approval.department = request.approvalSteps[i].department;
                }
                break;
            }

            stat.approval.steps = total;


        }


        if (undefined !== request.$promise) {
            request.$promise.then(updateStatFromObj);
        } else {
            updateStatFromObj(request);
        }

        return stat;
    };
});
