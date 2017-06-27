'use strict';

/**
 * Postpone promise execution in configured in app
 * in production, tasks will be postponed
 * for tests and dev, the task stay in promise chain
 *
 * postpone is used to refresh cache
 *
 * @param {Object} config
 */
exports = module.exports = function(config) {

    /**
     * @param {Function<Promise>} task
     * @return {Promise}
     */
    return function postpone(task) {

        if (!config.postpone) {
            return Promise.resolve(task())
            .catch(err => {
                console.error('hidden error in postonnable process');
                console.error(err.stack);
                return;
            })
            .then(() => {
                return null;
            });
        }

        setTimeout(task, 500);
        return Promise.resolve(null);
    };
};
