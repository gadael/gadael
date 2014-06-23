'use strict';


var api = require('../api/Company.api');
var app = require('../api/Headless.api');
var company = { 
			name: 'The Fake Company',
			port: 3001 
		};



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
		
		expect(existingName).not.toBeNull();
		
		api.isDbNameValid(app, existingName, function(status) {
			expect(status).toBeFalsy();
			done();
		});

		done();
	});
	
	
	
	var testDbName = 'testDatabase';
	
	it("check the absence of the test database", function(done) {
		api.isDbNameValid(app, testDbName, function(status) {
			expect(status).toBeTruthy();
			done();
		});
	});
	
	
	
	it("create a test company", function(done) {
		api.createDb(app, testDbName, company, function() {
			api.getCompany(app, testDbName, function(companyDoc) {
				expect(companyDoc.name).toEqual(company.name);
				expect(companyDoc.port).toEqual(company.port);
				done();
			});
		});
	});
	
	
	it("create a test company", function(done) {
		api.getCompanies(app, function(res) {
			
			var found = false;
			
			for(var i=0; i<res.length; i++) {
				if (company.name === res[i].name)
				{
					found = true;
				}
			}
			expect(found).toBeTruthy();
		});
	});
	
	
	it("drop the test database", function(done) {
		api.dropDb(app, testDbName, function() {
			done();
		});
	});
	
	
});







