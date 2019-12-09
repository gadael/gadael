'use strict';

/**
 * Retrive session information for all page
 * language
 * user menu
 * who is logged
 * etc...
 */
exports.getInfos = function(req, res) {


    let gt = req.app.utility.gettext;

    // detect language from HTTP-ACCEPT
	// let lang = require('../node_modules/i18n-abide/lib/i18n').parseAcceptLanguage(req.headers['accept-language']);
    // let langCode = 'en';
    // if (undefined !== lang[0]) {
    //     langCode = lang[0].lang;
    // }

	let sessionUser;

	let menu = {
		account: null,
		admin: null,
		user: null
	};

	if (req.isAuthenticated())
	{
		sessionUser = {
			isAuthenticated: true,
            isAccount: req.user.canPlayRoleOf('account'),
            isManager: req.user.canPlayRoleOf('manager'),
            isAdmin: req.user.canPlayRoleOf('admin'),
			lastname: req.user.lastname,
			firstname: req.user.firstname,
			email: req.user.email,
            imageUrl: req.user.imageUrl,
            department: req.user.department
		};

        menu.user = [
            {
                'text': '<i class="fa fa-sign-out text-danger"></i>&nbsp;'+gt.gettext('Logout'),
                'click': 'logout()'
            },
            {
                'text': '<i class="glyphicon glyphicon-cog"></i>&nbsp;'+gt.gettext('Settings'),
                'href': '#/user/settings'
            }
        ];


        if (sessionUser.isAccount) {

            menu.account = [
                {
                    'text': '<i class="fa fa-calendar"></i>&nbsp;'+gt.gettext('Calendar'),
                    'href': '#/account/calendar'
                },
                {
                    'text': '<i class="fa fa-folder text-primary"></i>&nbsp;'+gt.gettext('My requests'),
                    'href': '#/account/requests'
                },
                {
                    'text': '<i class="fa fa-balance-scale text-success"></i>&nbsp;'+gt.gettext('My rights'),
                    'href': '#/account/beneficiaries'
                },
                {
                    'text': '<i class="fa fa-building-o"></i>&nbsp;'+gt.gettext('My department'),
                    'href': '#/account/department'
                }
            ];
        }

        if (sessionUser.isManager) {
            menu.manager = [
                {
                    'text': '<i class="fa fa-inbox text-primary"></i>&nbsp;'+gt.gettext('Waiting requests'),
                    'href': '#/manager/waitingrequests'
                }
            ];
        }


        if (sessionUser.isAdmin) {

            menu.admin = [
                {
                    'text': '<i class="fa fa-folder text-primary"></i>&nbsp;'+gt.gettext('Requests'),
                    'href': '#/admin/requests'
                },
                {
                    'text': '<i class="fa fa-folder text-warning"></i>&nbsp;'+gt.gettext('Compulsory leaves'),
                    'href': '#/admin/compulsoryleaves'
                },
                {
                    'text': '<i class="fa fa-cloud-download"></i>&nbsp;'+gt.gettext('Exports'),
                    'href': '#/admin/exports'
                },
                {
                    "divider": true
                },
                {
                    'text': '<i class="glyphicon glyphicon-user"></i>&nbsp;'+gt.gettext('Users list'),
                    'href': '#/admin/users'
                },
                {
                    'text': '<i class="fa fa-paper-plane-o"></i>&nbsp;'+gt.gettext('Invitations'),
                    'href': '#/admin/invitations'
                },
                {
                    'text': '<i class="fa fa-building-o"></i>&nbsp;'+gt.gettext('Departments list'),
                    'href': '#/admin/departments'
                },
                {
                    'text': '<i class="fa fa-folder-o"></i>&nbsp;'+gt.gettext('Collections list'),
                    'href': '#/admin/collections'
                },
                {
                    'text': '<i class="fa fa-calendar"></i>&nbsp;'+gt.gettext('Calendars list'),
                    'href': '#/admin/calendars'
                },
                {
                    "divider": true
                },
                {
                    'text': '<i class="fa fa-folder-o"></i>&nbsp;'+gt.gettext('Right types'),
                    'href': '#/admin/types'
                },
                {
                    'text': '<i class="fa fa-balance-scale"></i>&nbsp;'+gt.gettext('Rights configuration'),
                    'href': '#/admin/rights'
                },
                {
                    'text': '<i class="fa fa-sort"></i>&nbsp;'+gt.gettext('Sort rights and types'),
                    'href': '#/admin/rights-sort'
                },
                {
                    'text': '<i class="fa fa-calendar-check-o"></i>&nbsp;'+gt.gettext('Recover quantities'),
                    'href': '#/admin/recoverquantities'
                }
            ];
        }


	} else {
		sessionUser = {
			isAuthenticated: false,
            isAccount: false,
            isManager: false,
            isAdmin: false
		};
	}


	let compDoc = req.app.config.company;

	/**
	 * The company object output for REST service
	 */
    let company = {
		name: compDoc.name,
		maintenance: compDoc.maintenance,
		max_users: compDoc.max_users,
        workperiod_recover_request: compDoc.workperiod_recover_request,
        login: {
            form: compDoc.loginservices.form.enable,
            google: compDoc.loginservices.google.enable,
            cas: compDoc.loginservices.cas.enable
        }
	};

	if (sessionUser.isAuthenticated) {
		company.home_text = compDoc.private_text;
    } else {
		company.home_text = compDoc.public_text;
    }

    res.json({
        company: company,
        lang: req.app.config.language,
        baseUrl: req.app.config.url,
        sessionUser: sessionUser,
        menu: menu,
        date: {
            short: 'dd-MM-yyyy',
            long: 'EEEE d MMMM yyyy',
            shortTime: 'dd-MM-yyyy HH:mm Z',
            longTime: 'EEEE d MMMM yyyy HH:mm Z'
        },
        errors: req.flash('error')
    });



};



exports.http404 = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);
    workflow.httpstatus = 404;
    workflow.emit('exception', 'Page not found');
};
