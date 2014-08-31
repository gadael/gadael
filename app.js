'use strict';

//dependencies
var config = require('./config'),
    express = require('express'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    path = require('path'),
    passport = require('passport'),
    helmet = require('helmet');

//create express app
var app = express();

//keep reference to config
app.config = config;

var companyApi = require('./api/Company.api');
companyApi.bindToDb(app, config.mongodb.dbname, function() {
	// db connexion ready
});

//config data models
var models = require('./models');

models.requirements = {
	mongoose: app.mongoose,
	db: app.db,	
	autoIndex: (app.get('env') === 'development')
}
models.load();

//settings
app.disable('x-powered-by');
app.set('port', config.port);


//middleware

var bodyParser = require('body-parser');

app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(require('method-override')());
app.use(require('cookie-parser')());
app.use(session({
  secret: config.cryptoKey,
  store: new mongoStore({ url: config.mongodb.prefix + config.mongodb.dbname }),
  saveUninitialized: true,
  resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
helmet.defaults(app);

//response locals
app.use(function(req, res, next) {
	
  res.locals.user = {};
  res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
  res.locals.user.username = req.user && req.user.username;
  next();
});

//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;
app.locals.cacheBreaker = 'br34k-01';

//setup passport
require('./modules/passport')(app, passport);

//setup routes
require('./routes')(app, passport);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./modules/sendmail');
app.utility.slugify = require('./modules/slugify');
app.utility.workflow = require('./modules/workflow');
app.utility.gettext = require('./modules/gettext');

app.server = companyApi.startServer(app, function() {
    //and... we're live
});
