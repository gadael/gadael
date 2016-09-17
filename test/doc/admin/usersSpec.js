'use strict';

const helpers = require('../screenServer');
const api = {
    user: require('../../../api/User.api'),
    department: require('../../../api/Department.api')
};

describe('admin screenshots for documentation', function() {


    var server;


    beforeEach(function(done) {
        helpers.mockServer('docAdminUsersSpec', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    /**
     * Document created by the test
     */
    var createdUser;

    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });



    it('Create admin session', function(done) {
        server.createAdminSession().then(function(theCreatedAdmin) {
            expect(theCreatedAdmin.isActive).toBeTruthy();

            server.webshot('/admin/types', 'typelist')
            .then(server.webshot('/admin/types/5740adf51cf1a569643cc508', 'type-edit'))
            .then(server.webshot('/admin/rights', 'rightlist'))
            .then(server.webshot('/admin/rights/577225e3f3c65dd800257bdc', 'right-view-annual-leave'))
            .then(server.webshot('/admin/right-edit/577225e3f3c65dd800257bdc', 'right-edit-annual-leave'))
            .then(server.webshot('/admin/collections', 'collectionlist'))
            .then(server.webshot('/admin/collections/5740adf51cf1a569643cc520', 'collection-edit'))
            .then(server.webshot('/admin/calendars', 'calendarlist'))
            .then(server.webshot('/admin/calendars/5740adf51cf1a569643cc101', 'calendar-edit-5d-40h'))
            .then(server.webshot('/admin/rights-sort', 'right-sort'))
            .then(done);
        });
    });


    it('create new user', function(done) {
        server.post('/rest/admin/users', {
            firstname: 'John',
            lastname: 'Doe',
            email: 'john.doe@example.com',
            department: null,
            setpassword: true,
            newpassword: 'secret',
            newpassword2: 'secret',
            isActive: true,
            roles: {
                account: {
                    arrival: new Date(),
                    seniority: new Date(),
                    sage: {
                        registrationNumber: '00254971'
                    }
                }
            }
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            createdUser = body;
            delete createdUser.$outcome;


            server.webshot('/admin/users', 'userlist-with-one-admin')
            .then(server.webshot('/admin/users/'+server.admin._id, 'user-admin-view'))
            .then(server.webshot('/admin/user-edit/'+server.admin._id, 'user-admin-edit'))
            .then(server.webshot('/admin/users/'+createdUser._id, 'user-account-view'))
            .then(server.webshot('/admin/user-edit/'+createdUser._id, 'user-account-edit'))
            .then(done);

        });
    });


    it('create a random manager', function(done) {
        api.department.createRandom(server.app, null, 3)
        .then(randomDepartment => {
            expect(randomDepartment.department).toBeDefined();
            expect(randomDepartment.manager.user).toBeDefined();

            server.webshot('/admin/users/'+randomDepartment.manager.user._id, 'user-manager-view')
            .then(server.webshot('/admin/user-edit/'+randomDepartment.manager.user._id, 'user-manager-edit'))
            .then(server.webshot('/admin/departments', 'departments'))
            .then(server.webshot('/admin/departments/'+randomDepartment.department._id, 'department-view'))
            .then(server.webshot('/admin/department-edit/'+randomDepartment.department._id, 'department-edit'))
            .then(done);
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
