'use strict';


describe('lunch over a leave with lunch option', function() {


    let server,
        userAdmin,      // create the account, the manager
        userAccount,    // create the request
        right1,
        right2,
        schedule,
        department,     // department associated to userManager
        renewal1,
        renewal2;

    beforeEach(function(done) {
        var helpers = require('../mockServer');

        helpers.mockServer('adminLunchOnLeave', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });

    it('Create admin session needed for prerequisits', function(done) {
        server.createAdminSession().then(function(user) {
            userAdmin = user;
            expect(userAdmin.roles.admin).toBeDefined();
            done();
        });
    });

    it('create new right without lunch', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Leave without lunch',
            quantity: 5,
            quantity_unit: 'D',
            lunch: false
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            right1 = body;

            done();
        });
    });

    it('create new right with lunch', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Leave with lunch',
            quantity: 5,
            quantity_unit: 'D',
            lunch: true
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            right2 = body;

            done();
        });
    });

    it('create renewal on right1', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: {
                _id: right1._id
            },
            start: new Date(2014,5,1).toJSON(),
            finish: new Date(2015,4,31).toJSON()
        }, function(res, body) {
            renewal1 = body;
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('create renewal on right2', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: {
                _id: right2._id
            },
            start: new Date(2014,5,1).toJSON(),
            finish: new Date(2015,4,31).toJSON()
        }, function(res, body) {
            renewal2 = body;
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('link right1 to default collection', function(done) {
        server.post('/rest/admin/beneficiaries', {
            right: right1,
            ref: 'RightCollection',
            document: '5740adf51cf1a569643cc520'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('link right2 to default collection', function(done) {
        server.post('/rest/admin/beneficiaries', {
            right: right2,
            ref: 'RightCollection',
            document: '5740adf51cf1a569643cc520'
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
            from: new Date(2014,0,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('Set a 40H workshedule', function(done) {
        server.post('/rest/admin/accountschedulecalendars', {
            user: userAccount.user._id,
            calendar: {
                _id: '5740adf51cf1a569643cc101'
            },
            from: new Date(2014,0,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);

            schedule = body._id;

            done();
        });
    });

    it('Create absence', function(done) {
        var distribution = [
            {
                right: {
                    id: right1._id,
                    renewal:renewal1._id
                },
                quantity: 1,
                events: [{
                    dtstart: new Date(2014,11,1, 8).toJSON(),
                    dtend: new Date(2014,11,1, 18).toJSON()
                }]
            },
            {
                right: {
                    id: right2._id,
                    renewal:renewal2._id
                },
                quantity: 1,
                events: [{
                    dtstart: new Date(2014,11,2, 8).toJSON(),
                    dtend: new Date(2014,11,2, 18).toJSON()
                }]
            }
        ];

        server.post('/rest/admin/requests', {
            user: userAccount.user._id.toString(),
            absence: { distribution: distribution }
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('Create saved lunchs', function(done) {
        server.app.db.models.Account.findById(userAccount.user.roles.account, (err, account) => {
            account.lunch.createdUpTo = new Date(2014,11,1);
            account.saveLunchBreaks(new Date(2014,12,1))
            .then(() => {
                done();
            })
            .catch(done);
        });
    });

    it('get the lunch list', function(done) {
        server.get('/rest/admin/lunchs', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            expect(body[0].count).toEqual(21);
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

    // TODO check number of lunchs

});
