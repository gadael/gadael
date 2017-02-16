'use strict';


/**
 * @param {AbsenceElem} e1
 * @param {AbsenceElem} e2
 * @return {Int}
 */
function sortElement(e1, e2) {
    if (e1.events[0].dtstart < e2.events[0].dtstart) {
        return -1;
    }

    if (e1.events[0].dtstart > e2.events[0].dtstart) {
        return 1;
    }

    return 0;
}




function getElementsPromise(user, types)
{
    let AbsenceElem = user.model('AbsenceElem');


    return AbsenceElem.find()
    .where('user.id').equals(user._id)
    .where('right.type.id').in(types)
    .populate('events', 'dtstart dtend')
    .select('consumedQuantity events right.type.id right.quantity_unit')
    .exec();
}




/**
 * Get list of absence elem used for the consumption
 * elements are sorted by first dtstart
 *
 * @param {User} user
 * @param {ObjectId[]} types
 *
 * @return {Promise}		resolve to array of absence element
 */
function getConsuptionHistory(user, types) {

    return getElementsPromise(user, types)
    .then(elements => {
        elements.sort(sortElement);
        return elements;
    });

}




/**
 * Get list of absence elem used for the consumption on this renewal
 *
 * @param {User} user
 * @param {ObjectId[]} types
 * @param {Date} start
 * @param {Date} finish
 *
 * @return {Promise}		resolve to array of absence element
 */
function getElementsOnPeriod(user, types, start, finish) {

    return getElementsPromise(user, types)
    .then(elements => {
        return elements.filter(elem => {
            let dtstart = elem.events[0].dtstart;
            let dtend = elem.events[elem.events.length-1].dtend;

            return (dtstart >= start && dtend <= finish);
        });
    });
}





/**
 * Get consumption for a list of right types and on a list of periods
 * @param {User} user
 * @param {Array} types         Select rights by types
 * @param {Array} periods       each period contain dtstart and dtend
 * @param {String} quantityUnit H or D rights with other units are ignored
 * @param {Renewal} renewal
 * @param {Number} cap          Cap on renewal consumption
 *
 * @return {Promise}	 Resolve to a number
 */
function getConsumedQuantityBetween(user, types, periods, quantityUnit, renewal, cap) {

    /**
     * test if element match at least one period in list
     * @return {boolean}
     */
    function matchPeriods(elem) {

        let dtstart = elem.events[0].dtstart;
        let dtend = elem.events[elem.events.length-1].dtend;

        for (let i=0; i<periods.length; i++) {
            let p = periods[i];
            if (dtstart >= p.dtstart && dtend <= p.dtend) {
                return true;
            }
        }

        return false;
    }

    let renewalConsuption = 0;

	return getElementsOnPeriod(user, types, renewal.start, renewal.finish)
	.then(history => {

        let quantity = 0;

        for (let i=0; i<history.length; i++) {
            let elem = history[i];
            let last = (cap - renewalConsuption);
            renewalConsuption += elem.consumedQuantity;

            if (renewalConsuption >= cap) {
                return quantity + last;
            }

			if (!matchPeriods(elem)) {
				continue;
			}

            if (elem.right.quantity_unit !== quantityUnit) {
                continue;
            }

			quantity += elem.consumedQuantity;
        }

		return quantity;
	});
}




exports = module.exports = {
    getConsuptionHistory: getConsuptionHistory,
    getConsumedQuantityBetween: getConsumedQuantityBetween
};
