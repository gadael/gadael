expect = require 'expect.js'
sinon = require 'sinon'
expect = require('sinon-expect').enhance(expect, sinon, 'was')
{PassThrough} = require 'stream'
streamWorker = require '..'
Promise = require 'bluebird'

describe 'stream-worker', ->
  {stream, concurrencyLimit, work, workers, done} = {}

  describe 'promise style', ->
    beforeEach ->
      concurrencyLimit = 2
      stream = new PassThrough()
      workers = []
      done = sinon.spy()
      work = sinon.spy (data) ->
        resolve = null
        promise = new Promise (__resolve) -> resolve = __resolve
        workers.push {data, done: resolve}
        promise

      streamWorker(stream, concurrencyLimit, work).then(done)

      return # so that we don't return a promise from the beforeEach block

    describe 'when the stream emits data', ->
      beforeEach ->
        stream.write 'a'

      it 'invokes the worker function on the data', ->
        expect(work).was.calledOnce()

    describe 'when the concurrency limit is reached and more data is emitted', ->
      beforeEach ->
        sinon.spy stream, 'pause'
        for x in [0..concurrencyLimit]
          stream.write 'b'

      it 'pauses the stream', ->
        expect(work.callCount).to.be 2
        expect(stream.pause).was.called()

      describe 'then a worker frees up', ->
        beforeEach (done) ->
          sinon.spy stream, 'resume'
          workers[0].done() # works on the extra data that caused us to pause the stream
          workers[1].done() # free to work on something new
          process.nextTick(done) # wait for async operations

        it 'resumes the stream', ->
          expect(stream.resume).was.called()

    describe 'the stream synchronously dispatches multiple data events from resume', ->
      # this is how mongoose QueryStream behaves: http://mongoosejs.com/docs/api.html#querystream_QueryStream
      beforeEach (done) ->
        # stub resume to emit multiple data events
        originalResume = stream.resume
        stream.resume = (args...) ->
          stream.emit 'data', 'c'
          stream.emit 'data', 'd'
          originalResume.apply stream, args

        # saturate workers, with 1 'b' queued for the first free worker
        for x in [0..concurrencyLimit]
          stream.write 'b'

        workers[0].done() # free to work on the enqueued 'b'
        process.nextTick(done) # wait for async operations

      beforeEach (done) ->
        work.reset() # only assert on workers invoked after the resume
        workers[1].done() # free to work on something new, triggers resume
        process.nextTick(done) # wait for async operations

      it 'still respects concurrency limits', ->
        expect(work).was.calledOnce() # there's only one free worker

    describe 'when the stream ends', ->
      describe 'while workers are working', ->
        beforeEach (done) ->
          stream.write 'a'
          stream.end(done)

        it 'waits for all workers to finish, then calls the done callback', ->
          expect(done).was.notCalled()
          workers[0].done()
          Promise.resolve() # wait for async operations
          .then -> Promise.resolve() # wait again...
          .then -> expect(done).was.called()

      describe 'before emitting any data', ->
        beforeEach (done) ->
          stream.end(done)

        it 'still calls the done callback', ->
          Promise.resolve() # wait for async operations
          .then -> Promise.resolve() # wait again...
          .then -> expect(done).was.called()

  describe 'callback style', ->
    beforeEach ->
      concurrencyLimit = 2
      stream = new PassThrough()
      workers = []
      done = sinon.spy()
      work = sinon.spy (data, workerDone) ->
        workers.push {data, done: workerDone}

      streamWorker stream, concurrencyLimit, work, done

      return # so that we don't return a promise from the beforeEach block

    describe 'when the stream emits data', ->
      beforeEach ->
        stream.write 'a'

      it 'invokes the worker function on the data', ->
        expect(work).was.calledOnce()

    describe 'when the concurrency limit is reached and more data is emitted', ->
      beforeEach ->
        sinon.spy stream, 'pause'
        for x in [0..concurrencyLimit]
          stream.write 'b'

      it 'pauses the stream', ->
        expect(work.callCount).to.be 2
        expect(stream.pause).was.called()

      describe 'then a worker frees up', ->
        beforeEach (done) ->
          sinon.spy stream, 'resume'
          workers[0].done() # works on the extra data that caused us to pause the stream
          workers[1].done() # free to work on something new
          process.nextTick(done) # wait for async operations

        it 'resumes the stream', ->
          expect(stream.resume).was.called()

    describe 'the stream synchronously dispatches multiple data events from resume', ->
      # this is how mongoose QueryStream behaves: http://mongoosejs.com/docs/api.html#querystream_QueryStream
      beforeEach (done) ->
        # stub resume to emit multiple data events
        originalResume = stream.resume
        stream.resume = (args...) ->
          stream.emit 'data', 'c'
          stream.emit 'data', 'd'
          originalResume.apply stream, args

        # saturate workers, with 1 'b' queued for the first free worker
        for x in [0..concurrencyLimit]
          stream.write 'b'

        workers[0].done() # free to work on the enqueued 'b'
        process.nextTick(done) # wait for async operations

      beforeEach (done) ->
        work.reset() # only assert on workers invoked after the resume
        workers[1].done() # free to work on something new, triggers resume
        process.nextTick(done) # wait for async operations

      it 'still respects concurrency limits', ->
        expect(work).was.calledOnce() # there's only one free worker

    describe 'when the stream ends', ->
      describe 'while workers are working', ->
        beforeEach (done) ->
          stream.write 'a'
          stream.end(done)

        it 'waits for all workers to finish, then calls the done callback', ->
          expect(done).was.notCalled()
          workers[0].done()
          Promise.resolve() # wait for async operations
          .then -> Promise.resolve() # wait again...
          .then -> expect(done).was.called()

      describe 'before emitting any data', ->
        beforeEach (done) ->
          stream.end(done)

        it 'still calls the done callback', ->
          Promise.resolve() # wait for async operations
          .then -> Promise.resolve() # wait again...
          .then -> expect(done).was.called()

    describe 'when the stream is closed with an error', ->
      describe 'while workers are working', ->
        beforeEach () ->
          stream.write 'a'
          stream.emit 'error', new Error('a')
          stream.emit 'close'

        it 'waits for all workers to finish, then calls the done callback', ->
          expect(done).was.notCalled()
          workers[0].done()
          Promise.resolve() # wait for async operations
          .then -> Promise.resolve() # wait again...
          .then -> expect(done).was.called()

      describe 'before emitting any data', ->
        beforeEach () ->
          stream.emit 'error', new Error('a')
          stream.emit 'close'

        it 'still calls the done callback', ->
          Promise.resolve() # wait for async operations
          .then -> Promise.resolve() # wait again...
          .then -> expect(done).was.called()

    describe 'when the stream is closed with an error after ending', ->
      describe 'while workers are working', ->
        beforeEach () ->
          stream.write 'a'
          stream.emit 'end'
          # in case the underlying stream implementation emits both an
          # end and error/close pair of events
          stream.emit 'error', new Error('a')
          stream.emit 'close'

        it 'waits for all workers to finish, then calls the done callback', ->
          expect(done).was.notCalled()
          workers[0].done()
          Promise.resolve() # wait for async operations
          .then -> Promise.resolve() # wait again...
          .then -> expect(done).was.calledOnce() # ensure only called once

      describe 'before emitting any data', ->
        beforeEach () ->
          stream.emit 'error', new Error('a')
          stream.emit 'close'

        it 'still calls the done callback', ->
          Promise.resolve() # wait for async operations
          .then -> Promise.resolve() # wait again...
          .then -> expect(done).was.calledOnce() # ensure only called once
