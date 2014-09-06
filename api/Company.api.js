'use strict';

var api = {};
exports = module.exports = api;


/**
 * Load models into an external mongo connexion
 * for actions on databases
 * 
 * @param	object	app 	the headless mock app
 * @param	object	db		Mongoose connexion
 */  
function inga_loadMockModels(app, db)
{
	//config data models
	var models = require('../models');
	
	models.requirements = {
		mongoose: app.mongoose,
		db: db,	
		autoIndex: true
	};
	
	models.load();
}



/**
 * Get a database name from a company name
 * Used for auto-conversion in a form
 * 
 * @todo this will be done client side
 * 
 * @return string | false
 */  
api.dbName = function(name) {
	var str = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
	
	if (str.length <= 2)
	{
		return false;
	}
	
	return str;
};


/**
 * db name for field validity
 * this is the server side valididty test
 * 
 * @return string
 */  
api.isDbNameValid = function(app, dbName, callback) {
	
	
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
};






/**
 * Get all databases
 * 
 * @param	object		app			headless application
 * @param	function 	callback	function to receive results
 * 
 * @return Array
 */  
api.listDatabases = function(app, callback) {
	
	var Admin = app.mongoose.mongo.Admin(app.db.db);

	Admin.listDatabases(function(err, result) {
		
		if (err) {
			console.log(err);
		}

		callback(result.databases);    
	});
	
};



/**
 * Create a new virgin database with initialized Company infos
 * Additional connexion to database is used
 * 
 * @param	Object 		app			express app or mock headless app variable
 * @param	string		dbname		database name, verified with this.isDbNameValid
 * @param	object		company 	A company document object
 * @param	function	callback()	done function
 */  
api.createDb = function(app, dbName, company, callback) {
	
	var db = app.mongoose.createConnection(app.config.mongodb.prefix + dbName);
	db.on('error', console.error.bind(console, 'CompanyApi.createDb mongoose connection error: '));
	
	
	
	db.once('open', function() {

		inga_loadMockModels(app, db);
		
		// create the company entry
        
        var async = require('async');
		
		var companyDoc = new db.models.Company(company);
        var typeModel = db.models.Type;
        
        
        async.parallel([
            companyDoc.save.bind(companyDoc),
            typeModel.createFrenchDefaults.bind(typeModel)
        ],
        function(err) {
            if (err) {
				console.error(err);
			} else {
				callback();
			}
			
			db.close();
        });
	});
	
};


/**
 * Delete a database
 * 
 * @param				app
 * @param	string		dbName
 * @param	function	callback
 */  
api.dropDb = function(app, dbName, callback) {
	
	
	
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
};


/**
 * Use a database in the app
 * @param	object		app			Express app or headless mock app
 * @param	string		dbName		
 * @param	function	callback 	once connected
 * 
 */  
api.bindToDb = function(app, dbName, callback) {

	var mongoose = require('mongoose');
	app.mongoose = mongoose;

	//setup mongoose
	app.db = mongoose.createConnection(app.config.mongodb.prefix + dbName);
	app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
	app.db.once('open', callback);
};


/**
 * get company document from a database using an external connexion
 * 
 * 
 */  
api.getCompany = function(app, dbName, callback) {
	
	var db = app.mongoose.createConnection(app.config.mongodb.prefix + dbName);
	db.on('error', console.error.bind(console, 'CompanyApi.getCompany mongoose connection error: '));
	
	db.once('open', function() {
		
		inga_loadMockModels(app, db);
		
		db.models.Company.find().exec(function (err, docs) {
			if (err) {
				throw err;
			}

			callback(docs[0]);
			db.close();
		});

		
	});
};


/*jshint loopfunc: true */

/**
 * Get all company documents from all the databases
 */  
api.getCompanies = function(app, callback) {
	this.listDatabases(app, function(databases) {

		var async = require('async');
		
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
};



/**
 * Get the hightest port number
 * 
 */  
api.getHighestPort = function(app, callback) {
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
};

/**
 * @return app
 */
api.getExpress = function(config, models) {
    
    var express = require('express'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    passport = require('passport'),
    helmet = require('helmet');

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
        autoIndex: (app.get('env') === 'development')
    };
    
    models.load();
    
    //settings
    app.disable('x-powered-by');
    app.set('port', config.port);
    
    //middleware
    
    var bodyParser = require('body-parser');

    // logging HTTP requests
    // app.use(require('morgan')('dev'));
    
    app.use(require('compression')());
    app.use(require('serve-static')(config.staticPath));
    app.use(bodyParser.json());
    app.use(require('method-override')());
    app.use(require('cookie-parser')());
    
    
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
    require('../modules/passport')(app, passport);

    //setup routes
    require('../routes')(app, passport);

    //setup utilities
    app.utility = {};
    app.utility.sendmail = require('../modules/sendmail');
    app.utility.slugify = require('../modules/slugify');
    app.utility.workflow = require('../modules/workflow');
    app.utility.gettext = require('../modules/gettext');
    
    return app;
};





/**
 * @param app   Express app
 * 
 * @return server
 */
api.startServer = function(app, callback) {
    
    var http = require('http');
    var server = http.createServer(app);
    
    server.listen(app.config.port);
    
    if (callback) {
        server.on('listening', callback);
    }
    
    app.server = server;
    
    return server;
};
