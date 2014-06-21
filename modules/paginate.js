'use strict';

/**
 * create a 206 partial content HTTP response from 
 * a mongoose result set
 * 
 * @see https://github.com/begriffs/clean_pagination 
 * 
 * @param	object	req				request to get headers from
 * @param	object	res				response to complete
 * @param	int		total_items 	total number of items available, can be Infinity
 * @param	int		max_range_size	
 */ 
exports = module.exports = function(req, res, total_items, max_range_size)
{
	
	/**
	 * Parse requested range
	 */  
	function parseRange(hdr) {
		var m = hdr && hdr.match(/^(\d+)-(\d*)$/);
		if(!m) { 
			return null; 
		}
		return {
			from: +m[1],
			to: m[2] ? +m[2] : null
		};
	}
	
	
	res.header('Accept-Ranges', 'items');
	res.header('Range-Unit', 'items');
	
	if (0 == total_items)
	{
		// pagination not appliquable
		res.header('Content-Range', '*/'+total_items);
		return;
	}
	
	var range =  {
		from: 0,
		to: (total_items -1)
	};
	
	if ('items' === req.headers['range-unit'])
	{
		var parsedRange = parseRange(req.headers.range);
		if (parsedRange)
		{
			range = parsedRange;
		}
	}
	
	if (range.from > range.to || range.from >= total_items)
	{
		res.status(416); // Requested range unsatisfiable
		res.header('Content-Range', '*/'+total_items);
		return;
	}
	
	var available_to = Math.min(
		range.to, 
		total_items -1, 
		range.from + max_range_size -1
	);
	
	var report_total = total_items < Infinity ? total_items : '*';
	
	res.header('Content-Range', range.from+'-'+available_to+'/'+report_total);
	
	var available_limit = available_to - range.from + 1;
	

	if (available_limit < total_items)
	{
		res.status(206); // Partial contents
	} else {
		res.status(200); // OK (all items)
	}
	

	
	
	// Links
	
	function buildLink(rel, items_from, items_to)
	{
		var to = items_to < Infinity ? items_to : '';
		return '<'+req.url+'>; rel="'+rel+'"; items="'+items_from+'-'+to+'"';
	}
	
	var requested_limit = range.to - range.from + 1;
	var links = [];
	
	if (available_to < total_items -1)
	{
		links.push(buildLink('next',  
			available_to + 1, 
			available_to + requested_limit
		));
		
		if (total_items < Infinity)
		{
			var last_start = ((total_items-1) / available_limit) * available_limit;
			
			links.push(buildLink('last',  
				last_start, 
				last_start + requested_limit - 1
			));
		}
	}
	
	
	if (range.from > 0)
	{
		var previous_from = Math.max(0, range.from - Math.min(requested_limit, max_range_size));
		links.push(buildLink('prev',  
			previous_from, 
			previous_from + requested_limit - 1
		));
		
		links.push(buildLink('first',  
			0, 
			requested_limit-1
		));
	}
	
	res.header('Link', links.join(', '));
	
	
	// return values named from mongoose methods
	return 	{
		limit: available_limit, 
		skip: range.from
	};
}
