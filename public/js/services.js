define([
    'angular',
    'services/loadableResource',
    'services/catchOutcome',
    'services/departmentDays',
    'services/departmentReload',
    'services/renewalChart',
    'services/rest',
    'services/absence-edit',
    'services/workperiod-recover-edit',
    'services/timesavingdeposit-edit',
    'services/getCreateRequest',
    'services/user-edit',
    'services/request-stat',
    'services/beneficiary',
    'services/calendar',
    'angularResource'],
    function (
        angular,
        loadableResource,
        catchOutcome,
        departmentDays,
        departmentReload,
        renewalChart,
        rest,
        AbsenceEdit,
        WorkperiodRecoverEdit,
        TimeSavingDepositEdit,
        getCreateRequest,
        UserEdit,
        getRequestStat,
        initBeneficiary,
        getCalendar) {

	'use strict';


	/* Services */

	angular.module('gadael.services', ['ngResource'])



    /**
     * catch outcome messages from the rest service and
     *  - forward messages to rootscope
     *  - highlight the missing fields
     */
    .factory('catchOutcome', ['$rootScope', '$q', function($rootScope, $q) {

        return catchOutcome(angular, $rootScope, $q);
    }])


    /**
     * Prepare scope for the department planning
     *
     */
    .factory('departmentDays', ['$q', '$location', function($q, $location) {

        return departmentDays($q, $location);
    }])

    /**
     * Create function for department planning reload
     * @return {Function}
     */
    .factory('departmentReload', ['departmentDays', function(departmentDays) {

        return departmentReload(departmentDays);
    }])



    /**
     * Prepare scope for the account renewal chart
     *
     */
    .factory('renewalChart', ['gettextCatalog', '$filter', function(gettextCatalog, $filter) {

        return renewalChart(gettextCatalog, $filter);
    }])


    .factory('ResourceFactory',
        ['$rootScope', '$resource', function($rootScope, $resource) {


        if (undefined === $rootScope.loaderPromises) {
            // This is the list of promises monitored with the loading indicator
            $rootScope.loaderPromises = [];
        }

        /**
         * create a resource
         * @param   {string} collectionPath path to rest service
         * @param   {object} parameters Optional parameters default is { id:'@_id' }
         */
        var ResourceFactory = function(collectionPath, parameters) {

            if (undefined === parameters) {
                parameters = { id:'@_id' };
            }

            var resource = $resource(collectionPath, parameters,
                {
                    'save': { method:'PUT' },    // overwrite default save method (POST)
                    'create': { method:'POST' }
                }
            );

            var query = resource.query;

            /**
             * Overwrite the query function to have a copy of each promise in the rootScope
             * loading indicator will wait for the resolution of theses promises
             */
            resource.query = function() {
                var queryResults = query.apply(this, arguments);
                $rootScope.loaderPromises.push(queryResults.$promise);
                return queryResults;
            };

            return resource;
        };


        return ResourceFactory;

    }])



	/**
	 * Create a resource to an object or to a collection
	 * the object resource is created only if the angular route contain a :id
	 */
	.factory('RestResource',
        ['ResourceFactory', '$routeParams', 'catchOutcome',
        function(ResourceFactory, $routeParams, catchOutcome) {

        var buildResource = loadableResource(ResourceFactory, $routeParams, catchOutcome);

		/**
		 * Get the resource
		 * @param   {string} collectionPath [[Description]]
		 * @returns {Resource} the resource
		 */
		return function(collectionPath)
		{
			if ($routeParams.id) {
				return buildResource.real(collectionPath);
			}

			return buildResource.fake(collectionPath);
		};

	}])

    /**
     * Load the collection of REST services
     */
    .factory('Rest', ['ResourceFactory', 'RestResource',
        function(ResourceFactory, RestResource) {
            return rest(ResourceFactory, RestResource);
        }
    ])


    /**
     * Set stats on a request object
     * Informations on the selected period
     * Information for the approval steps progression status
     */
    .factory('getRequestStat',
        function() {
            return getRequestStat;
        }
    )

    /**
     * return a bool for the canEdit status
     */
    .factory('canEditRequest',
        function() {
            /**
             * @param {Resource} request The request not yet loaded
             */
            return function($scope) {
                $scope.canEdit = false;
                $scope.request.$promise.then(function() {
                    var status = $scope.request.status.created;
                    var compulsoryLeave = $scope.request.absence.compulsoryLeave && $scope.request.absence.compulsoryLeave._id;
                    if (!compulsoryLeave) {
                        $scope.canEdit = ('accepted' === status || 'waiting' === status);
                    }
                });
            };
        }
    )


    /**
     *
     */

    .factory('AbsenceEdit',
        function(gettextCatalog) {
            return AbsenceEdit(gettextCatalog);
        }
    )

    .factory('WorkperiodRecoverEdit',
        function(gettextCatalog) {
            return WorkperiodRecoverEdit(gettextCatalog);
        }
    )

    .factory('TimeSavingDepositEdit',
        function(gettextCatalog, decimalAdjust) {
            return TimeSavingDepositEdit(gettextCatalog, decimalAdjust);
        }
    )


    /**
     *
     */
    .factory('UserEdit', ['$modal',
        function($modal) {
            return UserEdit($modal);
        }
    ])


    /**
	 * Add periods form in the array of items
     *
	 */
	.factory('addPeriodRow', function() {


        /**
         * Add periods form in the array of items (deferred service call)
         *
         * @param {Array}     items         items binded to rows
         * @param {$resource} itemResource  resource for one row
         * @param {boolean}   initialize    initalize dates on new row
         */
        return function($scope, items, itemResource, initialize) {

            require(['services/addPeriodRow'], function(serviceFn) {
                serviceFn(items, itemResource, initialize);
                $scope.$apply();
            });
        };
	})


	.factory('saveAccountCollection', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account collections in scope
         *
         */
        return function($scope) {
            var deferred = $q.defer();
            require(['services/saveAccountCollection'], function(serviceFn) {
                serviceFn($scope, $q, catchOutcome).then(deferred.resolve);
            });

            return deferred.promise;
        };
	}])


    .factory('saveAccountScheduleCalendar', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account schedule calendar in scope
         *
         */
        return function($scope) {
            var deferred = $q.defer();
            require(['services/saveAccountScheduleCalendar'], function(serviceFn) {
                serviceFn($scope, $q, catchOutcome).then(deferred.resolve);
            });

            return deferred.promise;
        };
	}])


    .factory('saveAccountNWDaysCalendar', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account non working days calendar in scope
         *
         */
        return function($scope) {
            var deferred = $q.defer();
            require(['services/saveAccountNWDaysCalendar'], function(serviceFn) {
                serviceFn($scope, $q, catchOutcome).then(deferred.resolve);
            });

            return deferred.promise;
        };
	}])


    .factory('saveCollectionBeneficiaries', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account collections in scope
         *
         * @param {Array} beneficiaries
         * @param {Integer} collectionId  The saved collection _id
         */
        return function(beneficiaries, collectionId) {
            var deferred = $q.defer();
            require(['services/saveBeneficiaries'], function(serviceFn) {
                serviceFn(beneficiaries, 'RightCollection', collectionId, $q, catchOutcome).then(deferred.resolve);
            });

            return deferred.promise;
        };
	}])


    .factory('saveUserBeneficiaries', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account collections in scope
         *
         * @param {Array} beneficiaries
         * @param {Integer} userId
         */
        return function(beneficiaries, userId) {
            var deferred = $q.defer();
            require(['services/saveBeneficiaries'], function(serviceFn) {
                serviceFn(beneficiaries, 'User', userId, $q, catchOutcome).then(deferred.resolve);
            });

            return deferred.promise;
        };
	}])


    .factory('removeSubDocument', function() {

        /**
         * Remove subdocument from array
         * @param {Array}   arr is a list of subdocuments
         * @param {Object}  Object from a mongoose document from a REST service
         * @return {Array}  The modified array
         */
        return function(arr, oldDocument) {

            if (-1 === arr.indexOf(oldDocument)) {
                // not found, return the unmodified array
                return arr;
            }

            if (undefined === oldDocument._id) {
                // not saved, return the unmodified array
                return arr;
            }

            return arr.filter(function(doc) {
                if (doc._id === oldDocument._id) {
                    return false;
                }

                return true;
            });
        };

	})


    .factory('setSubDocument', function() {

        /**
         * Replace subdocument by id
         * or push the new document
         * @param {Array}   arr is a list of subdocuments
         * @param {Object}  Object from a mongoose document from a REST service
         * @return {Array}  The modified array
         */
        return function(arr, newDocument) {

            if (-1 !== arr.indexOf(newDocument)) {
                // already inserted
                return arr;
            }

            if (undefined === newDocument._id) {
                arr.push(newDocument);
                return arr;
            }

            return arr.map(function(doc) {
                if (doc._id === newDocument._id) {
                    return newDocument;
                }

                return doc;
            });
        };

	})


    .factory('decimalAdjust', function() {
        /**
         * Decimal adjustment of a number.
         *
         * @param {String}  type  The type of adjustment.
         * @param {Number}  value The number.
         * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
         * @returns {Number} The adjusted value.
         */
        return function decimalAdjust(type, value, exp) {
            // If the exp is undefined or zero...
            if (typeof exp === 'undefined' || +exp === 0) {
                return Math[type](value);
            }
            value = +value;
            exp = +exp;
            // If the value is not a number or the exp is not an integer...
            if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
                return NaN;
            }
            // Shift
            value = value.toString().split('e');
            value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
            // Shift back
            value = value.toString().split('e');
            return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
        };
    })

    /**
     * Get a function to open the create request popup
     * user by account and admin
     */
    .factory('getCreateRequest', ['$location', '$modal', 'Rest', getCreateRequest])


    /**
     * Load the getRightRuleType service
     */
    .factory('getRightRuleType', ['gettextCatalog',
        function(gettextCatalog) {
            return function getRightRuleType(type) {
                switch(type) {
                    case 'entry_date':          return gettextCatalog.getString('Entry date');
                    case 'request_period':      return gettextCatalog.getString('Request period');
                    case 'request_beneficiary': return gettextCatalog.getString('Request in user interval');
                    case 'seniority':           return gettextCatalog.getString('Seniority');
                    case 'age':                 return gettextCatalog.getString('Age');
                    case 'consumption':         return gettextCatalog.getString('Consuption');
                }
            };
        }
    ])



    .factory('getOnlyIds', function() {

        /**
         * Convert array of objects to array of ID
         * @param {Array} arr
         * @return {Array}
         */
        return function(arr) {
            return arr.map(function(d) {
                return d._id;
            });
        };
    })


    /**
     * Load the Beneficiary service
     */
    .factory('Beneficiary', ['decimalAdjust', 'gettext',
        function(decimalAdjust, gettext) {
            return initBeneficiary(decimalAdjust, gettext);
        }
    ])



    /**
     * Load the collection of REST services
     */
    .factory('Calendar', ['$locale', '$q', '$routeParams',
        function(gettext, $locale, $q, $routeParams) {
            return getCalendar(gettext, $locale, $q, $routeParams);
        }
    ]);

});
