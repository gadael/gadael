'use strict';

var companyApi = require('./api/Company.api');

//dependencies
try {
    var config = require('./config')();
} catch(e) {
    throw new Error(e+' Please copy config.example.js to config.js');
}


var models = require('./models');

var app = companyApi.getExpress(config, models);

app.server = companyApi.startServer(app, function() {
    //and... we're live
});
