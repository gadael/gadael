'use strict';

var app = require('../../../../../api/Headless.api.js');

var service = {
    list: require('../../../../../api/services/admin/users/list.js'),
    get: require('../../../../../api/services/admin/users/get.js'),
    save: require('../../../../../api/services/admin/users/save.js'),
    delete: require('../../../../../api/services/admin/users/delete.js')
};

var services = require('../../../../../modules/service');

describe('users admin API service', function UsersTestSuite() {
    
    it("should connect to the database", function(done) {
		app.connect(function() {
			done();
		});
	});
    
    it("load all users without parameters", function(done) {
		var list = service.list(services, app);
        list.call().then(function(val) {
            expect(list.httpstatus).toEqual(200);
            done();
        });
	});

    it("should disconnect from the database", function(done) {
		app.disconnect(function() {
			done();
		});
	});

});