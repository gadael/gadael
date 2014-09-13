'use strict';

var companyApi = require('./api/Company.api');

//dependencies
var config = require('./config')();
var models = require('./models');

var app = companyApi.getExpress(config, models);
app.server = companyApi.startServer(app, function() {
    //and... we're live
});
