

'use strict';


const helpers = require('../rest/mockServer');
const stubTransport = require('nodemailer-stub-transport');
const resetpassword = require('../../../modules/emails/resetpassword');

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
        .send()
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
