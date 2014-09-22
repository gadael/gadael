'use strict';





exports = module.exports = function(app, passport) {
	
	//front end use the index.html and the partials folder
	
	
	
	
	// rest api used by angular
	app.get('/rest/accounts', require('./Account').getAccounts);
	app.get('/rest/account', require('./Account').getAccount);
	app.get('/rest/common', require('./Common').getInfos);
	
	app.get('/rest/admin', require('./admin/index').getInfos);
	
    require('./admin/users/list').addRoute(app);
    require('./admin/users/get').addRoute(app);
    
	//app.get('/rest/admin/users'				, require('./admin/users').getList);
	//app.get('/rest/admin/users/:id'			, require('./admin/users').getItem);
	app.post('/rest/admin/users'			, require('./admin/users').save);
	app.put('/rest/admin/users/:id'			, require('./admin/users').save);
    app.delete('/rest/admin/users/:id'	    , require('./admin/users').remove);
	
	app.get('/rest/admin/accountcollections'		, require('./admin/accountcollections').getList);
	app.get('/rest/admin/accountcollections/:id'	, require('./admin/accountcollections').getItem);
	app.post('/rest/admin/accountcollections'		, require('./admin/accountcollections').save);
	app.put('/rest/admin/accountcollections/:id'	, require('./admin/accountcollections').save);
    app.delete('/rest/admin/accountcollections/:id'	, require('./admin/accountcollections').remove);
	
	app.get('/rest/admin/departments'		, require('./admin/departments').getList);
	app.get('/rest/admin/departments/:id'	, require('./admin/departments').getItem);
	app.post('/rest/admin/departments'		, require('./admin/departments').save);
	app.put('/rest/admin/departments/:id'	, require('./admin/departments').save);
	
	app.get('/rest/admin/collections'		, require('./admin/collections').getList);
	app.get('/rest/admin/collections/:id'	, require('./admin/collections').getItem);
	app.post('/rest/admin/collections'		, require('./admin/collections').save);
	app.put('/rest/admin/collections/:id'	, require('./admin/collections').save);
	
	app.get('/rest/admin/calendars'			, require('./admin/calendars').getList);
	app.get('/rest/admin/calendars/:id'		, require('./admin/calendars').getItem);
	app.post('/rest/admin/calendars'		, require('./admin/calendars').save);
	app.put('/rest/admin/calendars/:id'		, require('./admin/calendars').save);
	
	app.get('/rest/admin/types'				, require('./admin/types').getList);
	app.get('/rest/admin/types/:id'			, require('./admin/types').getItem);
	app.post('/rest/admin/types'			, require('./admin/types').save);
	app.put('/rest/admin/types/:id'			, require('./admin/types').save);
    
    app.get('/rest/admin/rights'			, require('./admin/rights').getList);
	app.get('/rest/admin/rights/:id'		, require('./admin/rights').getItem);
	app.post('/rest/admin/rights'			, require('./admin/rights').save);
	app.put('/rest/admin/rights/:id'		, require('./admin/rights').save);
    

	
	app.post('/rest/login', require('./login').authenticate);
	app.post('/rest/login/forgot', require('./login').forgotPassword);
	app.post('/rest/login/reset', require('./login').resetPassword);
	app.get('/rest/logout', require('./logout').init);
	
	//social login
    /*
	app.get('/login/twitter/', passport.authenticate('twitter', { callbackURL: '#/login/twitter/callback/' }));
	app.get('/login/github/', passport.authenticate('github', { callbackURL: '#/login/github/callback/' }));
	app.get('/login/facebook/', passport.authenticate('facebook', { callbackURL: '#/login/facebook/callback/' }));
	app.get('/login/google/', passport.authenticate('google', { callbackURL: '#/login/google/callback/', scope: ['profile email'] }));
	app.get('/login/tumblr/', passport.authenticate('tumblr', { callbackURL: '#/login/tumblr/callback/', scope: ['profile email'] }));
    */
    
	// tests
	app.get('/rest/populate', require('./tests/index').populate);
	
	

	//route not found
	app.all('*', require('./Common').http404);
};
