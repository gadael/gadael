'use strict';

const api = {
    user: require('../../../../api/User.api.js')
};



describe('Compulsory leaves admin rest service', function() {


    let server;

    let compulsoryleave;

    let randomUser;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminCompulsoryleaves', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });



    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('request compulsory leaves list as admin', function(done) {
        server.get('/rest/admin/compulsoryleaves', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0);
            done();
        });
    });


    it("create random account", function(done) {
		api.user.createRandomAccount(server.app).then(function(randomAccount) {
            expect(randomAccount.user.email).toBeDefined();
            expect(randomAccount.user.roles.account).toBeDefined();
            randomUser = randomAccount.user;
			done();
		});
	});


    it('create new compulsory leave', function(done) {
        server.post('/rest/admin/compulsoryleaves', {
            name: 'Calendar test',
            dtstart: new Date(2015, 0, 1, 0,0,0,0),
            dtend: new Date(2015, 11, 31, 0,0,0,0),
            right: '577225e3f3c65dd800257bdc',
            collections: ['5740adf51cf1a569643cc520'],
            departments: []
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            compulsoryleave = body._id;

            done();
        });
    });


    it ('create compulsory leave requests', function(done) {

        server.put('/rest/admin/compulsoryleaves/'+compulsoryleave, {
            name: 'Calendar test',
            dtstart: new Date(2015, 0, 1, 0,0,0,0),
            dtend: new Date(2015, 11, 31, 0,0,0,0),
            right: '577225e3f3c65dd800257bdc',
            collections: ['5740adf51cf1a569643cc520'],
            departments: [],
            requests: [
                {
                    user: {
                        id: randomUser._id
                    }
                }
            ]
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            expect(body.requests[0].request).toBeDefined();

            done();
        });

    });

    it('delete the compulsory leave', function(done) {
        server.delete('/rest/admin/compulsoryleaves/'+compulsoryleave, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(compulsoryleave);
            expect(body.name).toEqual('Calendar test');
            server.expectSuccess(body);
            done();
        });
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});

