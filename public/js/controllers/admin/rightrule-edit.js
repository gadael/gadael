define([], function() {

    'use strict';

	return [
        '$scope',
        '$location',
        '$routeParams',
        'Rest',
        'catchOutcome',
        'setSubDocument',
        'removeSubDocument', function($scope, $location, $routeParams, Rest, catchOutcome, setSubDocument, removeSubDocument) {


        var rightResource = Rest.admin.rights.getResource();
        var rightRenewal = Rest.admin.rightrenewals.getResource();
        var rightTypesResource = Rest.admin.types.getResource();

        function onRightLoaded(right) {

            // load last renewal for right
            rightRenewal.query({right: right._id}).$promise.then(function(renewals) {
                $scope.renewal = renewals[0];
            });

            // Populate $scope.rightrule

            var ruleArr = right.rules.filter(function(r) {
                if (r._id === $routeParams.id) {
                    return true;
                }

                return false;
            });

            if (ruleArr.length === 1) {
                $scope.rightrule = ruleArr[0];
                $scope.step = 2;
            }
        }

        // This is used for the consumption type
        $scope.righttypes = rightTypesResource.query();


        // estimation for the seniority rule via $scope.estimated
        var min, max;

        $scope.$watchCollection('rightrule.interval', function onChangeInterval(interval) {
            if (undefined === interval) {
                return;
            }

            min = new Date();
            max = new Date();

            min.setFullYear(min.getFullYear() - interval.min);
            max.setFullYear(max.getFullYear() - interval.max);

            $scope.estimated = {
                min: min,
                max: max
            };
        });


        if ($location.search().right) {
            $scope.right = rightResource.get({id: $location.search().right});
            $scope.right.$promise.then(onRightLoaded);
        }


        $scope.step = 1;
        $scope.rightrule = {
            type: 'entry_date',
            title: '',
            interval: {
                min:0,
                max:0,
                unit: 'D'
            },
            consumption: {
                periods: []
            }
        };

        $scope.next = function() {
            $scope.step = 2;
        };

        $scope.addPeriod = function() {
            $scope.rightrule.consumption.periods.push({});
        };

		$scope.removePeriod = function(index) {
            $scope.rightrule.consumption.periods.splice(index, 1);
		};

		$scope.back = function() {
			$location.url('/admin/rights/'+$scope.right._id);
		};

		$scope.saveRightrule = function() {

            $scope.right.rules = setSubDocument($scope.right.rules, $scope.rightrule);
			catchOutcome($scope.right.$save()).then($scope.back);
	    };


        $scope.delete = function() {

            $scope.right.rules = removeSubDocument($scope.right.rules, $scope.rightrule);
            catchOutcome($scope.right.$save()).then($scope.back);
        };
	}];
});
