define(function() {

    'use strict';

    return function(resource, catchOutcome) {
        /**
         * Additional method on resource to save and redirect messages
         * to the rootscope message list
         *
         * @param   {function} nextaction optional function
         * @returns {Promise}  promise will resolve to the received data, same as the $save method
         */
        function gadaSave(nextaction) {

            var p = null;
            if (undefined === resource._id || null === resource._id) {
                p = catchOutcome(resource.$create());
            } else {
                p = catchOutcome(resource.$save());
            }

            if (nextaction) {
                p = p.then(nextaction, function() {
                    // error on save, do not redirect
                });
            }

            return p;
        }

        return gadaSave;
    };
});
