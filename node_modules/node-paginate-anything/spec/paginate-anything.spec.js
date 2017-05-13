'use strict';
var http = require('http');
var paginate = require('../src/paginate-anything');


var server = http.createServer(function (req, res) {
	
	var url = require('url').parse(req.url, true);
	var params = url.query;
	
	var total_items 	= '*' === params.total_items ? Infinity : params.total_items;
	var max_range_size 	= params.max_range_size;
	
	var p = paginate(req, res, total_items, max_range_size);
    
    var input = 'Item ';
    var body = '';
    var multiplier = total_items;
    
    while (true) {
        if (multiplier & 1) {
          body += input;
        }
        multiplier >>= 1;
        if (multiplier) {
          input += input;
        } else {
          break;
        }
    }

	res.end(body);
	req.connection.destroy();
});
server.listen(3000);



/**
 * @param	int		total_items  	Total number of items on server (can be Infinity)
 * @param	int		max_range_size	The max_range_size value used on server 
 * @param	string	range			range used by the client query
 */  
function paginatedRequest(total_items, max_range_size, range, callback)
{
	if (total_items >= Infinity)
	{
		total_items = '*';
	}
    
    if (range !== null) {
        var headers = {
		  'range-unit': 'items',
		  'range': range
		};
	} else {
        var headers = {};
    }
	
	var options = {
	  hostname: 'localhost',
	  port: 3000,
	  path: '/?total_items='+total_items+'&max_range_size='+max_range_size,
	  method: 'GET',
	  headers: headers
	};

	var req = http.request(options, callback);


	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});

	req.end();
}


/**
 * Get the ranges for each link in the link header
 * @param	http.ServerResponse		response
 */  
function linkHeader(response)
{
	var link = {};
	
	if (response.headers['link'] == undefined)
	{
		return link;
	}
	
	var arr = response.headers['link'].split(',');
	for(var i=0; i<arr.length; i++)
	{
		var rel = null;
		var items = null;
		
		var elements = arr[i].trim().split(';');
		for(var j=0; j<elements.length; j++)
		{
			var f = elements[j].trim().match(/([^=]+)="([^"]+)"/);
			
			if (f)
			{
				if (f[1] === 'rel') {
					rel = f[2];
				}
				
				if (f[1] === 'items') {
					items = f[2];
				}
			}
		}
		
		if (rel && items)
		{
			link[rel] = items;
		}
	}
	
	return link;
}



