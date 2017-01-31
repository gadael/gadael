'use strict';

const api = {
    user: require('../../api/User.api'),
    department: require('../../api/Department.api'),
    request: require('../../api/Request.api')
};




exports = module.exports = function pages(server) {

    function createUser() {
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


    function closeServer() {
        return new Promise((resolve) => {
            server.get('/rest/logout', {}, function(res) {
                server.close(() => {
                    resolve(true);
                });
            });
        });
    }


    function logout() {
        return new Promise((resolve, reject) => {
            server.get('/rest/logout', {}, function(res, body) {
                if (res.statusCode === 200) {
                    return resolve(true);
                }
                reject(new Error(body.$outcome.alert[0].message));
            });
        });
    }


    function loginAsManager() {
        return new Promise((resolve, reject) => {

            server.post('/rest/anonymous/formlogin', {
                username: 'manager@example.com', // Jane Doe
                password: 'secret'
            }, function(res, body) {
                if (res.statusCode === 200) {
                    return resolve(true);
                }

                reject(new Error(body.$outcome.alert[0].message));
            });
        });
    }



    function loginAsAccount() {
        return new Promise((resolve, reject) => {

            server.post('/rest/anonymous/formlogin', {
                username: 'user1@example.com', // Pamila Cannella
                password: 'secret'
            }, function(res, body) {
                if (res.statusCode === 200) {
                    return resolve(true);
                }

                reject(new Error(body.$outcome.alert[0].message));
            });
        });
    }

    let user1, beneficiary1;

    const ANNUAL_LEAVE = '577225e3f3c65dd800257bdc';

    return server.createAdminSession()
    .then(function(theCreatedAdmin) {

        return server.webshot('/admin/types', 'typelist')
        .then(server.webshot('/admin/types/5740adf51cf1a569643cc508', 'type-edit'))
        .then(server.webshot('/admin/rights', 'rightlist'))
        .then(server.webshot('/admin/rights/'+ANNUAL_LEAVE, 'right-view-annual-leave'))
        .then(server.webshot('/admin/right-edit/'+ANNUAL_LEAVE, 'right-edit-annual-leave'))
        .then(server.webshot('/admin/rightrule-edit?right='+ANNUAL_LEAVE, 'rightrule-edit-annual-leave'))
        .then(server.webshot('/admin/rightrenewal-edit?right='+ANNUAL_LEAVE, 'rightrenewal-edit-annual-leave'))
        .then(server.webshot('/admin/collections', 'collectionlist'))
        .then(server.webshot('/admin/collections/5740adf51cf1a569643cc520', 'collection-edit'))
        .then(server.webshot('/admin/collections/5740adf51cf1a569643cc522', 'collection-parttime-edit'))
        .then(server.webshot('/admin/calendars', 'calendarlist'))
        .then(server.webshot('/admin/calendars/5740adf51cf1a569643cc101', 'calendar-edit-5d-40h'))
        .then(server.webshot('/admin/rights-sort', 'right-sort'))
        .then(server.webshot('/admin/exports', 'exports'))
        .then(server.webshot('/admin/export-edit-xlsx', 'export-edit-xlsx'))
        .then(server.webshot('/admin/export-edit-sage', 'export-edit-sage'))
        .then(createUser);
    })
    .then(createdUser => {
        return api.department.createScreenshotDepartment(server.app, null)
        .then(randomDepartment => {

            user1 = randomDepartment.members[0].user;

            return user1.roles.account.getRightBeneficiary(ANNUAL_LEAVE)
            .then(beneficiary => {

                beneficiary1 = beneficiary;

                return server.webshot('/admin/users', 'userlist-with-one-admin')
                .then(server.webshot('/admin/users/'+server.admin._id, 'user-admin-view'))
                .then(server.webshot('/admin/user-edit/'+server.admin._id, 'user-admin-edit'))
                .then(server.webshot('/admin/users/'+user1._id, 'user-account-view'))
                .then(server.webshot('/admin/user-edit/'+user1._id, 'user-account-edit'))
                .then(server.webshot('/admin/users/'+user1._id+'/account-collections', 'user-account-collections'))
                .then(server.webshot('/admin/users/'+user1._id+'/account-schedulecalendars', 'user-account-schedulecalendars'))
                .then(server.webshot('/admin/users/'+user1._id+'/account-nwdayscalendars', 'user-account-nwdayscalendars'))
                .then(server.webshot('/admin/users/'+user1._id+'/account-renewalquantity', 'user-account-renewalquantity'))
                .then(server.webshot('/admin/beneficiaries/'+beneficiary1._id+'?user='+user1._id, 'user-account-annual-leave'))
                .then(server.webshot('/admin/users/'+randomDepartment.manager.user._id, 'user-manager-view'))
                .then(server.webshot('/admin/user-edit/'+randomDepartment.manager.user._id, 'user-manager-edit'))
                .then(server.webshot('/admin/departments', 'departments'))
                .then(server.webshot('/admin/departments/'+randomDepartment.department._id, 'department-view'))
                .then(server.webshot('/admin/department-edit/'+randomDepartment.department._id, 'department-edit'));

            });
        });
    })
    .then(() => {
        return logout()
        .then(loginAsAccount)
        .then(() => {
            let dtstart = new Date(2016, 6, 2, 8,0,0,0);
            let dtend = new Date(2016, 6, 2, 18,0,0,0);
            return api.request.createRandomAbsence(server.app, user1, dtstart, dtend, 1, new Date(2016, 6, 1, 12,0,0,0))
            .then(() => {
                return server.webshot('/home', 'account-home')
                .then(server.webshot('/account/calendar', 'account-calendar'))
                .then(server.webshot('/account/beneficiaries', 'account-rights'))
                .then(server.webshot('/account/beneficiaries/'+beneficiary1._id, 'account-annual-leave'))
                .then(server.webshot('/account/requests', 'account-requests'))
                .then(server.webshot('/account/requests/absence-edit', 'account-absence-create'))
                .then(server.webshot('/account/requests/time-saving-deposit-edit', 'account-time-saving-deposit-create'))
                .then(server.webshot('/account/requests/workperiod-recover-edit', 'account-workperiod-recover-create'));
            });

        });
    })
    .then(() => {
        return logout()
        .then(loginAsManager)
        .then(() => {
            return server.webshot('/home', 'manager-home')
            .then(server.webshot('/manager/waitingrequests', 'manager-waiting-requests'));
        });
    })
    .then(function() {
        return true;
    })
    .then(closeServer);
};
