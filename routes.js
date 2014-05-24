'use strict';

/**
 * Test if logged in
 */ 
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.set('X-Auth-Required', 'true');
  req.session.returnUrl = req.originalUrl;
  res.redirect('/login/');
}

/**
 * Test if logged in as administrator
 */ 
function ensureAdmin(req, res, next) {
  if (req.user.canPlayRoleOf('admin')) {
    return next();
  }
  res.redirect('/');
}


/**
 * Test if logged in as user account
 */  
function ensureAccount(req, res, next) {
  if (req.user.canPlayRoleOf('account')) {
    if (req.app.config.requireAccountVerification) {
      if (req.user.roles.account.isVerified !== 'yes' && !/^\/account\/verification\//.test(req.url)) {
        return res.redirect('/account/verification/');
      }
    }
    return next();
  }
  res.redirect('/');
}

exports = module.exports = function(app) {
	//front end use the index.html and the partials folder
	
	// rest api used by angular
	app.get('/rest/accounts', require('./rest/Account').getAccounts);
	app.get('/rest/account', require('./rest/Account').getAccount);
	
	app.get('/rest/common', require('./rest/Common').getInfos);

	//route not found
	//app.all('*', require('./rest').http404);
};
