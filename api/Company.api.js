'use strict';

var api = {};
exports = module.exports = api;



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
 * @param	object		db			database connexion
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
 * @param	string		name		Company fullname
 * @param	function	callback	done function with the new connexion given as parameter
 */  
api.createDb = function(app, dbName, name, callback) {
	
	var db = app.mongoose.createConnection(app.config.mongodb.prefix + dbName);
	db.on('error', console.error.bind(console, 'CompanyApi.createDb mongoose connection error: '));
	
	db.once('open', function() {
		
		//config data models
		var models = require('../models');
		
		models.requirements = {
			mongoose: app.mongoose,
			db: db,	
			autoIndex: true
		};
		
		models.load();
		
		// create the company entry
		
		var company = new db.models.Company({
			name: name
		});
		
		company.save(function (err) {
			if (err) {
				console.error(err);
			} else {
				callback();
			}
			
			db.close();
		});
	});
};
