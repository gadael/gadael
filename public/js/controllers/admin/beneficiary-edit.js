define([], function() {

    'use strict';

	return [
        '$scope',
        '$location',
        '$routeParams',
        'Rest',
        '$modal',
        'catchOutcome',
        function($scope, $location, $routeParams, Rest, $modal, catchOutcome) {

        var userResource = Rest.admin.users.getResource();
        var beneficiaryResource = Rest.admin.beneficiaries.getResource();
        var adjustmentResource = Rest.admin.adjustments.getResource();




        if (!$location.search().user) {
            throw new Error('The user parameter is mandatory');
        }

        $scope.user = userResource.get({id: $location.search().user});
        $scope.user.$promise.then(function() {
            $scope.beneficiary = beneficiaryResource.get({
                id: $routeParams.id,
                account: $scope.user.roles.account._id
            });

            $scope.beneficiary.$promise.then(function(beneficiary) {
                // for each renewals, add the list of adjustments
                beneficiary.renewals.forEach(function(r) {
                    var adjustments = adjustmentResource.query({ rightRenewal: r._id, user: $scope.user._id }, function() {
                        r.adjustments = adjustments;
                    });
                });
            });
        });

		$scope.back = function back() {
			$location.path('/admin/users/'+$scope.user._id);
		};

        $scope.addAdjustment = function addAdjustment(renewal) {
            var modalscope = $scope.$new();

            modalscope.renewal = renewal;

            modalscope.adjustment = new adjustmentResource();

            modalscope.adjustment.rightRenewal = renewal._id;
            modalscope.adjustment.user = $scope.user._id;
            modalscope.adjustment.quantity = 0;
            modalscope.adjustment.comment = '';

            modalscope.adjustment.available_quantity = renewal.available_quantity;


            modalscope.setAdjustmentQuantity = function setAdjustmentQuantity() {
                modalscope.adjustment.available_quantity = renewal.available_quantity + modalscope.adjustment.quantity;
            };

            modalscope.setAvailableQuantity = function setAvailableQuantity() {
                modalscope.adjustment.quantity = modalscope.adjustment.available_quantity - renewal.available_quantity;
            };

            var modal = $modal({
                scope: modalscope,
                template: 'partials/admin/adjustment-edit.html',
                show: true
            });


            modalscope.cancel = function() {
                modal.hide();
            };

            modalscope.save = function() {
                catchOutcome(modalscope.adjustment.$create()).then(modal.hide);
            };
        };

	}];
});
