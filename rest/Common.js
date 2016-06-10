'use strict';

/**
 * Retrive session information for all page
 * language
 * user menu
 * who is logged
 * etc...
 */  
exports.getInfos = function(req, res) {
	
    
    var gt = req.app.utility.gettext;
    
    // detect language from HTTP-ACCEPT
	var lang = require('../node_modules/i18n-abide/lib/i18n').parseAcceptLanguage(req.headers['accept-language']);
	
	var sessionUser;
	
	var menu = {
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
            image: req.user.image,
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

    let companyModel = req.app.db.models.Company;

    companyModel.find({}, 'name maintenance public_text private_text max_users', (err, companies) => {

        let company = companies[0].toObject();

        /**
         * Replace text variables in company object for security (do not expose private stuff in publc rest service)
         * @param {String} use Property name
         * @param {String} del Property name
         */
        function replaceProp(use, del) {
            company.home_text = company[use];
            if (undefined !== company[del]) {
                delete company[del];
            }
        }

        if (sessionUser.isAuthenticated) {
            replaceProp('private_text', 'public_text');
        } else {
            replaceProp('public_text', 'private_text');
        }


        res.json({
            company: company,
            lang: lang[0].lang,
            sessionUser: sessionUser,
            menu: menu,
            date: {
                short: 'dd-MM-yyyy',
                long: 'EEEE d MMMM yyyy',
                shortTime: 'dd-MM-yyyy HH:mm Z',
                longTime: 'EEEE d MMMM yyyy HH:mm Z'
            }
        });
    });


};



exports.http404 = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);
    workflow.httpstatus = 404;
    workflow.emit('exception', 'Page not found');
};
