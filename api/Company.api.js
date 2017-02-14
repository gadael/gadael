'use strict';


let models = require('../models');
let helmet = require('helmet');
let routes = require('../rest/routes');
let apputil = require('../modules/apputil');
let passportHelper = require('../modules/passport');
let connectMongodbSession = require('connect-mongodb-session');
let passport = require('passport');
let express = require('express');
let session = require('express-session');
let async = require('async');
var mongoose = require('mongoose');
let csrf = require('csurf');
let bodyParser = require('body-parser');
let morgan = require('morgan');
let compression = require('compression');
let serveStatic = require('serve-static');
let cookieParser = require('cookie-parser');
let http = require('http');
let gadaelMiddleware = require('../modules/gadaelMiddleware');
const flash = require('connect-flash-plus');


/**
 * Load models into an external mongo connexion
 * for actions on databases
 * Resolve when indexation is done on models
 *
 * @param	object	app 	the headless mock app
 * @param	object	db		Mongoose connexion
 *
 * @return {Promise}
 */
function gadael_loadMockModels(app, db)
{


	models.requirements = {
		mongoose: app.mongoose,
		db: db,
		autoIndex: true,
		removeIndex: false,
        embeddedSchemas: [],
		app: app
	};

	apputil(app);
	return models.load();
}



/**
 * The company API
 * for action on multiples databases, application initialisation on server
 * @module api/Company
 *
 */
