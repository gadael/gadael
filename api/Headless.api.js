'use strict';

const apputil = require('../modules/apputil');

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


app.deferredDbConnect = {};
app.deferredDbConnect.promise = new Promise(function(resolve, reject) {
	app.deferredDbConnect.resolve = resolve;
	app.deferredDbConnect.reject = reject;
});


/**
 * Connect to database and load models
 * call callback when models are loaded
 */
app.connect = function(callback) {

	if (undefined !== app.db) {
		console.warn('Call on connect but app.db allready initialized');
		return callback();
	}

	app.deferredDbConnect.promise.then(() => {
		//console.log('promise resolution');
		//callback();
	});

	apputil(app);

	app.db = mongoose.createConnection(config.mongodb.prefix + config.mongodb.dbname);
	app.db.on('error', console.error.bind(console, 'Headless mock mongoose connection error: '));

	app.db.once('open', function() {

		//config data models
		var models = require('../models');
		models.requirements = {
			mongoose: mongoose,
			db: app.db,
			autoIndex: true,
            embeddedSchemas: {},
            app: app
		};

		models.load();
		app.deferredDbConnect.resolve(app.db.models);
		//console.log('callback');
		callback();
	});
};

app.disconnect = function(callback) {
	app.db.close(function () {
		delete app.db;
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
