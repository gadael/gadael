'use strict';

var app = require('../../../../../api/Headless.api.js');
// var restitute = require('restitute');

describe('collections admin API service', function UsersTestSuite() {
    
    it("should connect to the database", function(done) {
		app.connect(function() {
			done();
		});
	});
    
    it("load all users without parameters", function(done) {
        var list = app.getService('admin/collections/list');
        list.getResultPromise().then(function(val) {
            expect(list.httpstatus).toEqual(200);
            done();
        });
	});
    
    
    it("Fail on create a collection with a missing mandatory name", function(done) {
        var save = app.getService('admin/collections/save');
        save.getResultPromise({}).catch(function(err) {
            expect(save.httpstatus).toEqual(400);
            done();
        });
    });
    

    it("should disconnect from the database", function(done) {
		app.disconnect(function() {
			done();
		});
	});

});
