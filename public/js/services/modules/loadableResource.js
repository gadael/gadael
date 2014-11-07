define(['services/modules/ingaSave'], 
    function(ingaSave) {

    'use strict';
    
    /**
     * Get a list of function to use in resource creation
     * this is for the IngaResource service
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
                return this.get(function(data) {
                    data.ingaSave = ingaSave(catchOutcome);
                });
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

            /**
             * Get a resource instance
             * @returns {Resource} an empty resource instance, no get triggered
             */
            collection.loadRouteId = function() {
                // scope will be loaded with an empty instance

                var inst = new collection();
                inst.ingaSave = ingaSave(catchOutcome);

                return inst;
            };

            return collection;
        }

    
        return {
            real: realLoadableResource,
            fake: fakeLoadableResource
        };
    };
    
    return loadableResource;

});