'use strict';





exports = module.exports = function(app, passport) {
	
	//front end use the index.html and the partials folder
	
	
	
	
	// rest api used by angular
	app.get('/rest/accounts', require('./rest/Account').getAccounts);
	app.get('/rest/account', require('./rest/Account').getAccount);
	app.get('/rest/common', require('./rest/Common').getInfos);
	
	app.get('/rest/admin', require('./rest/admin/index').getInfos);
	app.get('/rest/admin/users', require('./rest/admin/users').getList);
	app.get('/rest/admin/users/:id', require('./rest/admin/users').getUser);
	app.post('/rest/admin/users/save', require('./rest/admin/users').save);
	app.post('/rest/admin/users/save/:id', require('./rest/admin/users').save);
	app.get('/rest/admin/departments', require('./rest/admin/departments').getList);
	app.get('/rest/admin/collections', require('./rest/admin/collections').getList);
	app.get('/rest/admin/collections/:id', require('./rest/admin/collections').getCollection);
	app.post('/rest/admin/collections/save', require('./rest/admin/collections').save);
	app.post('/rest/admin/collections/save/:id', require('./rest/admin/collections').save);
	
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
	app.all('*', require('./rest/Common').http404);
};
