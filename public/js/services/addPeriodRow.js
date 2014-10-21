define([], function() {
        
    'use strict';
    
    /**
     * Add periods form in the array of items
     *
     * @param {Array}     items        items binded to rows
     * @param {$resource} itemResource resource for one row
     */
	return function(items, itemResource) {
		var nextDate;
        var length = items.length;
        if (length > 0) {
            var lastItem = items[length - 1];

            if (!lastItem.to) {

                var from = new Date(lastItem.from);
                var today = new Date();

                var maxTime = Math.max.apply(null,[from.getTime(), today.getTime()]);

                lastItem.to = new Date();
                lastItem.to.setTime(maxTime);
                lastItem.to.setHours(0);
                lastItem.to.setMinutes(0);
                lastItem.to.setSeconds(0);


                lastItem.to.setDate(lastItem.to.getDate()+1);
            }


            nextDate = new Date(lastItem.to);
            nextDate.setDate(nextDate.getDate()+1);
        } else {
            nextDate = new Date();
        }
        
        var item = new itemResource();

        item.rightCollection = null;
        item.from = nextDate;
        item.to = null;

        items.push(item);
	};
});