exports = module.exports = {





    /**
     * Get a database name from a company name
     * Used for auto-conversion in a form
     * @function
     *
     * @todo this will be done client side
     *
     * @return {string | false}
     */
    dbName: function dbName(name) {
        var str = name.replace(/[^a-z0-9]/gi, '').toLowerCase();

        if (str.length <= 2)
        {
            return false;
        }

        return str;
    },


    /**
     * db name for field validity
     * this is the server side valididty test
     * @function
     *
     * @return {string}
     */
    isDbNameValid: function isDbNameValid(app, dbName, callback) {


        if (!dbName.match(/[a-z0-9]+/gi) || dbName.length <= 2 || dbName.length > 100)
        {
            callback(false);
            return;
        }

        this.listDatabases(app, function(databases) {

            for(var i =0; i< databases.length; i++)
            {
                if (databases[i].name === dbName)
                {
                    callback(false);
                    return;
                }
            }


            callback(true);
        });
    },






    /**
     * Get all databases
     * @function
     *
     * @param	{object}	app			headless application
     * @param	{function} 	callback	function to receive results
     *
     * @return {Array}
     */
    listDatabases: function listDatabases(app, callback) {

        //var Admin = app.mongoose.mongo.Admin(app.db.db);
        var Admin = app.db.db.admin();

        Admin.listDatabases(function(err, result) {

            if (err) {
                console.log(err);
                return;
            }

            callback(result.databases);
        });

    },


	/**
	 * Empty collections before initialization
	 * @param {Object} db
	 * @return {Promise}
	 */
	emptyInitCollection: function(db) {

		let m = db.models;

		return Promise.all([
			m.Type.remove({}),
			m.Calendar.remove({}),
			m.RightCollection.remove({}),
			m.RecoverQuantity.remove({}),
			m.Right.remove({})
		]);
	},


	/**
	 * Get list of promises for initialization
	 * @param {Object} db
	 * @param {Company} company
	 * @return {Array}
	 */
	execInitTasks: function(db, company) {

		let m = db.models;

		return [
			m.Type.getInitTask(company)(),
			m.Calendar.getInitTask(company)(),
			m.RightCollection.getInitTask(company)(),
			m.RecoverQuantity.getInitTask(company)(),
			m.Right.getInitTask(company)()
		];
	},


	/**
	 * Run init scripts on alloready initialized database
	 *
	 * @param	{Object} 		app			express app or mock headless app variable
     * @param	{string}		dbname		database name, verified with this.isDbNameValid
	 *
	 * @return {Promise}
	 */
	runInit: function runInit(app, dbName) {

		let companyApi = this;

		return companyApi.getOpenDbPromise(app, dbName)
		.then(db => {

			return Promise.all([
				db.models.Company.findOne().exec(),
				companyApi.emptyInitCollection(db)
			])
			.then(all => {

				let company = all[0];

				if (null === company) {
					throw new Error('No company');
				}

				return Promise.all(companyApi.execInitTasks(db, company))
				.then(() => {
					db.close();
					return true;
				});
			});
		});
	},


    /**
     * Create a new virgin database with initialized Company infos
     * Additional connexion to database is used
     * @function
     *
     * @param	{Object} 		app			express app or mock headless app variable
     * @param	{string}		dbname		database name, verified with this.isDbNameValid
     * @param	{object}		company 	A company document object
     * @param	{function}		callback 	done function
     */
    createDb: function createDb(app, dbName, company, callback) {

		apputil(app);

        // createConnection
        let db = app.mongoose.createConnection();
		let companyApi = this;


        db.open(app.config.mongodb.prefix+dbName);

        db.on('error', function(err) {
            console.error('CompanyApi.createDb mongoose connection error: '+err.message);
            callback();
        });

        db.once('open', function() {

            gadael_loadMockModels(app, db)
			.then(() => {

				let m = db.models;

	            m.Company.count({}, (err, count) => {

	                if (0 !== count) {
	                    console.error('Database allready initialized with company object: '+dbName);
	                    callback(null);
	                    return db.close();
	                }

	                // create the company entry
	                let companyDoc = new m.Company(company);
					let promises = companyApi.execInitTasks(db, companyDoc);

					promises.push(companyDoc.save());

	                Promise.all(promises)
					.then(() => {
						callback();
						db.close();
					})
					.catch(err => {
						console.error('api.createDb '+err);
						callback();
						db.close();
					});

	            });

			});
        });

    },


    /**
     * Delete a database
     * @function
     *
     * @param	{Object}	app
     * @param	{String}	dbName
     * @param	{function}	callback
     */
    dropDb: function dropDb(app, dbName, callback) {

        var db = app.mongoose.createConnection(app.config.mongodb.prefix + dbName);
        db.on('error', console.error.bind(console, 'CompanyApi.deleteDb mongoose connection error: '));

        db.once('open', function() {
            db.db.dropDatabase(function(err, result) {
                if (err)
                {
                    console.error(err.err);
                } else {
                    callback();
                }

                db.close();
            });
        });
    },


    /**
     * Use a database in the app
     * @param	{Object}	app			Express app or headless mock app
     * @param	{String}	dbName
     * @param	{Function}	callback 	once connected
     *
     */
    bindToDb: function bindToDb(app, dbName, callback) {


        app.mongoose = mongoose;

        //setup mongoose
        app.db = mongoose.createConnection(app.config.mongodb.prefix + dbName);
        app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
        app.db.once('open', callback);
    },


	/**
	 * Get the db object in a promise
	 * @return {Promise}
	 */
	getOpenDbPromise: function getOpenDbPromise(app, dbName) {
		let db;
		return new Promise((resolve, reject) => {
            db = app.mongoose.createConnection(app.config.mongodb.prefix + dbName);
            db.on('error', err => {
                return reject('CompanyApi mongoose connection error: '+err, null);
            });

            db.once('open', () => {
				gadael_loadMockModels(app, db)
				.then(() => {
					resolve(db);
				});
            });
        });
	},


    /**
     * Open the company document in a spcific database object
	 * the db object is not closed
     * @returns {Promise} database object and company document
     */
    openCompany: function openCompany(app, dbName) {

        let output = {
            db: null,
            company: null
        };

		return this.getOpenDbPromise(app, dbName)
		.then(db => {
			output.db = db;

			let promise = db.models.Company.find().exec()
			.then(docs => {

				if (docs.length === 0) {
					return output;
				}

				output.company = docs[0];
				return output;
			});

			promise.catch(err => {
				db.close();
				throw err;
			});

			return promise;
		});
    },


    /**
     * get company document from a database using an external connexion
     * Read only api, database connexion is closed afterward
     *
     */
    getCompany: function getCompany(app, dbName, callback) {

        this.openCompany(app, dbName)
		.then(o => {
            callback(null, o.company);
            o.db.close();
        }).catch(err => {
            callback(err);
        });
    },


    /*jshint loopfunc: true */

    /**
     * Get all company documents from all the databases
	 * Promise resolve to an associated object wher keys are dbnames
	 *
     * @param {Object} app
     * @return {Promise}
     */
    getCompanies: function getCompanies(app) {

        let api = this;

        return new Promise((resolve, reject) => {

            api.listDatabases(app, function(databases) {

                let tasks = [];
                let asyncTasks = [];
                for(var i=0; i<databases.length; i++) {

                    if (databases[i]) {

                        var task = {
                            db: databases[i].name,
                            getCompany: function(async_done) {
                                api.getCompany(app, this.db, async_done);
                            }
                        };

                        tasks.push(task);
                        asyncTasks.push(task.getCompany.bind(task));
                    }
                }

                async.parallel(asyncTasks, function(err, results) {

                    let companies = {};

                    // databases without the company document are ignored
                    // add database name to resultset

                    for (var i=0; i<results.length; i++) {

                        if (null === results[i]) {
                            continue;
                        }

                        companies[tasks[i].db] = results[i];
                    }

                    resolve(companies);
                });
            });
        });
    },



    /**
     * Get the hightest port number
     *
     */
    getHighestPort: function getHighestPort(app, callback) {
        this.getCompanies(app).then(companies => {

            var max = 0;
            for (let dbName in companies) {
                if (companies.hasOwnProperty(dbName)) {
                    if (max < companies[dbName].port) {
                        max = companies[dbName].port;
                    }
                }
            }

            callback(max);
        });
    },



    /**
     *Get Express Application
     * @return {Object}
     */
    getExpress: function getExpress(config, models) {

        let mongoStore = connectMongodbSession(session);


        let csrfProtection = null;

        if (config.csrfProtection) {

            csrfProtection = csrf({ cookie: true });
        }

        //create express app
        var app = express();

        //keep reference to config
        app.config = config;

        this.bindToDb(app, config.mongodb.dbname, function() {
            // db connexion ready
        });

        models.requirements = {
            mongoose: app.mongoose,
            db: app.db,
            autoIndex: config.mongodb.autoIndex,
			removeIndex: config.mongodb.removeIndex,
            embeddedSchemas: [],
			app: app
        };

		apputil(app);
        models.load();

        //settings
        app.disable('x-powered-by');
        app.set('port', config.port);

        //middleware

        if (config.loghttp) {
            // logging HTTP requests
            app.use(morgan('dev'));
        }

        app.use(compression());
		app.use(gadaelMiddleware(app));
        app.use(serveStatic(config.staticPath, {
			'index': [config.indexFile]
		}));

        app.use(bodyParser.json());
        app.use(cookieParser());


        // the mongostore lock the gracefull stop of the app
        app.session_mongoStore = new mongoStore({ mongoose_connection: app.db });


        app.use(session({
          secret: config.cryptoKey,
          store: app.session_mongoStore,
          saveUninitialized: true,
          resave: true
        }));

		app.use(flash());
        app.use(passport.initialize());
        app.use(passport.session());


        helmet.defaults(app);

        if (null !== csrfProtection) {
            app.use(csrfProtection);
        }


        //response locals
        app.use(function(req, res, next) {
            if (null !== csrfProtection) {
                // XSRF-TOKEN is the cookie used by angularjs to forward the X-SRF-TOKEN header with a $http request
                res.cookie('XSRF-TOKEN', req.csrfToken());
            }
            res.locals.user = {};
            res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
            res.locals.user.username = req.user && req.user.username;
            next();
        });



        //setup routes
        routes(app, passport);

        return app;
    },





    /**
     * Start server on localhost
     *
     * @param app   Express app
     *
     * @return server
     */
    startServer: function startServer(app, callback) {

		let server = http.createServer(app);
		let companyModel = app.db.models.Company;

	    companyModel.findOne({}, (err, company) => {

			if (err) {
				throw err;
			}

			if (null === company) {
				throw new Error('The company document is required to start the server');
			}

			app.config.company = company;

			//setup passport
			passportHelper(app, passport);


			server.listen(app.config.port, app.config.host);

	        if (callback) {
	            server.on('listening', callback);
	        }
		});

        app.server = server;
        return server;
    }
};
