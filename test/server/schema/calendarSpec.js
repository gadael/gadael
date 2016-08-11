'use strict';


const helpers = require('../rest/mockServer');

const api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js')
};

describe('Calendar', function() {

    let Calendar;

    let server;

    let user;

    beforeEach(function(done) {
        helpers.mockServer('CalendarSpecTestDatabase', function(_mockServer) {
            server = _mockServer;

            Calendar = server.app.db.models.Calendar;


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


    function half12() {
        let cal = new Calendar();
        cal.halfDayHour = new Date(1970,0,1,12,0,0,0);
        return cal;
    }

    function day(fh, th) {
        return {
            dtstart: new Date(2016,0,1,fh,0,0,0),
            dtend: new Date(2016,0,1,th,0,0,0)
        };
    }

    function days(fh, th) {
        return {
            dtstart: new Date(2016,0,1,fh,0,0,0),
            dtend: new Date(2016,0,3,th,0,0,0)
        };
    }


    it("getDays on a morning day", function(done) {

        expect(half12().getDays(day(0, 12))).toEqual(0.5);
        expect(half12().getDays(day(8, 9))).toEqual(0.5);
        expect(half12().getDays(day(7, 12))).toEqual(0.5);
        done();
	});

    it("getDays on a afternoon day", function(done) {

        expect(half12().getDays(day(12, 24))).toEqual(0.5);
        //expect(half12().getDays(day(12, 13))).toEqual(0.5);
        //expect(half12().getDays(day(22, 23))).toEqual(0.5);
        done();
	});

    it("getDays on days start morning end morning", function(done) {


        expect(half12().getDays(days(8, 8))).toEqual(2.5);
        done();
	});

    it("getDays on days start afternoon end afternoon", function(done) {

        expect(half12().getDays(days(15, 15))).toEqual(2.5);
        done();
	});


    it("getDays on days start morning end afternoon", function(done) {

        expect(half12().getDays(days(8, 15))).toEqual(3);
        done();
	});

    it("getDays on days start afternoon end morning", function(done) {

        expect(half12().getDays(days(15, 8))).toEqual(2);
        done();
	});

    it('close the mock server', function(done) {
        server.close(done);
    });


});
