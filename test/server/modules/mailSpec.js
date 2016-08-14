

'use strict';


const helpers = require('../rest/mockServer');
const stubTransport = require('nodemailer-stub-transport');
const resetpassword = require('../../../modules/emails/resetpassword');
const pendingapproval = require('../../../modules/emails/pendingapproval');

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


    it('send pending approval', function(done) {

        // create a fake work period recover request
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

        // The real test begin here

        workperiod.save()
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


    it('close the mock server', function(done) {
        server.close(done);
    });


});
