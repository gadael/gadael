

'use strict';


const helpers = require('../rest/mockServer');


const api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js')
};

describe('Account', function() {

    let rightModel, renewalModel, user;

    let server;

    beforeEach(function(done) {
        helpers.mockServer('AccountSpecTestDatabase', function(_mockServer) {
            server = _mockServer;

            rightModel = server.app.db.models.Right;
            renewalModel = server.app.db.models.RightRenewal;

            done();
        });
    });


    it("create random account", function(done) {
		api.user.createRandomAccount(server.app).then(function(randomAccount) {
            expect(randomAccount.user.email).toBeDefined();
            expect(randomAccount.user.roles.account).toBeDefined();
            user = randomAccount.user;
			done();
		});
	});


    it('verify the getWeekHours method', function(done) {


        let dtstart = new Date(2015,5,1);
        let dtend = new Date(2016,4,31);

        user.getAccount().then(account => {
            return account.getWeekHours(dtstart, dtend);
        }).then(o => {
            expect(o.nbDays).toEqual(5);
            expect(o.hours).toEqual(40);
            done();
        }).catch(done);
    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});
