'use strict';


describe('RTT right on admin rest service', function() {


    let server,
        userAdmin,      // create the account, the manager
        userAccount,    // create the request
        right,          // RTT right to test
        schedule,
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

    it('create renewal on default annual leaves right', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: {
                _id: '577225e3f3c65dd800257bdc'
            },
            start: new Date(2014,5,1,0,0,0,0).toJSON(),
            finish: new Date(2015,4,31,23,59,59,999).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });



    it('create renewal on default RTT right', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: {
                _id: '5770cad63fccf8da5150e7da'
            },
            start: new Date(2014,0,1,0,0,0,0).toJSON(),
            finish: new Date(2014,11,31,23,59,59,999).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('verify renewals list for RTT', function(done) {
        server.get('/rest/admin/rightrenewals', {
            right: '5770cad63fccf8da5150e7da'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(2);
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




    var where;

    it('request account current collection for a period', function(done) {

        where = {
            user: userAccount.user._id.toString(),
            dtstart: new Date(2014,1,1, 8).toJSON(),
            dtend: new Date(2014,1,2, 18).toJSON()
        };

        server.get('/rest/admin/collection', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toBeDefined();
            done();
        });
    });


    it('request account collection content', function(done) {


        server.get('/rest/admin/beneficiaries', {
            document: '5740adf51cf1a569643cc520',
            ref: 'RightCollection'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            // FR default
            body.forEach(beneficiary => {
                if (beneficiary.right.special === 'rtt') {
                    right = beneficiary.right;
                }
            });

            done();
        });
    });


    it('remove entry_date rule to make it testable', function(done) {

        right.rules = right.rules.filter(rule => {
            return (rule.type !== 'entry_date');
        });

        server.put('/rest/admin/rights/'+right._id , right, function(res, body) {
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


    it('request list of accessibles rights for a period', function(done) {
        server.get('/rest/admin/accountrights', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            let rtt = body.filter(r => r._id === right._id);
            expect(rtt.length).toEqual(1);
            if (rtt.length > 0) {
                expect(rtt[0].available_quantity).toEqual(8);
            }
            done();
        });
    });



    it('Set a 39H workshedule', function(done) {
        server.put('/rest/admin/accountschedulecalendars/'+schedule, {
            user: userAccount.user._id,
            calendar: {
                _id: '5740adf51cf1a569643cc102'
            },
            from: new Date(2014,0,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);

            schedule = body._id;

            done();
        });
    });


    it('request list of accessibles rights for a period', function(done) {
        server.get('/rest/admin/accountrights', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            let rtt = body.filter(r => r._id === right._id);
            expect(rtt.length).toEqual(1);
            if (rtt.length === 1) {
                expect(rtt[0].available_quantity).toEqual(8);
            }
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
