define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'Rest',
        '$modal',
        function(
			$scope, 
			$location, 
			Rest,
            $modal
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                
                $scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined && $scope.user.roles.account 	!== null);
                $scope.user.isAdmin 	= ($scope.user.roles && $scope.user.roles.admin 	!== undefined && $scope.user.roles.admin 	!== null);
                $scope.user.isManager 	= ($scope.user.roles && $scope.user.roles.manager 	!== undefined && $scope.user.roles.manager 	!== null);

            });
        }
                
                
        $scope.departments = Rest.admin.departments.getResource().query();


        /**
         *
         *
         * @param {Object} user
         */
        $scope.setImage = function(user) {

            var modalscope = $scope.$new();
            modalscope.user = user;
            modalscope.clearCrop = function() {
                 $scope.imageCropStep = 1;
                 delete $scope.imgSrc;
                 delete $scope.result;
                 delete $scope.resultBlob;
            };


            modalscope.fileChanged = function(e) {

                var files = e.target.files;

                var fileReader = new FileReader();
                fileReader.readAsDataURL(files[0]);

                fileReader.onload = function() {
                    $scope.imgSrc = this.result;
                    $scope.$apply();
                };
            };

            var myModal = $modal({
                scope: modalscope,
                template: 'partials/admin/user-edit-image.html',
                show: true
            });


        };



		
		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};

		
		/**
         * Save button
         */
		$scope.saveUser = function() {

			$scope.user.ingaSave()
            .then($scope.cancel);
	    };

		
	}];
});

