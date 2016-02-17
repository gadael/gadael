define(function() {

    'use strict';

    return function(resource, catchOutcome) {
        /**
         * Additional method on resource to delete and redirect messages
         * to the rootscope message list
         *
         * @param   {function} nextaction optional function
         * @returns {Promise}  promise will resolve to the received data, same as the $save method
         */
        function gadaDelete(nextaction) {

            var p = catchOutcome(resource.$delete());

            if (nextaction) {
                p = p.then(nextaction, function() {
                    // error on delete, do not redirect
                });
            }

            return p;
        }

        return gadaDelete;
    };
});
