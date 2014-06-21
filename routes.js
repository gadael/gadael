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

exports = module.exports = function(app, passport) {
	//front end use the index.html and the partials folder
	
	// rest api used by angular
	app.get('/rest/accounts', require('./rest/Account').getAccounts);
	app.get('/rest/account', require('./rest/Account').getAccount);
	app.get('/rest/common', require('./rest/Common').getInfos);
	
	app.get('/rest/admin', require('./rest/admin/index').getInfos);
	app.get('/rest/admin/users', require('./rest/admin/users').getList);
	app.get('/rest/admin/departments', require('./rest/admin/departments').getList);
	app.get('/rest/admin/collections', require('./rest/admin/collections').getList);
	
	app.post('/rest/login', require('./rest/login').authenticate);
	app.post('/rest/login/forgot', require('./rest/login').forgotPassword);
	app.post('/rest/login/reset', require('./rest/login').resetPassword);
	app.get('/rest/logout', require('./rest/logout').init);
	
	//social login
	app.get('/login/twitter/', passport.authenticate('twitter', { callbackURL: '#/login/twitter/callback/' }));
	app.get('/login/github/', passport.authenticate('github', { callbackURL: '#/login/github/callback/' }));
	app.get('/login/facebook/', passport.authenticate('facebook', { callbackURL: '#/login/facebook/callback/' }));
	app.get('/login/google/', passport.authenticate('google', { callbackURL: '#/login/google/callback/', scope: ['profile email'] }));
	app.get('/login/tumblr/', passport.authenticate('tumblr', { callbackURL: '#/login/tumblr/callback/', scope: ['profile email'] }));

	// tests
	app.get('/rest/populate', require('./rest/tests/index').populate);
	
	

	//route not found
	//app.all('*', require('./rest').http404);
};
