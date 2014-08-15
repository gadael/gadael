'use strict';

/**
 * Retrive session information for all page
 * language
 * user access rights
 * who is logged
 * etc...
 */  
exports.getInfos = function(req, res) {
	
    
    var gt = req.app.utility.gettext;
    
    // detect language from HTTP-ACCEPT
	var lang = require('../node_modules/i18n-abide/lib/i18n').parseAcceptLanguage(req.headers['accept-language']);
	
	var user = null;
	
	var menu = {
		account: null,
		admin: null,
		user: null
	};
  
	if (req.isAuthenticated())
	{
		user = {
			isAuthenticated: req.isAuthenticated(),
            isAccount: req.user.canPlayRoleOf('account'),
            isAdmin: req.user.canPlayRoleOf('admin'),
			lastname: req.user.lastname,
			firstname: req.user.firstname,
			email: req.user.email
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
        
        
        if (user.isAccount) {
            
            menu.account = [
                {
                    'text': '<i class="fa fa-calendar"></i>&nbsp;'+gt.gettext('Calendar'),
                    'href': '#/user/calendar'
                },
                {
                    'text': '<i class="fa fa-folder text-primary"></i>&nbsp;'+gt.gettext('My requests'),
                    'href': '#/user/requests'
                },
                {
                    'text': '<i class="fa fa-bullhorn"></i>&nbsp;'+gt.gettext('Request a vacation period'),
                    'href': '#/user/vacation-request'
                }
            ];
        }
        
        
        if (user.isAdmin) {
            
            menu.admin = [
                {
                    'text': '<i class="fa fa-home"></i>&nbsp;'+gt.gettext('Admin summary'),
                    'href': '#/admin'
                },
                {
                    'text': '<i class="fa fa-folder text-primary"></i>&nbsp;'+gt.gettext('Requests'),
                    'href': '#/admin/requests'
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
                    'text': '<i class="fa fa-book"></i>&nbsp;'+gt.gettext('Rights configuration'),
                    'href': '#/admin/rights'
                }
            ];
        }
        

	} else {
		user = { 
			isAuthenticated: false,
            isAccount: false,
            isAdmin: false
		};
		
		
	}

	res.json({ 
		lang: lang[0].lang,
		user: user,
		menu: menu,
		date: {
			short: 'dd-MM-yyyy',
			long: 'EEEE d MMMM yyyy',
			shortTime: 'dd-MM-yyyy HH:mm Z',
			longTime: 'EEEE d MMMM yyyy HH:mm Z'
		}
	});
};



exports.http404 = function(req, res) {
	res.json({ http: 404 });
};
