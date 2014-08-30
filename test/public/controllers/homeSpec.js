
define(['controllers/home'], function() {

    describe('Home controller', function () {
        'use strict';
        
        var scope = null;

        beforeEach(function(done) {
            
            angular.mock.module('inga');
            
            angular.mock.inject(function($injector) {
                
                $httpBackend = $injector.get('$httpBackend');
                $httpBackend.when('GET', '/rest/common').respond({ user: { isAuthenticated: false } });
            });
            

            angular.mock.inject(function($rootScope, $controller){

                //create an empty scope
                scope = $rootScope.$new();
                //declare the controller and inject our empty scope
                $controller('Home', {$scope: scope});

                done();
            });
            
            
        });
        
        
        it('should have a title', function(){
            expect(scope.home.title).toBe('hey this is home.js!');
        });
        

    });


});
