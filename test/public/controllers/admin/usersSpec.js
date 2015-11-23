
define([
    'controllers/admin/users', 
    'usersTpl'
    ], function() {

    "use strict";

    describe('Users controller', function () {


        
        var scope = null;

        beforeEach(function(done) {
            
            angular.mock.module('inga');
            angular.mock.module('partials/utils/paginate-anything.html');
            angular.mock.module('partials/admin/users.html');
            

            
            angular.mock.inject(function($rootScope, $controller, $injector, $compile, $templateCache) {
                
                $httpBackend = $injector.get('$httpBackend');
                
                $httpBackend.when('GET', '/rest/common').respond({ user: { isAuthenticated: true } });
                
                $httpBackend.when('GET', 'rest/admin/collections').respond([
                    {
                        "_id":"53b05d546db97e6b2da74b44",
                        "name":"32H 60%"
                    }
                ]);
                $httpBackend.when('GET', 'rest/admin/departments').respond([
                    {
                        "_id":"53baf3e018b413fd35d27b33",
                        "name":"R&D"
                    }
                ]);

                
                $httpBackend.when('GET', '/rest/admin/users').respond([
                    {
                        "_id":"539314ef68df71f417c9eb91",
                        "email":"kaya@tempora.net",
                        "firstname":"Okey",
                        "lastname":"Ankunding",
                        "isActive":true,
                        "roles":{"account":"53f4ac1b23eca9b71d18f1dd","manager":"53f8bac8d655e82922ebebf9"}
                    }
                ]);
                

                scope = $rootScope.$new();
                $controller('AdminUsers', {$scope: scope});
                
                $compile($templateCache.get('partials/admin/users.html'))(scope);
                
                $httpBackend.flush();

                done();
            });
        });
        
        
        
        
        
        it('should contain a user', function(){
            expect(scope.users.length).toBe(1);
        });
        
        it('should contain a collection in filter list', function(){
            expect(scope.collections.length).toBe(1);
        });

        it('should contain a department in filter list', function(){
            expect(scope.departments.length).toBe(1);
        });
        
        it('must filter out the user on collection filter use', function(){
            
            $httpBackend.when('GET', /\/rest\/admin\/users\?collection=\w+/).respond([]);
            scope.search.collection = "53b05d546db97e6b2da74b44";
            $httpBackend.flush();
            
            expect(scope.users.length).toBe(0);
        });
        
        it('must filter out the user on department filter use', function(){
            
            $httpBackend.when('GET', /\/rest\/admin\/users\?department=\w+/).respond([]);
            scope.search.department = "53baf3e018b413fd35d27b33";
            $httpBackend.flush();
            
            expect(scope.users.length).toBe(0);
        });
        
    });


});

