define([], function() {

    'use strict';


    return function loadUserEditService($modal) {


        return {
            setImage: function($scope) {

                /**
                 * SetImage scope method to open a modal for the user avatar
                 * used in admin/user-edit and user/settings
                 */
                return function(user) {

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

                    $modal({
                        scope: modalscope,
                        templateUrl: 'partials/utils/common/user/user-edit-image.html',
                        show: true
                    });


                };
            }
        };
    };

});
