stream-worker  [![build status](https://secure.travis-ci.org/goodeggs/stream-worker.png)](http://travis-ci.org/goodeggs/stream-worker)
=============

Execute an async function per [stream](http://nodejs.org/api/stream.html) data event, pausing the stream when a concurrency limit is saturated.  Inspired by [async.queue](https://github.com/caolan/async#queue), optimized for streams.

Supports promises and callbacks.


The Basics
----------

```
npm install stream-worker
```

Requiring:

```js
var streamWorker = require('stream-worker');
```


Promise style:

```js
streamWorker(stream, 10, function(data) {
  /* ... do some work with data ... */
  return Promise.resolve();
})
.then(function() {
  /* ... the stream is exhausted and all workers are finished ... */
}, function(err) {
  /* ... there was an error processing the stream ... */
})
```


Callback style:

```js
streamWorker(stream, 10,
  function(data, done) {
    /* ... do some work with data ... */
    done(err);
  },
  function(err) {
    /* ... the stream is exhauseted and all workers are finished ... */
  }
);
```

Signature
---------
streamWorker(**stream**, **concurrencyLimit**, **work**, **done**)
