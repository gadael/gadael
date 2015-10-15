define(['q', 'async'], function(Q, async) {

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








        /**
         * Create the combinedAdjustments list on a renewal object
         * @param {Object} renewal
         * @param {Array} adjustments   Manual adjustments created for this user
         */
        function createCombinedAdjustments(renewal, adjustments)
        {
            renewal.combinedAdjustments = [];

            // Combine adjustments with renewal.adjustments

            if (undefined !== renewal.adjustments) {
                for(var i=0; i<renewal.adjustments.length; i++) {
                    renewal.combinedAdjustments.push({
                        from: renewal.adjustments[i].from,
                        quantity: renewal.adjustments[i].quantity,
                        comment: gettext('Auto monthly update')
                    });
                }
            }

            adjustments.forEach(function(manualAdjustment) {
                manualAdjustment.from = manualAdjustment.timeCreated;
                renewal.combinedAdjustments.push(manualAdjustment);
            });

            renewal.combinedAdjustments.sort(function(a1, a2) {
                return (a1.from.getTime() - a2.from.getTime());
            });

        }


        var userResource = Rest.admin.users.getResource();
        var accountbeneficiaryResource = Rest.admin.accountbeneficiaries.getResource();
        var adjustmentResource = Rest.admin.adjustments.getResource();
        var requestResource = Rest.admin.requests.getResource();



        if (!$location.search().user) {
            throw new Error('The user parameter is mandatory');
        }



        var requests = requestResource.query({
            'user.id': $location.search().user,
            absence: true
        });

        $scope.user = userResource.get({id: $location.search().user});

        $scope.user.$promise.then(function() {
            var beneficiaryContainer = accountbeneficiaryResource.get({
                id: $routeParams.id,
                account: $scope.user.roles.account._id
            });

            beneficiaryContainer.$promise.then(function(beneficiary) {

                var now = new Date();

                var panel = 0;

                // for each renewals, add the list of adjustments

                async.each(beneficiary.renewals, function(r, nextRenewal) {

                    r.paneltype = 'default';

                    if (r.start < now && r.finish > now) {
                        $scope.activePanel = panel;
                        r.paneltype = 'primary';
                    }

                    panel++;

                    var adjustments = adjustmentResource.query({ rightRenewal: r._id, user: $scope.user._id }, function() {
                        createCombinedAdjustments(r, adjustments);
                        nextRenewal();
                    });

                    r.adjustmentPromise = adjustments.$promise;


                }, function endRenewals() {


                    $scope.beneficiary = beneficiary;



                    Beneficiary.createGraphValues(beneficiary.renewals, requests.$promise, function(values) {
                        $scope.timedAvailableQuantity = [{
                            "key": "Available quantity",
                            "values": values
                        }];
                    });
                });






            });


        });





        $scope.xAxisTickFormat_Date_Format = function() {
            return function(d){
                return (new Date(d)).toLocaleDateString();
            };
        };




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
