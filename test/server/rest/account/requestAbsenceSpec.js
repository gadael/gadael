'use strict';


describe('request absence account rest service', function() {


    var server,
        userAdmin,      // create the account, the manager
        userAccount,    // create the request
        userManager,    // should be assigned to approval
        userStranger,   // another user

        right1,         // distribution in request
        right2,

        department,     // department associated to userManager
        collection,     // user account collection, contain right1 & 2

        request1;


    beforeEach(function(done) {
        var helpers = require('../mockServer');

        helpers.mockServer('accountRequestAbsence', function(_mockServer) {
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
        server.createAdminSession().then(function(user) {
            userAdmin = user;
            expect(userAdmin.roles.admin).toBeDefined();
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


    it('create Right 2', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Right 2',
            quantity: 25,
            quantity_unit: 'D'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            right2 = body;
            expect(right2._id).toBeDefined();
            done();
        });
    });


    it('link the right2 to collection', function(done) {
        server.post('/rest/admin/beneficiaries', {
            ref: 'RightCollection',
            document: collection._id,
            right: right2
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });




    it('create renewal 2', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right2._id,
            start: new Date(2015,1,1).toJSON(),
            finish: new Date(2016,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            right2.renewal = body;
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


    it('create the stranger account', function(done) {
        server.createUserStranger(department)
        .then(function(account) {
            userStranger = account;
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

    var where;

    it('request account current collection', function(done) {

        where = {
            dtstart: new Date(2015,1,1, 8).toJSON(),
            dtend: new Date(2015,1,1, 18).toJSON()
        };

        server.get('/rest/account/collection', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toBeDefined();
            done();
        });
    });



    it('request list of accessibles rights', function(done) {
        server.get('/rest/account/accountrights', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(2);

            // check quantities of renewal, with 0 consumed, the quantities should be defaults
            if (body.length === 2) {
                expect(body[0].available_quantity).toEqual(right1.quantity);
                expect(body[1].available_quantity).toEqual(right2.quantity);
            }
            done();
        });
    });


    it('check that right1 is not accessible if the associated rule is not verified', function(done) {
        where = {
            dtstart: new Date(2014,12,1, 8).toJSON(),
            dtend: new Date(2014,12,1, 18).toJSON()
        };

        server.get('/rest/account/accountrights', where, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            // check quantities of renewal, with 0 consumed, the quantities should be defaults
            if (body.length === 1) {
                expect(body[0].available_quantity).toEqual(right2.quantity);
            }
            done();
        });
    });

    it('Check email number before creation', function(done) {
        const Message = server.app.db.models.Message;
        Message.countDocuments().then(n => {
            expect(n).toEqual(0);
            done();
        });
    });


    it('Create absence', function(done) {
        var distribution = [
            {
                right: {
                    id: right1._id,
                    renewal:right1.renewal._id
                },
                quantity: 1,
                events: [{
                    dtstart: new Date(2015,1,1, 8).toJSON(),
                    dtend: new Date(2015,1,1, 18).toJSON()
                }]
            },
            {
                right: {
                    id: right2._id,
                    renewal:right2.renewal._id
                },
                quantity: 1,
                events: [{
                    dtstart: new Date(2015,1,1, 8).toJSON(),
                    dtend: new Date(2015,1,1, 18).toJSON()
                }]
            }
        ];

        server.post('/rest/account/requests', { absence: { distribution: distribution } }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.absence).toBeDefined();

            if (body.absence) {
                expect(body.user.id._id).toEqual(userAccount.user._id.toString());
                expect(body.user.name).toBeDefined();
                expect(body.absence.distribution.length).toEqual(2);
                expect(body.approvalSteps.length).toEqual(1);
                expect(body.requestLog.length).toEqual(1);
                expect(body.events.length).toEqual(2);
            }
            request1 = body;
            delete request1.$outcome;
            done();
        });
    });

    it('Check email number after creation', function(done) {
        const Message = server.app.db.models.Message;
        Message.countDocuments().then(n => {
            expect(n).toEqual(1);
            done();
        });
    });

    let request1_events_ids = [];
    let request1_elems_ids = [];


    it('request list of current requests as account', function(done) {
        server.get('/rest/account/requests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (body[0]) {
                expect(body[0].events[0].dtstart).toBeDefined();
                expect(body[0].events[0].dtend).toBeDefined();
                expect(body[0].events[1].dtstart).toBeDefined();
                expect(body[0].events[1].dtend).toBeDefined();

                request1_events_ids.push(body[0].events[0]._id);
                request1_events_ids.push(body[0].events[1]._id);

                request1_elems_ids.push(body[0].absence.distribution[0]._id);
                request1_elems_ids.push(body[0].absence.distribution[1]._id);
            }
            done();
        });
    });



    it('get one request', function(done) {
        server.get('/rest/account/requests/'+request1._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.absence).toBeDefined();
            if (body.absence) {
                expect(body.absence.distribution).toBeDefined();
                expect(body._id).toEqual(request1._id);
                expect(body.absence.distribution[0].consumedQuantity).toEqual(1);
                expect(body.events.length).toEqual(2);

                let event = body.events[0];

                expect(event.summary).toBeDefined();
                expect(event.summary.length).toBeGreaterThan(0);
            }
            done();
        });
    });



    function getAccountRight() {
        return new Promise((resolve, reject) => {

            server.get('/rest/account/beneficiaries', {
                moment: new Date(2015,1,2).toJSON()
            }, function(res, body) {

                if (!Array.isArray(body)) {
                    return reject(new Error(body.$outcome.alert[0].message));
                }

                resolve(body.find(ar => {
                    return (ar.right._id === right1._id.toString());
                }));
            });
        });
    }




    it('verify consuption status', function(done) {
        getAccountRight()
        .then(accountRight1 => {
            expect(accountRight1.waiting_quantity.created).toEqual(1);
            done();
        });
    });


    it('update request distribution', function(done) {

        var distribution = [
            {
                right: {
                    id: right1._id,
                    renewal:right1.renewal._id
                },
                quantity: 5,
                events: [{
                    dtstart: new Date(2015,1,1, 8).toJSON(),
                    dtend: new Date(2015,1,5, 18).toJSON()
                }]
            }
        ];

        server.put('/rest/account/requests/'+request1._id, { absence: { distribution: distribution } }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.absence).toBeDefined();
            if (body.absence) {
                expect(body.absence.distribution.length).toEqual(1);
                expect(body.absence.rightCollection).toBeDefined();
                expect(body.requestLog.length).toEqual(2);
            }

            expect(body.events.length).toEqual(1);
            done();
        });
    });

    it('Check email number after update', function(done) {
        const Message = server.app.db.models.Message;
        Message.countDocuments().then(n => {
            expect(n).toEqual(2);
            done();
        });
    });

    it('make sure the 2 previous events are now deleted', function(done) {
        const CalendarEvent = server.app.db.models.CalendarEvent;
        CalendarEvent.find({ _id: { $in: request1_events_ids } }).exec()
        .then(arr => {
            expect(arr.length).toEqual(0);
            done();
        });
    });


    it('make sure the 2 previous absence elements are now deleted', function(done) {
        let AbsenceElem = server.app.db.models.AbsenceElem;
        AbsenceElem.find({ _id: { $in: request1_elems_ids } }).exec()
        .then(arr => {
            expect(arr.length).toEqual(0);
            done();
        });
    });


    it('verify consuption status after update', function(done) {
        getAccountRight()
        .then(accountRight1 => {
            expect(accountRight1.waiting_quantity.created).toEqual(5);
            done();
        });
    });




    it('forbid creation of out of bounds request', function(done) {

        var distribution = [
            {
                right: {
                    id: right1._id,
                    renewal:right1.renewal._id
                },
                quantity: 22, // there should be only 20 days left
                events: [{
                    dtstart: new Date(2015,1,1, 8).toJSON(),
                    dtend: new Date(2015,1,22, 18).toJSON()
                }]
            }
        ];

        server.post('/rest/account/requests', { absence: { distribution: distribution } }, function(res, body) {
            expect(res.statusCode).toEqual(500);
            expect(body.$outcome).toBeDefined();
            done();
        });
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    // stranger part


    it('Authenticate user stranger session', function(done) {
        expect(userStranger.user.roles.account).toBeDefined();
        server.authenticateUser(userStranger).then(function() {
            done();
        });

    });


    it('request list of current requests as account', function(done) {
        server.get('/rest/account/requests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0);
            done();
        });
    });


    it('try to get unaccessible request', function(done) {
        server.get('/rest/account/requests/'+request1._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(404);
            expect(body.$outcome.status).toBeFalsy();
            done();
        });
    });


    it('try to delete a request', function(done) {
        server.delete('/rest/account/requests/'+request1._id, function(res, body) {
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


    // login as manager (approver)


    it('Authenticate user manager session', function(done) {
        expect(userManager.user.roles.manager).toBeDefined();
        server.authenticateUser(userManager).then(function() {
            done();
        });

    });


    it('list waiting requests', function(done) {
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

    it('Check email number after approval', function(done) {
        const Message = server.app.db.models.Message;
        Message.countDocuments().then(n => {
            expect(n).toEqual(3);
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


    it('verify consuption status after approval', function(done) {
        getAccountRight()
        .then(accountRight1 => {
            expect(accountRight1.waiting_quantity.created).toEqual(0);
            expect(accountRight1.consumed_quantity).toEqual(5);
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


    it('verify consuption status after the delete request', function(done) {
        getAccountRight()
        .then(accountRight1 => {
            expect(accountRight1.waiting_quantity.deleted).toEqual(5);
            expect(accountRight1.consumed_quantity).toEqual(0);
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
