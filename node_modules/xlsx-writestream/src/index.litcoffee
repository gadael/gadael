Node-XLSX-Stream
================

Node-XLSX-Stream is written in literate coffeescript. The following is the actual source of the
module.

    fs = require('fs')
    blobs = require('./blobs')
    Archiver = require('archiver')

    module.exports = class XlsxWriter



### Simple writes

##### XlsxWriter.write(out: String, data: Array, cb: Function)

The simplest way to use Node-XLSX-Stream is to use the write method.

The callback comes directly from `fs.writeFile` and has the arity `(err)`

      # @param {String} out Output file path.
      # @param {Array} data Data to write.
      # @param {Function} cb Callback to call when done. Fed (err).
      @write = (out, data, cb) ->
        writer = new XlsxWriter({out: out})
        writer.addRows(data)
        writer.writeToFile(cb)

### Advanced usage

Node-XLSX-Stream has more advanced features available for better customization
of spreadsheets.

When constructing a writer, pass it an optional file path and customization options.

##### new XlsxWriter([options]: Object) : XlsxWriter

      # Build a writer object.
      # @param {Object} [options] Preparation options.
      # @param {String} [options.out] Output file path.
      # @param {Array}  [options.columns] Column definition. Must be added in constructor.
      # @example options.columns = [
      #     {  width: 30 }, // width is in 'characters'
      #     {  width: 10 }
      # ]
      constructor: (options = {}) ->

        # Support just passing a string path into the constructor.
        if (typeof options == 'string')
          options = {out: options}

        # Set options.
        defaults = {
          defaultWidth: 15
          zip: {
            forceUTC: true # this is required, zips will be unreadable without it
          },
          columns: []
        }
        @options = _extend(defaults, options)

        # Start sheet.
        @_resetSheet()

        # Write column definition.
        @defineColumns(@options.columns)

        # Create Zip.
        zipOptions = @options.zip || {}
        zipOptions.forceUTC = true # force this on in all cases for now, otherwise we're useless
        @zip = Archiver('zip', zipOptions)

        # Archiver attaches an exit listener on the process, we don't want this,
        # it will fire if this object is never finalized.
        @zip.catchEarlyExitAttached = true

        # Hook this passthrough into the zip stream.
        @zip.append(@sheetStream, {name: 'xl/worksheets/sheet1.xml'})

#### Adding rows

Rows are easy to add one by one or all at once. Data types within the sheet will
be inferred from the data types passed to addRow().

##### addRow(row: Object)

Add a single row.

      # @example (javascript)
      # writer.addRow({
      #     "A String Column" : "A String Value",
      #     "A Number Column" : 12345,
      #     "A Date Column" : new Date(1999,11,31)
      # })
      addRow: (row) ->

        # Values in header are defined by the keys of the object we've passed in.
        # They need to be written the first time they're passed in.
        if !@haveHeader
          @_write(blobs.sheetDataHeader)
          @_startRow()
          col = 1
          for key of row
            @_addCell(key, col)
            @cellMap.push(key)
            col += 1
          @_endRow()

          @haveHeader = true

        @_startRow()
        for key, col in @cellMap
          @_addCell(row[key] || "", col + 1)
        @_endRow()

##### addRows(rows: Array)

Rows can be added in batch.

      addRows: (rows) ->
        for row in rows
          @addRow(row)

##### defineColumns(columns: Array)

Column definitions can be easily added, but it *must* be done before rows are added
to prevent a nasty Excel bug.

      # @example (javascript)
      # writer.defineColumns([
      #     {  width: 30 }, // width is in 'characters'
      #     {  width: 10 }
      # ])
      defineColumns: (columns) ->
        if @haveHeader
          throw new Error """
            Columns cannot be added after rows! Unfortunately Excel will crash
            if column definitions come after sheet data. Please move your `defineColumns()`
            call before any `addRow()` calls, or define options.columns in the XlsxWriter
            constructor.
          """
        @options.columns = columns
        # Write column metadata.
        # Would really like to do this at the end so that we don't have to mandate
        # it comes first, but Excel pukes if <cols> comes before <sheetData>.
        @_write(@_generateColumnDefinition())


#### File generation

Once you are done adding rows & defining columns, you have a few options
for generating the file. The `writeToFile` helper is a one-stop-shop for writing
directly to a file using `fs.writeFile`; otherwise, you can pack() manually,
which will return a readable stream.

