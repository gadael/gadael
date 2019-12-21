

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
        const dtstart = new Date(2015,5,1);
        const dtend = new Date(2016,4,31);

        user.getAccount().then(account => {
            return account.getWeekHours(dtstart, dtend);
        }).then(o => {
            expect(o.nbDays).toEqual(5);
            expect(o.hours).toEqual(40);
            done();
        }).catch(done);
    });

    it('provide getLunchBreaks method with working hours', function(done) {
        const dtstart = new Date(2016,4,1);
        const dtend = new Date(2016,4,7);
        user.getAccount().then(account => account.getLunchBreaks(dtstart, dtend))
        .then(list => {
            expect(list.length).toBeGreaterThan(0);
            done();
        })
        .catch(done);
    });

    it('provide getLunchBreaks method on monday', function(done) {
        const dtstart = new Date(2018, 11, 24, 0, 0, 0, 0);
        const dtend = new Date(2018, 11, 24, 23, 59, 59, 999);
        user.getAccount().then(account => account.getLunchBreaks(dtstart, dtend))
        .then(list => {
            expect(list.length).toEqual(1);
            done();
        })
        .catch(done);
    });

    it('provide getLunchBreaks method on chrismas day', function(done) {
        const dtstart = new Date(2018, 11, 25, 0, 0, 0, 0);
        const dtend = new Date(2018, 11, 25, 23, 59, 59, 999);
        user.getAccount().then(account => account.getLunchBreaks(dtstart, dtend))
        .then(list => {
            expect(list.length).toEqual(0);
            done();
        })
        .catch(done);
    });

    it('provide getLunchBreaks method on wednesday', function(done) {
        const dtstart = new Date(2018, 11, 26, 0, 0, 0, 0);
        const dtend = new Date(2018, 11, 26, 23, 59, 59, 999);
        user.getAccount().then(account => account.getLunchBreaks(dtstart, dtend))
        .then(list => {
            expect(list.length).toEqual(1);
            done();
        })
        .catch(done);
    });

    it('provide getLunchBreaks method with overlapping non-working day', function(done) {
        const dtstart = new Date(2018, 11, 24, 0, 0, 0, 0);
        const dtend = new Date(2018, 11, 26, 23, 59, 59, 999);
        user.getAccount().then(account => account.getLunchBreaks(dtstart, dtend))
        .then(list => {
            expect(list.length).toEqual(2);
            done();
        })
        .catch(done);
    });

    it('close the mock server', function(done) {
        server.close(done);
    });


});
