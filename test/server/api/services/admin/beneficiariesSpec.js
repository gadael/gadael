'use strict';

var app = require('../../../../../api/Headless.api.js');

describe('users admin API service', function UsersTestSuite() {

    it("should connect to the database", function(done) {
		app.connect(function() {
			done();
		});
	});

    it("verify beneficiaries query", function(done) {
        var find = app.db.models.Beneficiary.find({});
        find.populate('right');
        find.select('right document ref').sort('right.name');
        find.exec(function(err, list) {
            done();
        });
    });

    it("request users list", function(done) {
        var list = app.getService('admin/users/list');
        list.getResultPromise().then(function(val) {
            expect(list.httpstatus).toEqual(200);
            done();
        });
	});


    it("request beneficiaries list", function(done) {
        var list = app.getService('admin/beneficiaries/list');
        list.getResultPromise({ account: null }).then(function(val) {
            // not used
            expect(list.httpstatus).toEqual(500);
            done();
        }, function(err) {
            // account is mandatory parameter
            // the promise will return error
            expect(list.httpstatus).toEqual(500);
            done();
        });
	});



    it("should disconnect from the database", function(done) {
		app.disconnect(function() {
			done();
		});
	});

});
