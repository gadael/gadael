define(['services/gadaSave', 'services/gadaDelete'],
    function(gadaSave, gadaDelete) {

    'use strict';
    
    /**
     * Get a list of function to use in resource creation
     * this is for the RestResource service
     *
     * @param   {function} ResourceFactory The service
     * @param   {Object}   $routeParams    Angular route parameters
     * @returns {object} the functions
     */
    function loadableResource(ResourceFactory, $routeParams, catchOutcome) {

    
        /**
         * Create the real loadable resource
         * @param   {string}   collectionPath path to rest service
         * @returns {Resource} resource instance with a loadRouteId() method
         */
        function realLoadableResource(collectionPath) {
            var item = ResourceFactory(collectionPath+'/:id', $routeParams);


            /**
             * Get a resource instance
             * @returns {Resource} a resource instance, will be populated with results
             *                     after get is resolved
             */
            item.loadRouteId = function() {

                var resource = this.get(function(inst) {
                    inst.gadaSave = gadaSave(inst, catchOutcome);
                    inst.gadaDelete = gadaDelete(inst, catchOutcome);
                });

                catchOutcome(resource.$promise);

                return resource;
            };

            return item;
        }


        /**
         * Create the fake loadable resource
         * @param   {string} collectionPath path to rest service
         * @returns {Resource} resource instance with a loadRouteId() method
         */
        function fakeLoadableResource(collectionPath) {
            var collection = ResourceFactory(collectionPath);

            // if the path lead to one item only
            collection.gadaGet = function() {

                var resource = this.get(function(inst) {
                    inst.gadaSave = gadaSave(inst, catchOutcome);
                    inst.gadaDelete = gadaDelete(inst, catchOutcome);
                });

                catchOutcome(resource.$promise);

                return resource;
            };

            /**
             * Get a resource instance
             * @returns {Resource} an empty resource instance, no get triggered
             */
            collection.loadRouteId = function() {
                // scope will be loaded with an empty instance

                var inst = new collection();
                inst.gadaSave = gadaSave(inst, catchOutcome);

                // new record created, no need to delete
                //inst.gadaDelete = gadaDelete(inst, catchOutcome);

                return inst;
            };

            return collection;
        }

    
        return {
            real: realLoadableResource,
            fake: fakeLoadableResource
        };
    }
    
    return loadableResource;

});
