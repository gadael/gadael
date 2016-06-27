'use strict';


describe('request absence admin rest service', function() {


    let server,
        userAdmin,      // create the account, the manager
        userAccount,    // create the request

        department;     // department associated to userManager



    beforeEach(function(done) {
        var helpers = require('../mockServer');

        helpers.mockServer('adminRtt', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    // admin actions


    it('Create admin session needed for prerequisits', function(done) {
        server.createAdminSession().then(function(user) {
            userAdmin = user;
            expect(userAdmin.roles.admin).toBeDefined();
            done();
        });
    });




    it('create renewal on default RTT right', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: {
                _id: '5770cad63fccf8da5150e7da'
            },
            start: new Date(2015,1,1).toJSON(),
            finish: new Date(2016,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });



    it('create a department', function(done) {
        server.post('/rest/admin/departments', {
            name: 'Test entity'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            department = body;
            done();
        });
    });


    it('create the user account', function(done) {
        server.createUserAccount(department)
        .then(function(account) {
            userAccount = account;
            expect(userAccount).toBeDefined();
            done();

        });

    });



    it('link user to default collection', function(done) {
        server.post('/rest/admin/accountcollections', {
            user: userAccount.user._id,
            rightCollection: {
                _id: '5740adf51cf1a569643cc520'
            },
            from: new Date(2014,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('request list of current requests as admin', function(done) {
        server.get('/rest/admin/requests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0);
            done();
        });
    });


    var where;

    it('request account current collection', function(done) {

        where = {
            user: userAccount.user._id.toString(),
            dtstart: new Date(2015,1,1, 8).toJSON(),
            dtend: new Date(2015,1,1, 18).toJSON()
        };

        server.get('/rest/admin/collection', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toBeDefined();
            done();
        });
    });



    it('request list of accessibles rights', function(done) {
        server.get('/rest/admin/accountrights', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(3); // FR default

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