describe('node-paginate-anything', function PaginateTestSuite() {

	it('respond with full range on rangeless request', function (done){
		http.get('http://localhost:3000?total_items=10&max_range_size=1000', function(response){
			expect(response.headers['accept-ranges']).toBe('items');
			expect(response.headers['content-range']).toBe('0-9/10');
			expect(response.statusCode).toBe(200);
			done();
		});
	});
	
	
	it('works normally on rangeless request if max_range >= total', function (done){
		
		http.get('http://localhost:3000?total_items=100&max_range_size=100', function(response){
			expect(response.headers['accept-ranges']).toBe('items');
			expect(response.headers['content-range']).toBe('0-99/100');
			expect(response.statusCode).toBe(200);
			done();
		});
	});
	
	
	it('truncates response on rangeless request if max_range < total', function (done){
		http.get('http://localhost:3000?total_items=101&max_range_size=100', function(response){
			expect(response.headers['accept-ranges']).toBe('items');
			expect(response.headers['content-range']).toBe('0-99/101');
			expect(response.statusCode).toBe(206);
			done();
		});
	});
	
	
	it('truncate oversized range', function (done){
		paginatedRequest(101, 100, '0-100', function(response){
			expect(response.headers['accept-ranges']).toBe('items');
			expect(response.headers['content-range']).toBe('0-99/101');
			expect(response.statusCode).toBe(206);
			done();
		});
	});
	
	

	
	
	
	it('server should respond with partial content and links', function (done){
		paginatedRequest(100, 1000, '10-19', function(response){
			var links = linkHeader(response);
			expect(links.prev).toBe('0-9');
			expect(links.first).toBe('0-9');
			expect(links.next).toBe('20-29');
			expect(links.last).toBe('90-99');
			expect(response.headers['content-range']).toBe('10-19/100');
			expect(response.statusCode).toBe(206);
			done();
		});
	});
	
	it('server should respond with a requested range unsatisfiable response', function (done){
		paginatedRequest(5, 1000, '20-25', function(response){
			expect(response.headers['content-range']).toBe('*/5');
			expect(response.statusCode).toBe(416);
			done();
		});
		
		paginatedRequest(80, 1000, '25-15', function(response){
			expect(response.headers['content-range']).toBe('*/80');
			expect(response.statusCode).toBe(416);
			done();
		});
		
	});


    it('returns empty body when there are zero total items', function (done){

		paginatedRequest(0, 1000, null, function(response){
			expect(response.statusCode).toBe(204);
            
            response.setEncoding('utf8');
            response.on('data', function (chunk) {
                expect(chunk).toBe('');
            });
            
            response.on('end', function() {
                done();
            });
		});
	});
	
	
	it('accepts a range starting from 0 when there are no items', function (done){

		paginatedRequest(0, 1000, '0-9', function(response){
			expect(response.headers['content-range']).toBe('*/0');
			expect(response.statusCode).toBe(204);
			done();
		});
	});
	
	
	it('refuses a range with nonzero start when there are no items', function (done){

		paginatedRequest(0, 1000, '1-10', function(response){
			expect(response.headers['content-range']).toBe('*/0');
			expect(response.statusCode).toBe(416);
			done();
		});
	});
	
	
	it('refuses range start past end', function (done){

		paginatedRequest(101, 100, '101-', function(response){
			expect(response.headers['content-range']).toBe('*/101');
			expect(response.statusCode).toBe(416);
			done();
		});
	});
	
	
	it('allows one-item requests', function (done){

		paginatedRequest(101, 100, '0-0', function(response){
			expect(response.headers['content-range']).toBe('0-0/101');
			expect(response.statusCode).toBe(206);
			done();
		});
	});
	
	
	it('handles ranges beyond collection length via truncation', function (done){

		paginatedRequest(101, 100, '50-200', function(response){
			expect(response.headers['content-range']).toBe('50-100/101');
			expect(response.statusCode).toBe(206);
			done();
		});
	});
	
	
	
	it('respond partial content and correct range for infinity total items', function (done){

		paginatedRequest(Infinity, 1000, '50-55', function(response){
			
			var links = linkHeader(response);
			expect(links.prev).toBe('44-49');
			expect(links.first).toBe('0-5');
			
			expect(response.headers['content-range']).toBe('50-55/*');
			expect(response.statusCode).toBe(206);
			done();
		});
	});
	
	
	
	it('next page range can extend beyond last item', function (done){
		paginatedRequest(100, 100, '50-89', function(response){
			var links = linkHeader(response);
			expect(links.next).toBe('90-129');
			done();
		});
	});
	
	
	it('previous page range cannot go negative', function (done){
		paginatedRequest(100, 100, '10-99', function(response){
			var links = linkHeader(response);
			expect(links.prev).toBe('0-89');
			done();
		});
	});
	
	
	it('first page range always starts at zero', function (done){
		paginatedRequest(100, 100, '63-72', function(response){
			var links = linkHeader(response);
			expect(links.first).toBe('0-9');
			done();
		});
	});
	
	
	it('last page range can extend beyond the last item', function (done){
		paginatedRequest(100, 100, '0-6', function(response){
			var links = linkHeader(response);
			expect(links.last).toBe('98-104');
			done();
		});
	});
	

	it('infinite collections have no last page', function (done){
		paginatedRequest(Infinity, 100, '0-9', function(response){
			var links = linkHeader(response);
			expect(links.last).toBe(undefined);
			done();
		});
	});
	
	
	// TODO: omitting the end number asks for everything
	
	
	it('omitting the end number omits in first link too', function (done){
		paginatedRequest(Infinity, 1000000, '50-', function(response){
			var links = linkHeader(response);
			expect(links.first).toBe('0-');
			done();
		});
	});
	

	it('next link with omitted end number shifts by max page', function (done){
		paginatedRequest(Infinity, 1000000, '50-', function(response){
			var links = linkHeader(response);
			expect(links.next).toBe('1000050-');
			done();
		});
	});
	

	it('prev link with omitted end number shifts by max page', function (done){
		paginatedRequest(Infinity, 25, '50-', function(response){
			var links = linkHeader(response);
			expect(links.prev).toBe('25-');
			done();
		});
	});
	

	it('shifts penultimate page to beginning, preserving length', function (done){
		paginatedRequest(100, 101, '10-49', function(response){
			var links = linkHeader(response);
			expect(links.prev).toBe('0-39');
			expect(links.first).toBe('0-39');
			done();
		});
	});
	
	// TODO: prev is the left inverse of next
	
	// TODO: for from > to-from, next is the right inverse of prev
	
	
	it('omits prev and first links at start', function (done){
		paginatedRequest(100, 101, '0-9', function(response){
			var links = linkHeader(response);
			expect(links.prev).toBe(undefined);
			expect(links.first).toBe(undefined);
			done();
		});
	});
	
	it('omits next and last links at end', function (done){
		paginatedRequest(100, 101, '90-99', function(response){
			var links = linkHeader(response);
			expect(links.last).toBe(undefined);
			expect(links.next).toBe(undefined);
			done();
		});
	});
	
	
	// TODO: preserves query parameters in link headers
	
	

	
	it('Test server should close', function (done){
		server.close(done);
	});
	

});


