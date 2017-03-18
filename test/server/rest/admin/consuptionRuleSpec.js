'use strict';


describe('consumption rule on admin admin rest service', function() {


    let server,
        userAdmin,      // create the account, the manager
        userAccount,    // create the request
        right,          // right to test
        schedule,
        department,     // department associated to userManager
        renewal;


    beforeEach(function(done) {
        var helpers = require('../mockServer');

        helpers.mockServer('adminConsputionRule', function(_mockServer) {
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
            start: new Date(2014,5,1).toJSON(),
            finish: new Date(2015,4,31).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            renewal = body;
            delete renewal.$outcome;
            done();
        });
    });


    it('create new right', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Rest right test',
            quantity: 1,
            quantity_unit: 'D',
            rules: [{
                title: 'Available if 3 days consumed out of the legal period',
                type: 'consumption',
                consumption: {
                    type: '5740adf51cf1a569643cc508', //Annual paid leaves
                    cap: 24,
                    periods: [
                        {
                            dtstart: new Date(2009, 3, 30), // year should be ignored in tests
                            dtend: new Date(2009, 4,30)
                        },
                        {
                            dtstart: new Date(2009, 9, 31),
                            dtend: new Date(2010, 3, 29)
                        }
                    ]
                },
                interval : {
                    unit : "D",
                    max : 24,
                    min : 3
                }
            }]
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            right = body;

            done();
        });
    });




    it('create renewal on test right', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: {
                _id: right._id
            },
            start: new Date(2014,5,1).toJSON(),
            finish: new Date(2015,4,31).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });



    it('link test right to default collection', function(done) {
        server.post('/rest/admin/beneficiaries', {
            right: right,
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



    it('remove entry_date rule to make it testable', function(done) {

        server.get('/rest/admin/rights/577225e3f3c65dd800257bdc', {}, function(res, paidleave) {
            expect(res.statusCode).toEqual(200);
            paidleave.rules = paidleave.rules.filter(rule => {
                return (rule.type !== 'entry_date');
            });

            server.put('/rest/admin/rights/577225e3f3c65dd800257bdc' , paidleave, function(res, body) {
                expect(res.statusCode).toEqual(200);
                done();
            });
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

    let where;
    let nbRights;

    it('request list of accessibles rights before request creation', function(done) {

        where = {
            user: userAccount.user._id.toString(),
            dtstart: new Date(2014,6,1, 8).toJSON(),
            dtend: new Date(2014,6,2, 18).toJSON()
        };

        server.get('/rest/admin/accountrights', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(0);
            nbRights = body.length;
            done();
        });
    });


    it('Create absence', function(done) {

        var distribution = [
            {
                right: {
                    id: '577225e3f3c65dd800257bdc',
                    renewal:renewal._id
                },
                quantity: 3,
                events: [{
                    dtstart: new Date(2014,11,1, 8).toJSON(),
                    dtend: new Date(2014,11,1, 18).toJSON()
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


    it('request list of accessibles rights after request creation', function(done) {

        server.get('/rest/admin/accountrights', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1+nbRights);
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
