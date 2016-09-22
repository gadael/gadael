'use strict';

const api = {
    user: require('../../api/User.api'),
    department: require('../../api/Department.api')
};



exports = module.exports = function pages(server)
{

    function createUser()
    {
        return new Promise((resolve, reject) => {
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
                if (200 !== res.statusCode) {
                    return reject(new Error(body.$outcome));
                }

                let createdUser = body;
                delete createdUser.$outcome;

                resolve(createdUser);
            });
        });
    }


    function closeServer()
    {
        return new Promise((resolve) => {
            server.get('/rest/logout', {}, function(res) {
                server.close(() => {
                    resolve(true);
                });
            });
        });
    }


    return server.createAdminSession()
    .then(function(theCreatedAdmin) {

        return server.webshot('/admin/types', 'typelist')
        .then(server.webshot('/admin/types/5740adf51cf1a569643cc508', 'type-edit'))
        .then(server.webshot('/admin/rights', 'rightlist'))
        .then(server.webshot('/admin/rights/577225e3f3c65dd800257bdc', 'right-view-annual-leave'))
        .then(server.webshot('/admin/right-edit/577225e3f3c65dd800257bdc', 'right-edit-annual-leave'))
        .then(server.webshot('/admin/collections', 'collectionlist'))
        .then(server.webshot('/admin/collections/5740adf51cf1a569643cc520', 'collection-edit'))
        .then(server.webshot('/admin/calendars', 'calendarlist'))
        .then(server.webshot('/admin/calendars/5740adf51cf1a569643cc101', 'calendar-edit-5d-40h'))
        .then(server.webshot('/admin/rights-sort', 'right-sort'))
        .then(server.webshot('/admin/exports', 'exports'))
        .then(server.webshot('/admin/export-edit-xlsx', 'export-edit-xlsx'))
        .then(server.webshot('/admin/export-edit-sage', 'export-edit-sage'))
        .then(createUser);
    })
    .then(createdUser => {
        return api.department.createRandom(server.app, null, 3)
        .then(randomDepartment => {

            return server.webshot('/admin/users', 'userlist-with-one-admin')
            .then(server.webshot('/admin/users/'+server.admin._id, 'user-admin-view'))
            .then(server.webshot('/admin/user-edit/'+server.admin._id, 'user-admin-edit'))
            .then(server.webshot('/admin/users/'+createdUser._id, 'user-account-view'))
            .then(server.webshot('/admin/user-edit/'+createdUser._id, 'user-account-edit'))
            .then(server.webshot('/admin/users/'+randomDepartment.manager.user._id, 'user-manager-view'))
            .then(server.webshot('/admin/user-edit/'+randomDepartment.manager.user._id, 'user-manager-edit'))
            .then(server.webshot('/admin/departments', 'departments'))
            .then(server.webshot('/admin/departments/'+randomDepartment.department._id, 'department-view'))
            .then(server.webshot('/admin/department-edit/'+randomDepartment.department._id, 'department-edit'));
        });
    })
    .then(closeServer);
};
