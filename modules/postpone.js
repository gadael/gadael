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
     * @param {Promise} task
     * @return {Promise}
     */
    return function postpone(task) {

        if (!config.postpone) {
            return task
            .then(() => {
                return null;
            });
        }

        return Promise.resolve(null);
    };
};
