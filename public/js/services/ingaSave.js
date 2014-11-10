define(function() {

    'use strict';

    return function(catchOutcome) {
        /**
         * Additional method on resource to save and redirect messages
         * to the rootscope message list
         *
         * @param   {function} nextaction optional function
         * @returns {Promise}  promise will resolve to the received data, same as the $save method
         */
        function ingaSave(nextaction) {
            
            var p = null;
            if (undefined === this._id || null === this._id) {
                p = catchOutcome(this.$create());
            } else {
                p = catchOutcome(this.$save());
            }

            if (nextaction) {
                p = p.then(nextaction, function() {
                    // error on save, do not redirect
                });
            }

            return p;
        };
        
        return ingaSave;
    }
});