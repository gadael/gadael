'use strict';

var app = require('../../../../../api/Headless.api.js');

describe('users admin API service', function UsersTestSuite() {
    
    it("should connect to the database", function(done) {
		app.connect(function() {
			done();
		});
	});
    
    it("load all users without parameters", function(done) {
        var list = app.service('admin/users/list');
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
