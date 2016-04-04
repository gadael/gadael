define([], function() {
    'use strict';
    return [
		'$scope',
		'Rest',
        'gettext',
		function($scope, Rest, gettext) {

            $scope.setPageTitle(gettext('Sort absence rights'));

            var rightResource = Rest.admin.rights.getResource();
            var typeResource = Rest.admin.types.getResource();

            var allrights = rightResource.query({});
            $scope.types = typeResource.query({});
            $scope.rights = [];

            var selectedType = null;

            $scope.types.$promise.then(function() {
                $scope.types.sort(function(t1, t2) {
                    return t1.sortkey - t2.sortkey;
                });
            });


            /**
             * Get the class for the type sortable item
             * @param   {object} type Type in sortable item
             * @returns {string} CSS class
             */
            $scope.getClass = function(type) {
                if (null !== selectedType && selectedType._id === type._id) {
                    return 'bg-primary';
                }

                return null;
            };


            /**
             * Click on the sort rights button
             * @param   {object}   type
             *
             */
            $scope.setRights = function(type) {
                selectedType = type;
                $scope.rights = allrights.filter(function(r) {
                    return type._id === r.type._id;
                });
                $scope.rights.sort(function(r1, r2) {
                    return r1.sortkey - r2.sortkey;
                });
            };



            /**
             * Display sort rights button only if more than one right to sort
             * @param   {object}  type
             * @returns {boolean}
             */
            $scope.canSort = function(type) {
                var c=0;
                for(var i=0; i<allrights.length; i++) {
                    if (allrights[i].type._id === type._id) {
                        c++;
                        if (c > 1) {
                            return true;
                        }
                    }
                }

                return false;
            };



            $scope.dragTypes = {
                orderChanged: function() {
                    var pos = 1;
                    $scope.types.forEach(function(item) {
                        item.sortkey = pos++;
                        item.$save();
                    });
                }
            };

            $scope.dragRights = {
                orderChanged: function() {
                    var pos = 1;
                    $scope.rights.forEach(function(item) {
                        item.sortkey = pos++;
                        item.$save();
                    });
                }
            };
		}
	];
});
