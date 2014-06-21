'use strict';


var api = require('../api/Company.api');
var app = require('../api/Headless.api');




describe("Company API", function CompanyTestSuite() {
	
	it("should connect to database", function(done) {
		app.connect(function() {
			done();
		});
	});
	
	
	var existingName = null;
	
	it("fetch databases in array", function(done) {
		api.listDatabases(app, function(databases) {
			expect(databases[0].name).not.toBe(null);
			existingName = databases[0].name;
			done();
		});
	});
	
	
	it("forbid creation of an existing database", function(done) {
		
		expect(existingName).not.toBe(null);
		
		api.isDbNameValid(app, existingName, function(status) {
			expect(status).toBe(false);
			done();
		});
	});
});







