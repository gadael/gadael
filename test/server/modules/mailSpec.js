

'use strict';


const helpers = require('../rest/mockServer');
const stubTransport = require('nodemailer-stub-transport');
const resetpassword = require('../../../modules/emails/resetpassword');
const pendingapproval = require('../../../modules/emails/pendingapproval');
const requestaccepted = require('../../../modules/emails/requestaccepted');
const requestrejected = require('../../../modules/emails/requestrejected');
const requestcreated = require('../../../modules/emails/requestcreated');
const usercreated = require('../../../modules/emails/usercreated');
const rolesupdated = require('../../../modules/emails/rolesupdated');
const approbalertquery = require('../../../modules/approbalert');
const approbalert = require('../../../modules/emails/approbalert');

const api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js')
};

describe('Mail object', function() {


    let server, user;

    beforeEach(function(done) {
        helpers.mockServer('MailSpecTestDatabase', function(_mockServer) {
            server = _mockServer;
            server.app.config.mailtransport = stubTransport();
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


    it('send resetpassword', function(done) {
        resetpassword(server.app, 'RANDOM_TOKEN', user)
        .then(mail => {
            return mail.send();
        })
        .then(message => {
            expect(message._id).toBeDefined();
            expect(message.emailSent).toBeTruthy();
            done();
        })
        .catch(done);
    });

    /**
     * create a fake work period recover request
     * @return {Promise}
     */
    function createPendingWorkperiodRecovery()
    {
        let Request = server.app.db.models.Request;

        let workperiod = new Request();
        workperiod.user = {
            id: user._id,
            name: user.getName()
        };

        workperiod.createdBy = {
            id: user._id,
            name: user.getName()
        };

        workperiod.status = {
            created: 'waiting',
            deleted: null
        };

        workperiod.workperiod_recover = [{
            right: {
                quantity_unit: 'D',
                name: 'Test'
            },
            gainedQuantity: 0,
            quantity: 0
        }];


        workperiod.approvalSteps = [{
            status: 'waiting',
            department: 'Test',
            approvers: [user._id],
            operator: 'AND'
        }];

        workperiod.requestLog = [{
            action: 'create',
            userCreated: {
                id: user._id,
                name: user.getName()
            },
            timeCreated: new Date()
        }];

        return workperiod.save();
    }


    it('send pending approval', function(done) {

        createPendingWorkperiodRecovery()
        .then(wp => {
            return pendingapproval(server.app, wp);
        })
        .then(mail => {
            return mail.send();
        })
        .then(message => {
            expect(message._id).toBeDefined();
            expect(message.emailSent).toBeTruthy();
            done();
        })
        .catch(err => {
            console.log(err);
            done(err);
        });
    });


    it('send request accepted', function(done) {
        createPendingWorkperiodRecovery()
        .then(wp => {
            // add fake acceptation from approver

            wp.status.created = 'accepted';

            wp.approvalSteps[0].status = 'accepted';

            wp.requestLog.push({
                action: 'wf_accept',
                userCreated: {
                    id: user._id,
                    name: user.getName()
                },
                timeCreated: new Date(),
                approvalStep: wp.approvalSteps[0]._id
            });

            return wp.save();
        })
        .then(wp => {
            return requestaccepted(server.app, wp);
        })
        .then(mail => {
            return mail.send();
        })
        .then(message => {
            expect(message._id).toBeDefined();
            expect(message.emailSent).toBeTruthy();
            done();
        })
        .catch(err => {
            console.log(err);
            done(err);
        });
    });



    it('send request rejected', function(done) {
        createPendingWorkperiodRecovery()
        .then(wp => {
            // add fake acceptation from approver

            wp.status.deleted = 'accepted';

            wp.approvalSteps[0].status = 'rejected';

            wp.requestLog.push({
                action: 'wf_reject',
                userCreated: {
                    id: user._id,
                    name: user.getName()
                },
                timeCreated: new Date(),
                approvalStep: wp.approvalSteps[0]._id
            });

            return wp.save();
        })
        .then(wp => {
            return requestrejected(server.app, wp);
        })
        .then(mail => {
            return mail.send();
        })
        .then(message => {
            expect(message._id).toBeDefined();
            expect(message.emailSent).toBeTruthy();
            done();
        })
        .catch(err => {
            console.log(err);
            done(err);
        });
    });




    it('send request created', function(done) {
        createPendingWorkperiodRecovery()
        .then(wp => {
            // add fake acceptation from approver

            wp.status.created = 'accepted';
            wp.approvalSteps = [];
            return wp.save();
        })
        .then(wp => {
            return requestcreated(server.app, wp);
        })
        .then(mail => {
            return mail.send();
        })
        .then(message => {
            expect(message._id).toBeDefined();
            expect(message.emailSent).toBeTruthy();
            done();
        })
        .catch(err => {
            console.log(err);
            done(err);
        });
    });






    it('send user created', function(done) {
        usercreated(server.app, user)
        .then(mail => {
            return mail.send();
        })
        .then(message => {
            expect(message._id).toBeDefined();
            expect(message.emailSent).toBeTruthy();
            done();
        })
        .catch(err => {
            console.log(err);
            done(err);
        });
    });



    it('send roles updated', function(done) {
        rolesupdated(server.app, user, ['Absence account'])
        .then(mail => {
            return mail.send();
        })
        .then(message => {
            expect(message._id).toBeDefined();
            expect(message.emailSent).toBeTruthy();
            done();
        })
        .catch(err => {
            console.log(err);
            done(err);
        });
    });


    it('send approbation alert', function(done) {
        createPendingWorkperiodRecovery()
        .then(wp => {
            approbalert(server.app, wp, user)
            .then(mail => {
                return mail.send();
            })
            .then(message => {
                expect(message._id).toBeDefined();
                expect(message.emailSent).toBeTruthy();
                done();
            })
            .catch(err => {
                console.log(err);
                done(err);
            });
        });
    });

    let lastCreatedRequestsCount = 0;

    it('verify the approbalert query', function(done) {
        createPendingWorkperiodRecovery()
        .then(wp => {
            server.app.config.company.approb_alert = -1; // no delay, all request shoud be notified
                                                         // 0 disable the functionality
            approbalertquery(server.app)
            .then(list => {
                lastCreatedRequestsCount = list.length;
                expect(list.length).toBeGreaterThan(0);
                return done();
            })
            .catch(err => {
                console.log(err);
                done(err);
            });
        });
    });

    let workingPeriod;

    it('increment alert count with one more request', function(done) {
        createPendingWorkperiodRecovery()
        .then(wp => {
            workingPeriod = wp;
            approbalertquery(server.app)
            .then(list => {
                expect(list.length).toBe(lastCreatedRequestsCount + 1);
                return done();
            })
            .catch(err => {
                console.log(err);
                done(err);
            });
        });
    });

    it('Do not send alert on deleted request in waiting state', function(done) {
        workingPeriod.status.deleted = 'accepted';
        workingPeriod.save()
        .then(wp => {
            approbalertquery(server.app)
            .then(list => {
                expect(list.length).toBe(lastCreatedRequestsCount);
                return done();
            })
            .catch(err => {
                console.log(err);
                done(err);
            });
        });
    });

    it('close the mock server', function(done) {
        server.close(done);
    });


});
