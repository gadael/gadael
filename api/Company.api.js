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




/**
 * Load models into an external mongo connexion
 * for actions on databases
 * 
 * @param	object	app 	the headless mock app
 * @param	object	db		Mongoose connexion
 */  
function gadael_loadMockModels(app, db)
{

	
	models.requirements = {
		mongoose: app.mongoose,
		db: db,	
		autoIndex: true,
        embeddedSchemas: []
	};
	
	models.load();
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
     * @return string | false
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
     * @return string
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
     * @param	object		app			headless application
     * @param	function 	callback	function to receive results
     *
     * @return Array
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
     * Create a new virgin database with initialized Company infos
     * Additional connexion to database is used
     * @function
     *
     * @param	Object 		app			express app or mock headless app variable
     * @param	string		dbname		database name, verified with this.isDbNameValid
     * @param	object		company 	A company document object
     * @param	function	callback()	done function
     */
    createDb: function createDb(app, dbName, company, callback) {

        // createConnection
        var db = app.mongoose.createConnection();


        db.open(app.config.mongodb.prefix+dbName);

        db.on('error', function(err) {
            console.error('CompanyApi.createDb mongoose connection error: '+err.message);
            callback();
        });

        db.once('open', function() {

            gadael_loadMockModels(app, db);

            // create the company entry



            var companyDoc = new db.models.Company(company);
            var typeModel = db.models.Type;
            var calendarModel = db.models.Calendar;
            var collectionModel = db.models.RightCollection;
            var recoverQuantityModel = db.models.RecoverQuantity;

            async.parallel([
                companyDoc.save.bind(companyDoc),
                typeModel.createFrenchDefaults.bind(typeModel),
                calendarModel.createFrenchDefaults.bind(calendarModel),
                collectionModel.createFrenchDefaults.bind(collectionModel),
                recoverQuantityModel.createFrenchDefaults.bind(recoverQuantityModel)
            ],
            function(err) {
                if (err) {
                    console.error('api.createDb '+err);
                } else {
                    callback();
                }

                db.close();
            });
        });

    },


    /**
     * Delete a database
     * @function
     *
     * @param				app
     * @param	string		dbName
     * @param	function	callback
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
     * @param	object		app			Express app or headless mock app
     * @param	string		dbName
     * @param	function	callback 	once connected
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
     * get company document from a database using an external connexion
     *
     *
     */
    getCompany: function getCompany(app, dbName, callback) {

        var db = app.mongoose.createConnection(app.config.mongodb.prefix + dbName);
        db.on('error', console.error.bind(console, 'CompanyApi.getCompany mongoose connection error: '));

        db.once('open', function() {

            gadael_loadMockModels(app, db);

            db.models.Company.find().exec(function (err, docs) {
                if (err) {
                    throw err;
                }

                if (docs.length === 0) {
                    throw new Error('The company document is missing in base '+dbName);
                }

                callback(docs[0]);
                db.close();
            });


        });
    },


    /*jshint loopfunc: true */

    /**
     * Get all company documents from all the databases
     */
    getCompanies: function getCompanies(app, callback) {
        var api = this;
        this.listDatabases(app, function(databases) {


            var asyncTasks = [];
            for(var i=0; i<databases.length; i++) {

                if (databases[i]) {

                    var task = {
                        db: databases[i].name,
                        getCompany: function(async_done) {
                            api.getCompany(app, this.db, async_done);
                        }
                    };

                    asyncTasks.push(task.getCompany.bind(task));
                }
            }

            async.parallel(asyncTasks, function(err, results) {
                if (err) {
                    throw err;
                }

                callback(results);
            });
        });
    },



    /**
     * Get the hightest port number
     *
     */
    getHighestPort: function getHighestPort(app, callback) {
        this.getCompanies(app, function(arr) {
            var max = 0;
            for(var i=0; i<arr.length; i++) {
                if (max < arr[i].port)
                {
                    max = arr[i].port;
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
            autoIndex: (app.get('env') === 'development'),
            embeddedSchemas: []
        };

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
        app.use(serveStatic(config.staticPath));
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

        //global locals
        app.locals.projectName = app.config.projectName;
        app.locals.copyrightYear = new Date().getFullYear();
        app.locals.copyrightName = app.config.companyName;
        app.locals.cacheBreaker = 'br34k-01';


        //setup passport
        passportHelper(app, passport);

        //setup routes
        routes(app, passport);

        apputil(app);


        return app;
    },





    /**
     * @param app   Express app
     *
     * @return server
     */
    startServer: function startServer(app, callback) {


        var server = http.createServer(app);

        server.listen(app.config.port);

        if (callback) {
            server.on('listening', callback);
        }

        app.server = server;

        return server;
    }
};
