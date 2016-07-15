'use strict';

const api = {
    user: require('../../../../api/User.api.js')
};



describe('Compulsory leaves admin rest service', function() {


    let server;

    let compulsoryleave1;
    let compulsoryleave2;

    let randomUser;

    let right1;

    let collection;

    let request1;
    let request2;


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

    it('Create a collection', function(done) {
        server.post('/rest/admin/collections', {
            name: 'Test collection',
            attendance: 100
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            collection = body;
            delete collection.$outcome;
            done();
        });
    });

    it('create Right 1', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Right 1',
            quantity: 25,
            quantity_unit: 'D'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            right1 = body;
            expect(right1._id).toBeDefined();
            done();
        });
    });

    it('link the right to collection', function(done) {
        server.post('/rest/admin/beneficiaries', {
            ref: 'RightCollection',
            document: collection._id,
            right: right1
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create renewal', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right1._id,
            start: new Date(2015,0,1).toJSON(),
            finish: new Date(2016,0,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            right1.renewal = body;
            done();
        });
    });


    it("create random account", function(done) {
		api.user.createRandomAccount(server.app).then(function(randomAccount) {
            expect(randomAccount.user.email).toBeDefined();
            expect(randomAccount.user.roles.account).toBeDefined();
            randomUser = randomAccount;
			done();
		});
	});


    it('link random user to collection', function(done) {
        server.post('/rest/admin/accountcollections', {
            user: randomUser.user._id,
            rightCollection: collection,
            from: new Date(2014,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    const dtstart = new Date(2015, 11, 15, 0,0,0,0);
    const dtend = new Date(2015, 11, 31, 0,0,0,0);



    it('create new compulsory leave 1', function(done) {
        server.post('/rest/admin/compulsoryleaves', {
            name: 'compulsory leave test',
            dtstart: dtstart,
            dtend: dtend,
            right: right1._id,
            collections: [collection._id],
            departments: []
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            compulsoryleave1 = body._id;

            done();
        });
    });


    it ('update compulsory leave and create requests', function(done) {

        server.put('/rest/admin/compulsoryleaves/'+compulsoryleave1, {
            name: 'compulsory leave test',
            dtstart: dtstart,
            dtend: dtend,
            right: right1._id,
            collections: [collection._id],
            departments: [],
            requests: [
                {
                    user: {
                        id: randomUser.user._id,
                        name: randomUser.user.lastname+' '+randomUser.user.firstname
                    }
                }
            ]
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            expect(body.requests[0].request).toBeDefined();
            expect(body.requests[0].request.length).toEqual(24);
            request1 = body.requests[0].request;
            done();
        });
    });


    it('create new compulsory leave 2 with request', function(done) {
        server.post('/rest/admin/compulsoryleaves', {
            name: 'compulsory leave test 2',
            dtstart: new Date(2015, 11, 23, 0,0,0,0),
            dtend: new Date(2015, 11, 26, 0,0,0,0),
            right: right1._id,
            collections: [collection._id],
            departments: [],
            requests: [
                {
                    user: {
                        id: randomUser.user._id,
                        name: randomUser.user.lastname+' '+randomUser.user.firstname
                    }
                }
            ]
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            expect(body.requests[0].request).toBeDefined();

            compulsoryleave2 = body._id;
            request2 = body.requests[0].request;

            done();
        });
    });



    it('check the created request 1', function (done) {
        server.get('/rest/admin/requests/'+request1, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(request1);
            body.events.forEach(event => {

                let evtstart = new Date(event.dtstart);
                let evtend = new Date(event.dtend);

                expect(evtstart.getTime() >= dtstart.getTime()).toBeTruthy();
                expect(evtend.getTime() <= dtend.getTime()).toBeTruthy();
            });

            done();
        });
    });


    it('delete the compulsory leave', function(done) {
        server.delete('/rest/admin/compulsoryleaves/'+compulsoryleave1, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(compulsoryleave1);
            expect(body.name).toEqual('compulsory leave test');
            server.expectSuccess(body);
            done();
        });
    });


    it('check the deleted request', function (done) {
        server.get('/rest/admin/requests/'+request1, {}, function(res, body) {
            expect(res.statusCode).toEqual(404);
            done();
        });
    });


    it('check the created request 2', function (done) {
        server.get('/rest/admin/requests/'+request2, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('login as the random user', function(done) {
        server.authenticateUser(randomUser).then(function() {
            done();
        }).catch(done);
    });


    let request2body;

    it('check that the request exists in list', function(done) {
        server.get('/rest/account/requests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (body.length === 1) {
                expect(body[0]._id).toEqual(request2);
                request2body = body[0];
            }
            done();
        });
    });


    it('check that the request is not modifiabled by the owner', function(done) {
        server.put('/rest/account/requests/'+request2, request2body, function(res, body) {
            expect(res.statusCode).toEqual(403);
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