##### writeToFile([fileName]: String, cb: Function)

Writes data to a file. Convenience method.

If no filename is specified, will attempt to use the one specified in the
constructor as `options.out`.

The callback is fed directly to `fs.writeFile`.

      # @param {String} [fileName] File path to write.
      # @param {Function} cb Callback.
      writeToFile: (fileName, cb) ->
        if fileName instanceof Function
          cb = fileName
          fileName = @options.out
        if !fileName
          throw new Error("Filename required. Supply one in writeToFile() or in options.out.")

        # Create zip, pipe it into a file writeStream.
        zip = @createReadStream(fileName)
        fileStream = fs.createWriteStream(fileName)
        fileStream.once 'finish', cb
        zip.pipe(fileStream)
        @finalize()

##### createReadStream() : Stream **Deprecated**

      # @return {Stream} Readable stream with ZIP data.
      createReadStream: () ->
        @getReadStream()

##### getReadStream() : Stream

Returns a readable stream from this file. You can pipe this directly to a file
or response object. Be sure to use 'binary' mode.

You are responsible for indicating that you have finished
the file generation by calling `finalize()`, which will end the sheet stream.

      # @return {Stream} Readable stream with ZIP data.
      getReadStream: () ->
        @zip

##### finalize()

Finishes up the sheet & generate shared strings. You must call this manually if
you are using `createReadStream`.

      finalize: () ->

        if @finalized
          throw new Error "This XLSX was already finalized."

        # Mark this as finished
        @finalized = true

        # If there was data, end sheetData
        if @haveHeader
          @_write(blobs.sheetDataFooter)

        # Write relationships data.
        @_write(blobs.worksheetRels(@relationships))

        # Generate shared strings
        @_generateStrings()

        # Generate external rels
        @_generateRelationships()

        # End sheet
        @sheetStream.end(blobs.sheetFooter)

        # Add supporting files to zip and finalize it. The readStream (@zip) will soon emit
        # an 'end' event.
        @_finalizeZip()

##### dispose()

Cancel use of this writer and close all streams. This is not needed if you've written to a file.

      dispose: () ->
        return if @disposed

        @sheetStream.end()
        @sheetStream.unpipe()
        @zip.unpipe()
        while(@zip.read()) # drain stream
          1; # noop
        delete @zip
        delete @sheetStream
        @disposed = true


#### Internal methods


Adds a cell to the row in progress.

      # @param {String|Number|Date} value Value to write.
      # @param {Number}             col   Column index.
      _addCell: (value = '', col) ->
        row = @currentRow
        cell = @_getCellIdentifier(row, col)

        # Hyperlink support
        if Object.prototype.toString.call(value) == '[object Object]'
          if !value.value || !value.hyperlink
            throw new Error("A hyperlink cell must have both 'value' and 'hyperlink' keys.")
          @_addCell(value.value, col)
          @_createRelationship(cell, value.hyperlink)
          return

        if typeof value == 'number'
          @rowBuffer += blobs.numberCell(value, cell)
        else if value instanceof Date
          date = @_dateToOADate(value)
          @rowBuffer += blobs.dateCell(date, cell)
        else
          index = @_lookupString(value)
          @rowBuffer += blobs.cell(index, cell)



Begins a row. Call this before starting any row. Will start a buffer
for all proceeding cells, until @_endRow is called.

      _startRow: () ->
        @rowBuffer = blobs.startRow(@currentRow)
        @currentRow += 1

Ends a row. Will write the row to the sheet.

      _endRow: () ->
        @_write(@rowBuffer + blobs.endRow)


Given row and column indices, returns a cell identifier, e.g. "E20"

      # @param {Number} row  Row index.
      # @param {Number} cell Cell index.
      # @return {String}     Cell identifier.
      _getCellIdentifier: (row, col) ->
        colIndex = ''
        if @cellLabelMap[col]
          colIndex = @cellLabelMap[col]
        else
          if col == 0
            # Provide a fallback for empty spreadsheets
            row = 1
            col = 1

          input = (+col - 1).toString(26)
          while input.length
            a = input.charCodeAt(input.length - 1)
            colIndex = String.fromCharCode(a + if a >= 48 and a <= 57 then 17 else -22) + colIndex
            input = if input.length > 1 then (parseInt(input.substr(0, input.length - 1), 26) - 1).toString(26) else ""
          @cellLabelMap[col] = colIndex

        return colIndex + row

