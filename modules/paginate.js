'use strict';

/**
 * create a 206 partial content HTTP response from 
 * a mongoose result set 
 */ 
exports = module.exports = function(req, res, query)
{
	
	var unit = req.headers['range-unit'];
	var range = req.headers.range.split('-');
	
	query.skip((req.param('page') -1) * req.param('count'));
	query.limit(req.param('count'));
	
	query.exec(function (err, docs) {
		if (err) {
			return console.error(err);
		}
		
		res.header('Accept-Ranges', 'items');
		res.header('Content-Range', '0-1/1');
		res.header('Range-Unit', 'items');
		res.status(206);
		res.json(docs);
	});
}
