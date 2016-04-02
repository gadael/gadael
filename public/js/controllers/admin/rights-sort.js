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
                    /*
                    var pos = 1;
                    $scope.sortableItems.forEach(function(item) {
                        item.object.sortkey = pos++;
                        item.object.$save();
                    });
                    */
                }
            };

            $scope.dragRights = {
                orderChanged: function() {
                    /*
                    var pos = 1;
                    $scope.sortableItems.forEach(function(item) {
                        item.object.sortkey = pos++;
                        item.object.$save();
                    });
                    */
                }
            };
		}
	];
});
