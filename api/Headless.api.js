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
 * Link app to database with mongodb connexion
 * @return {Promise}
 */
app.linkdbCreateConnection = function() {
	return new Promise((resolve, reject) => {
		if (undefined !== app.db) {
			//console.warn('Call on connect but app.db already initialized');
			app.deferredDbConnect.promise.then(resolve);
			return;
		}

		apputil(app);

		app.db = mongoose.createConnection('mongodb://' + config.mongodb.prefix + config.mongodb.dbname,
            { useNewUrlParser: true, useCreateIndex: true });
		app.db.on('error', reject);
		app.db.once('open', resolve);
	});
};

/**
 * Link app to database with mongodb connexion
 * @return {Promise}
 */
app.linkdb = function() {
	return app.linkdbCreateConnection()
	.then(() => {
		// indexation done
		app.deferredDbConnect.resolve(app.db.models);
		return true;
	})
	.catch(err => {
		// indexation fail
		console.log(err);
		app.deferredDbConnect.resolve(app.db.models);
		return true;
	});
};


/**
 * Connect to database and load models
 * call callback when models are loaded
 */
app.connect = function(callback) {

	if (app.db && Object.keys(app.db.models).length > 0) {
		throw new Error('Headless connect, models already loaded for db connexion');
	}

	return app.linkdbCreateConnection().then(() => {
		//config data models
		var models = require('../models');
		models.requirements = {
			mongoose: mongoose,
			db: app.db,
			autoIndex: true,
			removeIndex: false,
            embeddedSchemas: {},
            app: app
		};

		models.load()
		.then(() => {
			// indexation done
			app.deferredDbConnect.resolve(app.db.models);
			callback();
		})
		.catch(err => {
			// indexation fail
			console.log(err);
			app.deferredDbConnect.resolve(app.db.models);
			callback();
		});
	})
	.catch(console.error);
};

app.disconnect = function(callback) {

	if (undefined === app.db) {
		// already closed
		return callback();
	}

	app.mongoose.disconnect().then(() => {
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
