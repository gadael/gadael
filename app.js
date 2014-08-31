'use strict';

var companyApi = require('./api/Company.api');

//dependencies
var config = require('./config');
var models = require('./models');
var passport = require('passport');

var app = companyApi.getExpress(config, models);

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
