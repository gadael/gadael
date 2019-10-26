define(['angular', 'app'], function(angular, app) {
	'use strict';

	return app.config(['$routeProvider', function($routeProvider) {
        var baseUrl = document.location.href.split('#')[0];

		$routeProvider.when('/login/createfirstadmin', {
			templateUrl: baseUrl + 'partials/login/createfirstadmin.html',
			controller: 'CreateFirstAdmin'
		});

		$routeProvider.when('/anonymous/invitation/:emailToken', {
			templateUrl: baseUrl + 'partials/login/invitation.html',
			controller: 'Invitation'
		});

		$routeProvider.when('/home', {
			templateUrl: baseUrl + 'partials/home.html',
			controller: 'Home'
		});

		$routeProvider.when('/signup', {
			templateUrl: baseUrl + 'partials/signup.html',
			controller: 'Signup'
		});

		$routeProvider.when('/login', {
			templateUrl: baseUrl + 'partials/login/login.html',
			controller: 'Login'
		});

		$routeProvider.when('/login/forgot', {
			templateUrl: baseUrl + 'partials/login/forgot.html',
			controller: 'LoginForgot'
		});

		$routeProvider.when('/login/reset/:email/:token/', {
			templateUrl: baseUrl + 'partials/login/reset.html',
			controller: 'LoginReset'
		});

		$routeProvider.when('/login/google/callback/', {
			templateUrl: baseUrl + 'partials/login/google.html',
			controller: 'LoginGoogle'
		});

		$routeProvider.when('/login/ldap/callback/', {
			templateUrl: baseUrl + 'partials/login/ldap.html',
			controller: 'LoginLdap'
		});


		// authenticated pages

		// user pages

		$routeProvider.when('/user/settings', {
			templateUrl: baseUrl + 'partials/user/settings.html',
			controller: 'UserSettings'
		});

        $routeProvider.when('/user/settings/password', {
			templateUrl: baseUrl + 'partials/user/settings-password.html',
			controller: 'UserSettingsPassword'
		});

        $routeProvider.when('/user/settings/calendar', {
			templateUrl: baseUrl + 'partials/user/settings-calendar.html',
			controller: 'UserSettingsCalendar'
		});


        // vacation account pages

        $routeProvider.when('/account/requests', {
			templateUrl: baseUrl + 'partials/account/request/requests.html',
			controller: 'AccountRequests'
		});


        $routeProvider.when('/account/requests/absence-edit/:id', {
			templateUrl: baseUrl + 'partials/account/request/absence-edit.html',
			controller: 'AccountAbsenceEdit'
		});

		$routeProvider.when('/account/requests/absence-edit', {
			templateUrl: baseUrl + 'partials/account/request/absence-edit.html',
			controller: 'AccountAbsenceEdit'
		});

        $routeProvider.when('/account/requests/absences/:id', {
			templateUrl: baseUrl + 'partials/account/request/absence-view.html',
			controller: 'AccountAbsenceView'
		});



        $routeProvider.when('/account/requests/time-saving-deposit-edit/:id', {
			templateUrl: baseUrl + 'partials/account/request/time-saving-deposit-edit.html',
			controller: 'AccountTimeSavingDepositEdit'
		});

		$routeProvider.when('/account/requests/time-saving-deposit-edit', {
			templateUrl: baseUrl + 'partials/account/request/time-saving-deposit-edit.html',
			controller: 'AccountTimeSavingDepositEdit'
		});

        $routeProvider.when('/account/requests/time-saving-deposits/:id', {
			templateUrl: baseUrl + 'partials/account/request/time-saving-deposit-view.html',
			controller: 'AccountTimeSavingDepositView'
		});


        $routeProvider.when('/account/requests/workperiod-recover-edit/:id', {
			templateUrl: baseUrl + 'partials/account/request/workperiod-recover-edit.html',
			controller: 'AccountWorkperiodRecoverEdit'
		});

		$routeProvider.when('/account/requests/workperiod-recover-edit', {
			templateUrl: baseUrl + 'partials/account/request/workperiod-recover-edit.html',
			controller: 'AccountWorkperiodRecoverEdit'
		});

        $routeProvider.when('/account/requests/workperiod-recovers/:id', {
			templateUrl: baseUrl + 'partials/account/request/workperiod-recover-view.html',
			controller: 'AccountWorkperiodRecoverView'
		});




        $routeProvider.when('/account/beneficiaries', {
			templateUrl: baseUrl + 'partials/account/beneficiaries.html',
			controller: 'AccountBeneficiaries'
		});

        $routeProvider.when('/account/beneficiaries/:id', {
			templateUrl: baseUrl + 'partials/account/beneficiary-view.html',
			controller: 'AccountBeneficiaryView'
		});

		$routeProvider.when('/account/department', {
			templateUrl: baseUrl + 'partials/account/department.html',
			controller: 'AccountDepartmentView'
		});


        $routeProvider.when('/account/calendar', {
			templateUrl: baseUrl + 'partials/account/calendar.html',
			controller: 'AccountCalendarView'
		});

        $routeProvider.when('/account/calendar/:year/:month', {
			templateUrl: baseUrl + 'partials/account/calendar.html',
			controller: 'AccountCalendarView'
		});

        $routeProvider.when('/account/calendar/:year/:month/:day', {
			templateUrl: baseUrl + 'partials/account/calendar.html',
			controller: 'AccountCalendarView'
		});



		// department managers pages


        $routeProvider.when('/manager/waitingrequests', {
			templateUrl: baseUrl + 'partials/manager/waitingrequests.html',
			controller: 'ManagerWaitingRequests'
		});

        $routeProvider.when('/manager/waitingrequests/:id', {
			templateUrl: baseUrl + 'partials/manager/waitingrequest.html',
			controller: 'ManagerWaitingRequest'
		});


		// administration pages

		$routeProvider.when('/admin/requests', {
			templateUrl: baseUrl + 'partials/admin/request/requests.html',
			controller: 'AdminRequests'
		});


        $routeProvider.when('/admin/requests/absence-edit/:id', {
			templateUrl: baseUrl + 'partials/admin/request/absence-edit.html',
			controller: 'AdminAbsenceEdit'
		});

		$routeProvider.when('/admin/requests/absence-edit', {
			templateUrl: baseUrl + 'partials/admin/request/absence-edit.html',
			controller: 'AdminAbsenceEdit'
		});

        $routeProvider.when('/admin/requests/absences/:id', {
			templateUrl: baseUrl + 'partials/admin/request/absence-view.html',
			controller: 'AdminAbsenceView'
		});



        $routeProvider.when('/admin/requests/time-saving-deposit-edit/:id', {
			templateUrl: baseUrl + 'partials/admin/request/time-saving-deposit-edit.html',
			controller: 'AdminTimeSavingDepositEdit'
		});

		$routeProvider.when('/admin/requests/time-saving-deposit-edit', {
			templateUrl: baseUrl + 'partials/admin/request/time-saving-deposit-edit.html',
			controller: 'AdminTimeSavingDepositEdit'
		});

        $routeProvider.when('/admin/requests/time-saving-deposits/:id', {
			templateUrl: baseUrl + 'partials/admin/request/time-saving-deposit-view.html',
			controller: 'AdminTimeSavingDepositView'
		});


        $routeProvider.when('/admin/requests/workperiod-recover-edit/:id', {
			templateUrl: baseUrl + 'partials/admin/request/workperiod-recover-edit.html',
			controller: 'AdminWorkperiodRecoverEdit'
		});

		$routeProvider.when('/admin/requests/workperiod-recover-edit', {
			templateUrl: baseUrl + 'partials/admin/request/workperiod-recover-edit.html',
			controller: 'AdminWorkperiodRecoverEdit'
		});

        $routeProvider.when('/admin/requests/workperiod-recovers/:id', {
			templateUrl: baseUrl + 'partials/admin/request/workperiod-recover-view.html',
			controller: 'AdminWorkperiodRecoverView'
		});


		$routeProvider.when('/admin/users', {
			templateUrl: baseUrl + 'partials/admin/users.html',
			controller: 'AdminUsers'
		});

		$routeProvider.when('/admin/user-edit/:id', {
			templateUrl: baseUrl + 'partials/admin/user-edit.html',
			controller: 'AdminUserEdit'
		});

		$routeProvider.when('/admin/user-edit', {
			templateUrl: baseUrl + 'partials/admin/user-edit.html',
			controller: 'AdminUserEdit'
		});

        $routeProvider.when('/admin/users/:id', {
			templateUrl: baseUrl + 'partials/admin/user-view.html',
			controller: 'AdminUserView'
		});



        $routeProvider.when('/admin/users/:id/calendar', {
			templateUrl: baseUrl + 'partials/admin/calendar.html',
			controller: 'AdminCalendarView'
		});

        $routeProvider.when('/admin/users/:id/calendar/:year/:month', {
			templateUrl: baseUrl + 'partials/admin/calendar.html',
			controller: 'AdminCalendarView'
		});

        $routeProvider.when('/admin/users/:id/calendar/:year/:month/:day', {
			templateUrl: baseUrl + 'partials/admin/calendar.html',
			controller: 'AdminCalendarView'
		});




        $routeProvider.when('/admin/beneficiaries/:id', {
			templateUrl: baseUrl + 'partials/admin/beneficiary-edit.html',
			controller: 'AdminBeneficiaryEdit'
		});

		$routeProvider.when('/admin/users/:id/account-rights', {
			templateUrl: baseUrl + 'partials/admin/account-rights-edit.html',
			controller: 'AdminAccountRightsEdit'
		});

        $routeProvider.when('/admin/users/:id/account-collections', {
			templateUrl: baseUrl + 'partials/admin/account-collections-edit.html',
			controller: 'AdminAccountCollectionsEdit'
		});

        $routeProvider.when('/admin/users/:id/account-schedulecalendars', {
			templateUrl: baseUrl + 'partials/admin/account-schedulecalendars-edit.html',
			controller: 'AdminAccountScheduleCalendarsEdit'
		});

        $routeProvider.when('/admin/users/:id/account-nwdayscalendars', {
			templateUrl: baseUrl + 'partials/admin/account-nwdayscalendars-edit.html',
			controller: 'AdminAccountNWDaysCalendarsEdit'
		});

        $routeProvider.when('/admin/users/:id/account-renewalquantity', {
			templateUrl: baseUrl + 'partials/admin/account-renewalquantity-edit.html',
			controller: 'AdminAccountRenewalQuantityEdit'
		});



        $routeProvider.when('/admin/compulsoryleaves', {
			templateUrl: baseUrl + 'partials/admin/compulsoryleaves.html',
			controller: 'AdminCompulsoryLeaves'
		});

        $routeProvider.when('/admin/compulsoryleaves/:id', {
			templateUrl: baseUrl + 'partials/admin/compulsoryleave-view.html',
			controller: 'AdminCompulsoryLeaveView'
		});

		$routeProvider.when('/admin/compulsoryleave-edit/:id', {
			templateUrl: baseUrl + 'partials/admin/compulsoryleave-edit.html',
			controller: 'AdminCompulsoryLeaveEdit'
		});

		$routeProvider.when('/admin/compulsoryleave-edit', {
			templateUrl: baseUrl + 'partials/admin/compulsoryleave-edit.html',
			controller: 'AdminCompulsoryLeaveEdit'
		});




		$routeProvider.when('/admin/departments', {
			templateUrl: baseUrl + 'partials/admin/departments.html',
			controller: 'AdminDepartments'
		});

        $routeProvider.when('/admin/departments/:id', {
			templateUrl: baseUrl + 'partials/admin/department-view.html',
			controller: 'AdminDepartmentView'
		});

		$routeProvider.when('/admin/department-edit/:id', {
			templateUrl: baseUrl + 'partials/admin/department-edit.html',
			controller: 'AdminDepartmentEdit'
		});

		$routeProvider.when('/admin/department-edit', {
			templateUrl: baseUrl + 'partials/admin/department-edit.html',
			controller: 'AdminDepartmentEdit'
		});



		$routeProvider.when('/admin/collections', {
			templateUrl: baseUrl + 'partials/admin/collections.html',
			controller: 'AdminCollections'
		});

		$routeProvider.when('/admin/collections/:id', {
			templateUrl: baseUrl + 'partials/admin/collection-edit.html',
			controller: 'AdminCollectionEdit'
		});

		$routeProvider.when('/admin/collection-edit', {
			templateUrl: baseUrl + 'partials/admin/collection-edit.html',
			controller: 'AdminCollectionEdit'
		});


		$routeProvider.when('/admin/calendars', {
			templateUrl: baseUrl + 'partials/admin/calendars.html',
			controller: 'AdminCalendars'
		});

		$routeProvider.when('/admin/calendars/:id', {
			templateUrl: baseUrl + 'partials/admin/calendar-edit.html',
			controller: 'AdminCalendarEdit'
		});

		$routeProvider.when('/admin/calendar-edit', {
			templateUrl: baseUrl + 'partials/admin/calendar-edit.html',
			controller: 'AdminCalendarEdit'
		});


		$routeProvider.when('/admin/types', {
			templateUrl: baseUrl + 'partials/admin/types.html',
			controller: 'AdminTypes'
		});

		$routeProvider.when('/admin/types/:id', {
			templateUrl: baseUrl + 'partials/admin/type-edit.html',
			controller: 'AdminTypeEdit'
		});

		$routeProvider.when('/admin/type-edit', {
			templateUrl: baseUrl + 'partials/admin/type-edit.html',
			controller: 'AdminTypeEdit'
		});

		$routeProvider.when('/admin/rights', {
			templateUrl: baseUrl + 'partials/admin/rights.html',
			controller: 'AdminRights'
		});

        $routeProvider.when('/admin/right-edit/:id', {
			templateUrl: baseUrl + 'partials/admin/right-edit.html',
			controller: 'AdminRightEdit'
		});

		$routeProvider.when('/admin/right-edit', {
			templateUrl: baseUrl + 'partials/admin/right-edit.html',
			controller: 'AdminRightEdit'
		});

        $routeProvider.when('/admin/rights/:id', {
			templateUrl: baseUrl + 'partials/admin/right-view.html',
			controller: 'AdminRightView'
		});

        $routeProvider.when('/admin/rights-sort', {
			templateUrl: baseUrl + 'partials/admin/rights-sort.html',
			controller: 'AdminRightsSort'
		});

        $routeProvider.when('/admin/rightrenewals/:id', {
			templateUrl: baseUrl + 'partials/admin/rightrenewal-edit.html',
			controller: 'AdminRightRenewalEdit'
		});

        $routeProvider.when('/admin/rightrenewal-edit', {
			templateUrl: baseUrl + 'partials/admin/rightrenewal-edit.html',
			controller: 'AdminRightRenewalEdit'
		});

        $routeProvider.when('/admin/rightrules/:id', {
			templateUrl: baseUrl + 'partials/admin/rightrule-edit.html',
			controller: 'AdminRightRuleEdit'
		});

        $routeProvider.when('/admin/rightrule-edit', {
			templateUrl: baseUrl + 'partials/admin/rightrule-edit.html',
			controller: 'AdminRightRuleEdit'
		});


        $routeProvider.when('/admin/recoverquantities', {
			templateUrl: baseUrl + 'partials/admin/recoverquantities.html',
			controller: 'AdminRecoverQuantities'
		});

        $routeProvider.when('/admin/recoverquantities/:id', {
			templateUrl: baseUrl + 'partials/admin/recoverquantity-edit.html',
			controller: 'AdminRecoverQuantityEdit'
		});

        $routeProvider.when('/admin/recoverquantity-edit', {
			templateUrl: baseUrl + 'partials/admin/recoverquantity-edit.html',
			controller: 'AdminRecoverQuantityEdit'
		});

        $routeProvider.when('/admin/exports', {
			templateUrl: baseUrl + 'partials/admin/export/exports.html',
			controller: 'AdminExports'
		});

        $routeProvider.when('/admin/export-edit-xlsx', {
			templateUrl: baseUrl + 'partials/admin/export/export-edit-xlsx.html',
			controller: 'AdminExportEditXlsx'
		});

        $routeProvider.when('/admin/export-edit-sage', {
			templateUrl: baseUrl + 'partials/admin/export/export-edit-sage.html',
			controller: 'AdminExportEditSage'
		});

		$routeProvider.when('/admin/invitations', {
			templateUrl: baseUrl + 'partials/admin/invitations.html',
			controller: 'AdminInvitations'
		});

		$routeProvider.when('/admin/invitation-edit', {
			templateUrl: baseUrl + 'partials/admin/invitation-edit.html',
			controller: 'AdminInvitationEdit'
		});


		$routeProvider.otherwise({redirectTo: '/home'});
	}]);

});
