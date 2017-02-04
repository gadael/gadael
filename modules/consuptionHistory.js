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


/**
 * Get list of absence elem used for the consuption
 * elements are sorted by first dtstart
 *
 * @param {User} user
 * @param {ObjectId[]} types
 *
 * @return {Promise}		resolve to array of absence element
 */
function getConsuptionHistory(user, types) {



    let userId = (undefined === user._id) ? user : user._id;

    let AbsenceElem = user.model('AbsenceElem');


    return AbsenceElem.find()
    .where('user.id').equals(userId)
    .where('right.type.id').in(types)
    .populate('events', 'dtstart dtend')
    .select('consumedQuantity events right.type.id right.quantity_unit')
    .exec()
    .then(elements => {
        elements.sort(sortElement);
        return elements;
    });

}




/**
 * Get list of absence elem used for the consuption on this renewal
 *
 * @param {User|ObjectId} user
 * @param {ObjectId[]} types
 * @param {Date} start
 * @param {Date} finish
 *
 * @return {Promise}		resolve to array of absence element
 */
function getElementsOnPeriod(user, types, start, finish) {


    let userId = (undefined === user._id) ? user : user._id;

    let AbsenceElem = user.model('AbsenceElem');

    return AbsenceElem.find()
    .where('user.id').equals(userId)
    .where('right.type.id').in(types)
    .populate('events', 'dtstart dtend')
    .select('consumedQuantity events right.type.id right.quantity_unit')
    .exec()
    .then(elements => {
        return elements.filter(elem => {
            let dtstart = elem.events[0].dtstart;
            let dtend = elem.events[elem.events.length-1].dtend;

            return (dtstart >= start && dtend <= finish);
        });
    });
}





/**
 * Get consuption for a list of right types and on a list of periods
 * @param {User} user
 * @param {Array} types         Select rights by types
 * @param {Array} periods       each period contain dtstart and dtend
 * @param {String} quantityUnit H or D rights with other units are ignored
 * @param {Renewal} renewal
 * @param {Number} cap          Cap on renewal consuption
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

		return history.reduce((quantity, elem) => {

            renewalConsuption += elem.consumedQuantity;

            if (renewalConsuption >= cap) {
                return quantity;
            }

			if (!matchPeriods(elem)) {
				return quantity;
			}

            if (elem.right.quantity_unit !== quantityUnit) {
                return quantity;
            }

			return quantity + elem.consumedQuantity;
		}, 0);
	});
}




exports = module.exports = {
    getConsuptionHistory: getConsuptionHistory,
    getConsumedQuantityBetween: getConsumedQuantityBetween
};
