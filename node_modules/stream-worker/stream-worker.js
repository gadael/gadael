var Promise = require('bluebird');

module.exports = function(stream, concurrency, worker, cb) {
  var tasks = [],
      running = 0,
      closed = false,
      firstError = null;

  if (worker.length > 1) { // worker returns a callback
    worker = Promise.promisify(worker);
  }

  return Promise.try(function() {

    var resolve, reject;
    var streamPromise = new Promise(function(__resolve, __reject) {
      resolve = __resolve;
      reject = __reject;
    });

    function errorHandler (err) {
      if (err != null) {
        if (firstError == null) {
          firstError = err;
        }
      }
    }

    function closeHandler () {
      closed = true;
      completeIfDone();
    }

    function finishTask (err) {
      running -= 1;
      errorHandler(err);
      if (tasks.length) {
        startNextTask();
      } else {
        completeIfDone();
        stream.resume();
      }
    }

    function startNextTask () {
      var data = tasks.shift();
      if (data == null) {
        completeIfDone();
      }
      running += 1;
      try {
        Promise.resolve(worker(data))
        .then(function (finishedWith) {
          finishTask();
        })
        .error(function (err) {
          finishTask(err);
        });
      } catch (e) {
        finishTask(e);
      }
    }

    function completeIfDone () {
      if (!closed || tasks.length > 0 || running > 0) return;
      if (firstError) return reject(firstError);
      return resolve();
    }

    stream.on('data', function(data) {
      tasks.push(data);
      if (running < concurrency) {
        startNextTask();
      } else {
        stream.pause();
      }
    });

    stream.on('error', errorHandler);
    stream.on('close', closeHandler);
    stream.on('end', closeHandler);

    return streamPromise;
  })
  .asCallback(cb);
};
