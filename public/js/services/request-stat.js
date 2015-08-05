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
                position: 0
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
            var position;

            for(i=0; i<total; i++) {
                if ('waiting' !== request.approvalSteps[i].status) {
                    continue;
                }
                position = i+1;
                break;
            }

            stat.approval.steps = total;
            stat.approval.position = position;
        }


        if (undefined !== request.$promise) {
            request.$promise.then(updateStatFromObj);
        } else {
            updateStatFromObj(request);
        }

        return stat;
    };
});
