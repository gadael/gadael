define([], function() {
    'use strict';
    return [
		'$scope',
		'Rest',
        'gettext',
        '$q',
		function($scope, Rest, gettext, $q) {

            $scope.setPageTitle(gettext('Sort absence rights'));

            var rightResource = Rest.admin.rights.getResource();
            var typeResource = Rest.admin.types.getResource();

            $scope.rights = rightResource.query({});
            $scope.types = typeResource.query({});

            $scope.sortableItems = [];

            $q.all([$scope.rights.$promise, $scope.types.$promise]).then(function(a) {
                var rights = a[0];
                var types = a[1];

                // collect types acting as groups

                types.forEach(function(type) {
                    if (type.group) {
                        $scope.sortableItems.push({
                            name: type.groupTitle || type.name,
                            object: type
                        });
                    }
                });

                // collect rights ignoring rights in groups

                rights.forEach(function(right) {
                    if (!right.type.group) {
                        $scope.sortableItems.push({
                            name: right.name,
                            object: right
                        });
                    }
                });
            });

            $scope.dragControlOptions = {
                orderChanged: function() {
                    var pos = 1;
                    $scope.sortableItems.forEach(function(item) {
                        item.object.sortkey = pos++;
                        //item.object.ingaSave();
                    });
                }
            };
		}
	];
});
