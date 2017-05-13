# Node-XLSX-Writestream

Simple streaming XLSX writer. Reverse-engineered from sample XLSX files.

[![Build Status](https://travis-ci.org/STRML/node-xlsx-writestream.png?branch=master)](https://travis-ci.org/STRML/node-xlsx-writestream)

Node-XLSX-WriteStream is written in [Literate CoffeeScript](http://coffeescript.org/#literate), so the source
can be viewed as Markdown.

[View the source & API.](src/index.litcoffee)

This repository is a streaming fork of [node-xls-writer](https://github.com/rubenv/node-xlsx-writer).

## Usage

You can install the latest version via npm:

    $ npm install --save xlsx-writestream

Require the module:

    var xlsx = require('xlsx-writestream');

Write a spreadsheet:

    var data = [
        {
            "Name": "Bob",
            "Location": "Sweden"
        },
        {
            "Name": "Alice",
            "Location": "France"
        }
    ];

    xlsx.write('mySpreadsheet.xlsx', data, function (err) {
        // Error handling here
    });

This will write a spreadsheet like this:

    Name    | Location
    --------+---------
    Bob     | Sweden
    Alice   | France

In other words: The key names are used for the first row (headers),
The values are used for the columns. All field names should be present
in the first row.

## Streaming Usage

You can also use the full API manually. This allows you to build the
spreadsheet incrementally:

    var XLSXWriter = require('xlsx-writestream');
    var fs = require('fs');

    var writer = new XLSXWriter('mySpreadsheet.xlsx', {} /* options */);

    // After instantiation, you can grab the readstream at any time.
    writer.getReadStream().pipe(fs.createWriteStream('mySpreadsheet.xlsx'));

    // Add some rows
    writer.addRow({
        "Name": "Bob",
        "Location": "Sweden"
    });
    writer.addRow({
        "Name": "Alice",
        "Location": "France"
    });

    // Add a row with a hyperlink
    writer.addRow({
        "Name": {value: "Bill", hyperlink: "http://www.thegatesnotes.com"},
        "Location": "Seattle, Washington"
    })

    // Optional: Adjust column widths
    writer.defineColumns([
        { width: 30 }, // width is in 'characters'
        { width: 10 }
    ])

    // Finalize the spreadsheet. If you don't do this, the readstream will not end.
    writer.finalize();

## More Streaming Usage

For example, you may want to stream data from a remote API into an XLSX file:

    var XLSXWriter = require('xlsx-writestream');
    var JSONStream = require('JSONStream');
    var request = require('request');
    var fs = require('fs');

    var writer = new XLSXWriter();

    writer.getReadStream().pipe(fs.createWriteStream('npm-registry.xlsx'));

    var rowStream = request('http://isaacs.couchone.com/registry/_all_docs')
      .pipe(JSONStream.parse('rows.*'));

    rowStream.on('data', function(row) {
      writer.addRow(row);
    });

    rowStream.on('end', function() {
      writer.finalize();
    });


## Data Types

Numbers, Strings, and Dates are automatically converted when inputted. Simply
use their native types. Additionally, any data item can be turned into a hyperlink
by enclosing it within an object with the keys `value, hyperlink`.

    writer.addRow({
        "A String Column" : "A String Value",
        "A Number Column" : 12345,
        "A Date Column" : new Date(1999,11,31)
        "A String column with a hyperlink" : {value: "A String Value", hyperlink: "http://www.google.com"}
        "A Number column with a hyperlink" : {value: 12345, hyperlink: "http://www.google.com"}
        "A Date column with a hyperlink" : {value: new Date(1999,11,31), hyperlink: "http://www.google.com"}
    })

## Speed

The XLSX format is actually a zip file, and Node-XLSX-WriteStream uses [node-zip](https://github.com/daraosn/node-zip) internally.
Node-zip generates zip files synchronously but is very fast.

Pending a possible asynchronous rework, if speed is a big concern to you, run `pack()` in
a thread using something like [node-webworker-threads](https://github.com/audreyt/node-webworker-threads).

This repo contains a simple benchmark suite that can give you an idea of how this module
will perform using a 10x10 and 200x200 dataset.
The following are results on an 2.3GHz i7 Macbook Pro Retina (2013):

```
Running suite Node-XLSX-WriteStream benchmarks [benchmarks/zip-benchmark.js]...
>> Small dataset - Packing x 742 ops/sec ±1.39% (82 runs sampled)
>> Small dataset - Adding rows only x 12,849 ops/sec ±6.92% (88 runs sampled)
>> Small dataset - Generate entire file x 232 ops/sec ±1.60% (80 runs sampled)
>> Small dataset - Generate entire file (parallelism: 10) x 32.00 ops/sec ±9.02% (56 runs sampled)
>> Large dataset - Packing x 83.16 ops/sec ±20.18% (37 runs sampled)
>> Large dataset - Packing (no compression) x 399 ops/sec ±2.73% (36 runs sampled)
>> Large dataset - Adding rows only x 27.90 ops/sec ±4.10% (47 runs sampled)
>> Large dataset - Generate entire file x 7.54 ops/sec ±3.47% (40 runs sampled)
>> Large dataset - Generate entire file (parallelism: 10) x 0.91 ops/sec ±1.22% (9 runs sampled)
```

## Notes

If you decide to define column properties, be sure to do so before you write any rows.
I have seen certain versions of Excel (infuriatingly) crash if columns come after rows.

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding
style. Add unit tests for any new or changed functionality.

All source-code is written in CoffeeScript and is located in the `src`
folder. Do not edit the generated files in `lib`, they will get overwritten
(and aren't included in git anyway).

You can build and test your code using [Grunt](http://gruntjs.com/). The
default task will clean the source, compiled it and run the tests.

## License

Copyright (c) 2013 Ruben Vermeersch

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
