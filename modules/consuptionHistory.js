'use strict';


/**
 * Get list of absence elem used for the consuption on this renewal
 * elements are sorted by first dtstart
 *
 * @param {User} user
 * @param {ObjectId[]} types
 *
 * @return {Promise}		resolve to array of absence element
 */
function getConsuptionHistory(user, types) {

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

    let userId = (undefined === user._id) ? user : user._id;

    let AbsenceElem = user.model('AbsenceElem');


    return AbsenceElem.find()
    .where('user.id').equals(userId)
    .where('right.type.id').in(types)
    .populate('events', 'dtstart')
    .select('consumedQuantity events right.type.id')
    .exec()
    .then(elements => {
        elements.sort(sortElement);
        return elements;
    });

}




/**
 * Get consuption between 2 dates
 * @param {User} user
 * @param {Array} types         Select rights by types
 * @param {Date} dtstart
 * @param {Date} dtend
 * @param {String} quantityUnit H or D rights with other units are ignored
 *
 * @return {Promise}	 Resolve to a number
 */
function getConsumedQuantityBetween(user, types, dtstart, dtend, quantityUnit) {

	return getConsuptionHistory(user, types)
	.then(history => {
		return history.reduce((quantity, elem) => {

			if (elem.dtstart > dtend || elem.dtend < dtstart) {
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