Creates column definitions, if any definitions exist.
This will write column styles, widths, etc.

      # @return {String} Column definition.
      _generateColumnDefinition: () ->
        # <cols/> tag (empty) crashes excel, weeeeee
        if !@options.columns || !@options.columns.length
          return ''

        columnDefinition = ''
        columnDefinition += blobs.startColumns

        idx = 1
        for index, column of @options.columns
          columnDefinition += blobs.column(column.width || @options.defaultWidth, idx)
          idx += 1

        columnDefinition += blobs.endColumns
        return columnDefinition

Generates StringMap XML. Used as a finalization step - don't call this while
building the xlsx is in progress.

Saves string data to this object so it can be written to the zip.

      _generateStrings: () ->
        stringTable = ''
        for string in @strings
          stringTable += blobs.string(@escapeXml(string))
        @stringsData = blobs.stringsHeader(@strings.length) + stringTable + blobs.stringsFooter

Looks up a string inside the internal string map. If it doesn't exist, it will be added to the map.

      # @param {String} value String to look up.
      # @return {Number}      Index within the string map where this string is located.
      _lookupString: (value) ->
        if !@stringMap[value]
          @stringMap[value] = @stringIndex
          @strings.push(value)
          @stringIndex += 1
        return @stringMap[value]

Create a relationship. For now, this is always a hyperlink.
This writes to a array that will later be used define the rels.

      _createRelationship: (cell, target) ->
        @relationships.push({cell: cell, target: target})

Generate external relationships data. This is saved into "xl/worksheets/_rels/sheet1.xml.rels".

      _generateRelationships: () ->
        @relsData = blobs.externalWorksheetRels(@relationships)

Converts a Date to an OADate.
See [this stackoverflow post](http://stackoverflow.com/a/15550284/2644351)

      # @param {Date} date Date to convert.
      # @return {Number}   OADate.
      _dateToOADate: (date) ->
        epoch = new Date(1899,11,30)
        msPerDay = 8.64e7

        v = -1 * (epoch - date) / msPerDay

        # Deal with dates prior to 1899-12-30 00:00:00
        dec = v - Math.floor(v)

        if v < 0 and dec
          v = Math.floor(v) - dec

        return v

Convert an OADate to a Date.

      # @param {Number} oaDate OADate.
      # @return {Date}         Converted date.
      _OADateToDate: (oaDate) ->
        epoch = new Date(1899,11,30)
        msPerDay = 8.64e7

        # Deal with -ve values
        dec = oaDate - Math.floor(oaDate)

        if oaDate < 0 and dec
          oaDate = Math.floor(oaDate) - dec

        return new Date(oaDate * msPerDay + +epoch)

Resets sheet data. Called on initialization.

      _resetSheet: () ->

        # Sheet data storage.
        @sheetData = ''
        @strings = []
        @stringMap = {}
        @stringIndex = 0
        @stringData = null
        @currentRow = 0

        # Cell data storage
        @cellMap = []
        @cellLabelMap = {}

        # Column data storage
        @columns = []

        # Rels data storage
        @relData = ''
        @relationships = []

        # Flags
        @haveHeader = false
        @finalized = false

        # Create sheet stream.
        PassThrough = require('stream').PassThrough
        @sheetStream = new PassThrough()

        # Start off the sheet.
        @_write(blobs.sheetHeader)

Finalizes this file and adds supporting docs. Should not be called directly.

      _finalizeZip: () ->
        @zip
          .append(blobs.contentTypes, {name: '[Content_Types].xml'})
          .append(blobs.rels, {name: '_rels/.rels'})
          .append(blobs.workbook, {name: 'xl/workbook.xml'})
          .append(blobs.styles, {name: 'xl/styles.xml'})
          .append(blobs.workbookRels, {name: 'xl/_rels/workbook.xml.rels'})
          .append(@relsData, {name: 'xl/worksheets/_rels/sheet1.xml.rels'})
          .append(@stringsData, {name: 'xl/sharedStrings.xml'})
          .finalize()

Wrapper around writing sheet data.

      # @param {String} data Data to write to the sheet.
      _write: (data) ->
        @sheetStream.write(data)

Utility method for escaping XML - used within blobs and can be used manually.

      # @param {String} str String to escape.
      escapeXml: (str = '') ->
        return str.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')

Simple extend helper.

    _extend = (dest, src) ->
      for key, val of src
        dest[key] = val
      dest
