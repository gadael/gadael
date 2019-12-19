'use strict';

const models = require('../models');
const helmet = require('helmet');
const routes = require('../rest/routes');
const apputil = require('../modules/apputil');
const passportHelper = require('../modules/passport');
const connectMongodbSession = require('connect-mongodb-session');
const passport = require('passport');
const express = require('express');
const session = require('express-session');
const async = require('async');
const mongoose = require('mongoose');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const serveStatic = require('serve-static');
const cookieParser = require('cookie-parser');
const http = require('http');
const gadaelMiddleware = require('../modules/gadaelMiddleware');
const flash = require('connect-flash-plus');
const schedule = require('node-schedule');
const child_process = require('child_process');
const approbalert = require('../modules/approbalert');
const googlecalendar = require('../rest/user/googlecalendar');
const decodeUrlEncodedBody = require('body-parser').urlencoded({ extended: false });
const loginPromise = require('../modules/login');

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
	if (Object.keys(db.models).length > 0) {
		return Promise.reject(new Error('Models already loaded for db connexion'));
	}

	models.requirements = {
		mongoose: app.mongoose,
		db: db,
		autoIndex: true,
		removeIndex: false,
        embeddedSchemas: [],
		app: app
	};

	apputil(app);
	return models.load()
    .catch(err => {
        console.error(err);
    });
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
     */
    listDatabases: function listDatabases(app, callback) {
		const Admin = app.mongoose.mongo.Admin(app.db.db);
        Admin.listDatabases(function(err, result) {

            if (err) {
                console.error(err);
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
			m.Type.deleteMany({}),
			m.Calendar.deleteMany({}),
			m.RightCollection.deleteMany({}),
			m.RecoverQuantity.deleteMany({}),
			m.Right.deleteMany({})
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
	 * Run init scripts on already initialized database
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
	 *
	 * @return {Promise}
     */
    createDb: function createDb(app, dbName, company) {
		if (undefined !== app.db && Object.keys(app.db.models).length > 0) {
			return Promise.reject(new Error('app object already initialized with models'));
		}

		apputil(app);

        // createConnection

		let db;
		let companyApi = this;
		let Company;


		/**
		 * Create the company document and init tasks
		 *
		 * @return {Promise} resolve to company document
		 */
		function saveCompanyDoc() {
			return gadael_loadMockModels(app, db)
			.then(() => {
				Company = db.models.Company;
				return Company.countDocuments()
				.exec();
			})
			.then(count => {

				if (0 !== count) {
					throw new Error('createDb: Database already initialized with company object: '+dbName);
				}



				// create the company entry
				let companyDoc = new Company(company);
				let promises = companyApi.execInitTasks(db, companyDoc);

				promises.push(companyDoc.save());
				return Promise.all(promises);


			})
			.then(arr => {
				return arr[arr.length-1];
			});
		}


		return app.mongoose.disconnect()
		.then(() => {
			return new Promise((resolve, reject) => {
				db = app.mongoose.createConnection('mongodb://' + app.config.mongodb.prefix + dbName,
                    { useNewUrlParser: true, useCreateIndex: true });

				db.on('error', function(err) {
		            reject(new Error('CompanyApi.createDb mongoose connection error: '+err.message));
		        });

		        db.once('open', function() {
					if (Object.keys(db.models).length > 0) {
						throw new Error('once open: Models already loaded for db connexion');
					}

					saveCompanyDoc()
					.then(company => {
						//return app.mongoose.disconnect()
						resolve(company);
					})
					.catch(err => {
						// db.close();
						console.error(err);
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
        var db = app.mongoose.createConnection('mongodb://' + app.config.mongodb.prefix + dbName,
            { useNewUrlParser: true, useCreateIndex: true });
        db.on('error', console.error.bind(console, 'CompanyApi.deleteDb mongoose connection error: '));

        db.once('open', function() {
            db.db.dropDatabase(function(err, result) {
                if (err) {
                    return console.error(err);
                }
				app.mongoose.disconnect().then(callback);
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
        app.db = mongoose.createConnection('mongodb://' + app.config.mongodb.prefix + dbName,
            { useNewUrlParser: true, useCreateIndex: true });
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
            db = app.mongoose.createConnection('mongodb://' + app.config.mongodb.prefix + dbName,
                { useNewUrlParser: true, useCreateIndex: true });
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
     * @return {Promise}
     */
    getCompany: function getCompany(app, dbName, callback) {

        let promise = this.openCompany(app, dbName)
		.then(o => {
			if (undefined !== callback) {
	            callback(null, o.company);
			}
            o.db.close();
			return o.company;
        });

		if (undefined !== callback) {
			promise.catch(err => {
	            callback(err);
	        });
		}

		return promise;
    },


    /*jshint loopfunc: true */

    /**
     * Get all company documents from all the databases
	 * Promise resolve to an associated object wher keys are dbnames
     *
     * The schemas will be loaded for each company, if a database is not a gadael
     * db it can be ignored with the ignoreList param
	 *
     * @param {Object} app
     * @param {Array} ignoreList
     * @return {Promise}
     */
    getCompanies: function getCompanies(app, ignoreList) {

        let api = this;
        if (undefined === ignoreList) {
            ignoreList = [];
        }

        return new Promise((resolve, reject) => {

            api.listDatabases(app, function(databases) {

                let tasks = [];
                let asyncTasks = [];
                for(var i=0; i<databases.length; i++) {

                    if (databases[i] && -1 === ignoreList.indexOf(databases[i].name)) {
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
            const defaultCsrfMiddleware = csrf({ cookie: true });
            csrfProtection = (req, res, next) => {
                // ignore CSRF protection for API
                if('/login/oauth-token' === req.path || req.path.startsWith('/api/')) {
                    next();
                    return;
                }

                return defaultCsrfMiddleware(req, res, next);
            };
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
        models.load()
        .catch(err => {
            console.error(err);
        });

        //settings
        app.disable('x-powered-by');
        app.set('port', config.port);

        //middleware

        if (config.loghttp) {
            // logging HTTP requests
            app.use(morgan('dev'));
        }

        app.use(compression());
		app.use(serveStatic(config.staticPath, {
			'index': [config.indexFile]
		}));

        app.use(bodyParser.json());
        app.use(cookieParser());


        // the mongostore lock the gracefull stop of the app
        app.session_mongoStore = new mongoStore({
			uri: 'mongodb://' + app.config.mongodb.prefix + app.config.mongodb.dbname,
			collection: 'sessions'
		});


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
            if (null !== csrfProtection && req.csrfToken) {
                // XSRF-TOKEN is the cookie used by angularjs to forward the X-SRF-TOKEN header with a $http request
                res.cookie('XSRF-TOKEN', req.csrfToken());
            }
            res.locals.user = {};
            res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
            res.locals.user.username = req.user && req.user.username;
            next();
        });

		app.use(gadaelMiddleware(app));


        const oauth = require('../modules/oauth')(app);
        const authenticate = oauth.authenticate();

        app.use('/api/*', decodeUrlEncodedBody, (req, res, next) => {
            authenticate(req, res, (err) => {
                if (err) { return next(err); }
                loginPromise(req, res.locals.oauth.token.user)
                .then(() => { next(); })
                .catch(next);
            });
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

		const server = http.createServer(app);
		const companyModel = app.db.models.Company;

	    companyModel.findOne({}, (err, company) => {

			if (err) {
				throw err;
			}

			if (null === company) {
				throw new Error('The company document is required to start the server');
			}

			app.config.company = company;
	        if (company.country === 'UK') {
                app.config.language = 'en';
            }

            googlecalendar.init(app.config);

			//setup passport
			passportHelper(app, passport);

			server.listen(app.config.port, app.config.host);

			schedule.scheduleJob({ hour: 12, minute: 30 }, () => {
			    approbalert(app).catch(console.error);
			});

            schedule.scheduleJob({ hour: 0, minute: 0 }, () => {
                console.log('Saving lunch breaks...');
                app.db.models.Account.find().exec()
                .then(accounts => Promise.all(accounts.map(a => a.saveLunchBreaks())))
                .catch(console.error);
			});

            if (app.config.useSchudeledRefreshStat) {
                const args = process.argv.slice();
                const node = args.shift();
                const file = args.shift().replace('app.js', 'refreshstat.js');
                args.unshift(file);
                schedule.scheduleJob({ minute: 0 }, () => {
                    child_process.execFile(node, args, (error, stdout, stderr) => {
                        if (error) {
                            throw error;
                        }
                        if (stdout) {
                            console.log('[refreshstat]', stdout);
                        }
                    });
    			});
            }

	        if (callback) {
	            server.on('listening', callback);
	        }
		});

        app.server = server;
        return server;
    }
};
