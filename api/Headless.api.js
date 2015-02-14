'use strict';

/**
 * App mock without http server
 * to run in spec tests or with command line tools
 */ 
 
var app = {};
exports = module.exports = app;
	
var mongoose = require('mongoose');
var config = require('../config')();


app.config = config;
app.mongoose = mongoose;

require('../modules/apputil')(app);

app.connect = function(callback) {

	app.db = mongoose.createConnection(config.mongodb.prefix + config.mongodb.dbname);
	app.db.on('error', console.error.bind(console, 'Headless mock mongoose connection error: '));
	
	app.db.once('open', function() {
		
		//config data models
		var models = require('../models');
		models.requirements = {
			mongoose: mongoose,
			db: app.db,	
			autoIndex: true
		};
		models.load();

		callback();
	});
};

app.disconnect = function(callback) {
	app.db.close(function () {
        if (callback) {
            callback();
        }
	});
};


/**
 * Load a service
 *
 * @param {String} path
 *
 * @return {apiService}
 */
app.getService = function(path) {
    var apiservice = require('restitute').service;
    var getService = require('../api/services/'+path);
    return getService(apiservice, app);
};
