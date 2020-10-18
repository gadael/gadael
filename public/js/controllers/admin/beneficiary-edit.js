define([], function() {

    'use strict';

	return [
        '$scope',
        '$location',
        '$routeParams',
        'Rest',
        '$modal',
        'catchOutcome',
        'gettext',
        'Beneficiary',
        function($scope, $location, $routeParams, Rest, $modal, catchOutcome, gettext, Beneficiary) {

        var userResource = Rest.admin.users.getResource();
        var accountbeneficiaryResource = Rest.admin.accountbeneficiaries.getResource();
        var adjustmentResource = Rest.admin.adjustments.getResource();
        var requestResource = Rest.admin.requests.getResource();

        if (!$location.search().user) {
            throw new Error('The user parameter is mandatory');
        }

        var requests = requestResource.query({
            'user.id': $location.search().user,
            absence: true,
            time_saving_deposit: true
        });

        $scope.user = userResource.get({id: $location.search().user});

        $scope.user.$promise.then(function() {
            var beneficiaryContainer = accountbeneficiaryResource.get({
                id: $routeParams.id,
                account: $scope.user.roles.account._id
            });

            Beneficiary.processBeneficiary($scope, beneficiaryContainer, requests, function(renewalId, callback) {
                return adjustmentResource.query({ rightRenewal: renewalId, user: $scope.user._id }, callback);
            });
        });

        $scope.xAxisTickFormat_Date_Format = Beneficiary.xAxisTickFormat_Date_Format;

		$scope.back = function back() {
			$location.path('/admin/users/'+$scope.user._id);
		};

        $scope.addAdjustment = function addAdjustment(renewal) {
            var modalscope = $scope.$new();

            modalscope.renewal = renewal;

            modalscope.adjustment = new adjustmentResource();

            modalscope.adjustment.beneficiary = $routeParams.id;
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
                templateUrl: 'partials/admin/adjustment-edit.html',
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
