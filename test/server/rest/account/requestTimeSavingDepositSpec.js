'use strict';


describe('request time saving deposit rest service', function() {


    var server,

        userAdmin,      // create the account, the manager
        userAccount,    // create the request
        userManager,    // should be assigned to approval

        right1,                 // source
        timeSavingAccount1,     // target for deposit

        department,     // department associated to userManager
        collection,     // user account collection, contain right1 & 2

        request1;


    beforeEach(function(done) {
        var helpers = require('../mockServer');

        helpers.mockServer('accountRequestTimeSavingDeposit', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request list of current requests as anonymous', function(done) {
        server.get('/rest/account/requests', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    // admin actions


    it('Create admin session needed for prerequisits', function(done) {
        server.createAdminUser().then(function(user) {
            userAdmin = user;
            expect(userAdmin.user.roles.admin).toBeDefined();
            server.authenticateUser(userAdmin).then(() => {
                done();
            }).catch(done);
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
            quantity_unit: 'D',
            rules: [{
                type: 'request_period',
                'title': 'Request period must be in the renewal period'
            }]
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            right1 = body;
            expect(right1._id).toBeDefined();
            done();
        });
    });

    it('link the right1 to collection', function(done) {
        server.post('/rest/admin/beneficiaries', {
            ref: 'RightCollection',
            document: collection._id,
            right: right1
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create renewal 1', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right1._id,
            start: new Date(2015,1,1).toJSON(),
            finish: new Date(2016,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            right1.renewal = body;
            done();
        });
    });



    it('create time saving account 1', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Time saving account 1',
            special: 'timesavingaccount',
            timeSavingAccount: {
                max: 10
            }
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            timeSavingAccount1 = body;
            expect(timeSavingAccount1._id).toBeDefined();
            done();
        });
    });

    it('link the timeSavingAccount1 to collection', function(done) {
        server.post('/rest/admin/beneficiaries', {
            ref: 'RightCollection',
            document: collection._id,
            right: timeSavingAccount1
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create renewal for time saving account 1', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: timeSavingAccount1._id,
            start: new Date(2014,1,1).toJSON(),
            finish: new Date(2019,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            timeSavingAccount1.renewal = body;
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
            done();

        });

    });



    it('link user to collection', function(done) {
        server.post('/rest/admin/accountcollections', {
            user: userAccount.user._id,
            rightCollection: collection,
            from: new Date(2014,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create the manager user', function(done) {
        server.createUserManager(department, department)
        .then(function(manager) {
            userManager = manager;
            expect(userManager.user.roles.manager.department.length).toEqual(1);
            done();
        });

    });






    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    // account session part


    it('Authenticate user account session', function(done) {
        expect(userAccount.user.roles.account).toBeDefined();
        server.authenticateUser(userAccount).then(function() {
            done();
        });

    });


    it('make sure to be in the department', function(done) {
        server.get('/rest/user', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            if (body.department) {
                expect(body.department._id).toEqual(department._id);
            }
            done();
        });
    });


    it('request list of current requests as account first', function(done) {
        server.get('/rest/account/requests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0);
            done();
        });
    });


    it('Create time saving account deposit', function(done) {

        var quantity = 1.5;

        server.post('/rest/account/requests', {

                time_saving_deposit: [{
                    quantity: quantity,
                    quantity_unit: 'D',
                    from: {
                        renewal: right1.renewal
                    },
                    to: {
                        renewal: timeSavingAccount1.renewal
                    }
                }]
            },
            function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.time_saving_deposit).toBeDefined();
            if (body.time_saving_deposit) {
                expect(body.user.id._id).toEqual(userAccount.user._id.toString());
                expect(body.user.name).toBeDefined();
                expect(body.approvalSteps.length).toEqual(1);
                expect(body.requestLog.length).toEqual(1);
                expect(body.events.length).toEqual(0);
                expect(body.time_saving_deposit.length).toEqual(1);
                if (undefined !== body.time_saving_deposit[0]) {
                    expect(body.time_saving_deposit[0].quantity).toEqual(quantity);
                }
            }
            request1 = body;
            done();
        });
    });


    it('request list of current requests as account', function(done) {
        server.get('/rest/account/requests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);

            done();
        });
    });



    it('get one request', function(done) {
        server.get('/rest/account/requests/'+request1._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.time_saving_deposit).toBeDefined();
            if (body.time_saving_deposit) {
                expect(body.time_saving_deposit.length).toEqual(1);
            }
            done();
        });
    });


    it('update time saving account deposit', function(done) {

        var quantity = 4;

        server.put('/rest/account/requests/'+request1._id, {
                time_saving_deposit: [{
                    quantity: quantity,
                    quantity_unit: 'D',
                    from: {
                        renewal: right1.renewal
                    },
                    to: {
                        renewal: timeSavingAccount1.renewal
                    }
                }]
            }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.requestLog).toBeDefined();
            if (body.requestLog) {
                expect(body.requestLog.length).toEqual(2);
                expect(body.absence.distribution.length).toEqual(0);
                expect(body.time_saving_deposit[0].quantity).toEqual(quantity);

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


    it('login as admin and try to delete right and time saving account', function(done) {
        server.authenticateUser(userAdmin).then((user) => {

            server.delete('/rest/admin/rights/'+right1._id, function(res, body) {
                expect(res.statusCode).toEqual(500);
                expect(body.$outcome.success).toBeFalsy();

                server.delete('/rest/admin/rights/'+timeSavingAccount1._id, function(res, body) {
                    expect(res.statusCode).toEqual(500);
                    expect(body.$outcome.success).toBeFalsy();
                    done();
                });
            });

        }).catch(done);
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });




    // login as manager (approver)


    it('Authenticate user manager session', function(done) {
        expect(userManager.user.roles.manager).toBeDefined();
        server.authenticateUser(userManager).then(function() {
            done();
        });

    });


    it('list waiting requests as manager', function(done) {
        server.get('/rest/manager/waitingrequests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            done();
        });
    });


    var approvalStep1;

    it('get request 1', function(done) {
        server.get('/rest/manager/waitingrequests/'+request1._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.approvalSteps).toBeDefined();
            if (body.approvalSteps) {
                expect(body.approvalSteps.length).toEqual(1);
                approvalStep1 = body.approvalSteps[0];
            }
            done();
        });
    });


    it('accept request 1 approval step', function(done) {
        expect(approvalStep1).toBeDefined();
        if (!approvalStep1) {
            return done();
        }
        server.put('/rest/manager/waitingrequests/'+request1._id, {
            approvalStep: approvalStep1._id,
            action: 'wf_accept'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.requestLog).toBeDefined();
            if (body.requestLog) {
                var lastLog = body.requestLog[body.requestLog.length -1];
                expect(lastLog.action).toEqual('wf_end');
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


    // get a new author session

    it('Authenticate user account session', function(done) {
        expect(userAccount.user.roles.account).toBeDefined();
        server.authenticateUser(userAccount).then(function() {
            done();
        });

    });


    it('list time saving accounts', function(done) {
        server.get('/rest/account/timesavingaccounts', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            var timeSavingAccount = body[0];
            if (undefined !== timeSavingAccount) {
                expect(timeSavingAccount.availableQuantity).toBeDefined();
                expect(timeSavingAccount.availableQuantity).toEqual(4);
            }
            done();
        });
    });


    it('delete a request', function(done) {
        server.delete('/rest/account/requests/'+request1._id, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('request list of current requests as account', function(done) {
        server.get('/rest/account/requests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            expect(body[0]).toBeDefined();
            if (body[0] && body[0].status) {
                expect(body[0].status.deleted).toEqual('waiting');
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


    it('login as admin and try to delete right and time saving account', function(done) {

        // cant delete because request is not yet deleted

        server.authenticateUser(userAdmin).then((user) => {

            server.delete('/rest/admin/rights/'+right1._id, function(res, body) {
                expect(res.statusCode).toEqual(500);

                server.delete('/rest/admin/rights/'+timeSavingAccount1._id, function(res, body) {
                    expect(res.statusCode).toEqual(500);
                    done();
                });
            });

        }).catch(done);
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('Authenticate user manager session', function(done) {
        expect(userManager.user.roles.manager).toBeDefined();
        server.authenticateUser(userManager).then(function() {
            done();
        });

    });


    it('list waiting requests', function(done) {
        server.get('/rest/manager/waitingrequests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1); // the request wait to be deleted
            done();
        });
    });


    var approvalStep2;

    it('get request 1 in waiting delete state', function(done) {
        server.get('/rest/manager/waitingrequests/'+request1._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.approvalSteps).toBeDefined();
            if (body.approvalSteps) {
                expect(body.approvalSteps.length).toEqual(1);
                approvalStep2 = body.approvalSteps[0];
            }
            done();
        });
    });


    it('accept request 1 approval step for delete', function(done) {
        server.put('/rest/manager/waitingrequests/'+request1._id, {
            approvalStep: approvalStep2._id,
            action: 'wf_accept'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.requestLog).toBeDefined();
            if (body.requestLog) {
                var lastLog = body.requestLog[body.requestLog.length -1];
                expect(lastLog.action).toEqual('delete');
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


    it('login as admin and delete right and time saving account while there is a deleted request', function(done) {

        server.authenticateUser(userAdmin).then((user) => {

            server.delete('/rest/admin/rights/'+right1._id, function(res, body) {
                expect(res.statusCode).toEqual(200);
                if (200 !== res.statusCode) {
                    console.log(body.$outcome);
                }

                server.delete('/rest/admin/rights/'+timeSavingAccount1._id, function(res, body) {
                    expect(res.statusCode).toEqual(200);
                    if (200 !== res.statusCode) {
                        console.log(body.$outcome);
                    }
                    done();
                });
            });

        }).catch(done);
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
