var Archiver, XlsxWriter, blobs, fs, _extend;

fs = require('fs');

blobs = require('./blobs');

Archiver = require('archiver');

module.exports = XlsxWriter = (function() {
  XlsxWriter.write = function(out, data, cb) {
    var writer;
    writer = new XlsxWriter({
      out: out
    });
    writer.addRows(data);
    return writer.writeToFile(cb);
  };

  function XlsxWriter(options) {
    var defaults, zipOptions;
    if (options == null) {
      options = {};
    }
    if (typeof options === 'string') {
      options = {
        out: options
      };
    }
    defaults = {
      defaultWidth: 15,
      zip: {
        forceUTC: true
      },
      columns: []
    };
    this.options = _extend(defaults, options);
    this._resetSheet();
    this.defineColumns(this.options.columns);
    zipOptions = this.options.zip || {};
    zipOptions.forceUTC = true;
    this.zip = Archiver('zip', zipOptions);
    this.zip.catchEarlyExitAttached = true;
    this.zip.append(this.sheetStream, {
      name: 'xl/worksheets/sheet1.xml'
    });
  }

  XlsxWriter.prototype.addRow = function(row) {
    var col, key, _i, _len, _ref;
    if (!this.haveHeader) {
      this._write(blobs.sheetDataHeader);
      this._startRow();
      col = 1;
      for (key in row) {
        this._addCell(key, col);
        this.cellMap.push(key);
        col += 1;
      }
      this._endRow();
      this.haveHeader = true;
    }
    this._startRow();
    _ref = this.cellMap;
    for (col = _i = 0, _len = _ref.length; _i < _len; col = ++_i) {
      key = _ref[col];
      this._addCell(row[key] || "", col + 1);
    }
    return this._endRow();
  };

  XlsxWriter.prototype.addRows = function(rows) {
    var row, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      _results.push(this.addRow(row));
    }
    return _results;
  };

  XlsxWriter.prototype.defineColumns = function(columns) {
    if (this.haveHeader) {
      throw new Error("Columns cannot be added after rows! Unfortunately Excel will crash\nif column definitions come after sheet data. Please move your `defineColumns()`\ncall before any `addRow()` calls, or define options.columns in the XlsxWriter\nconstructor.");
    }
    this.options.columns = columns;
    return this._write(this._generateColumnDefinition());
  };

  XlsxWriter.prototype.writeToFile = function(fileName, cb) {
    var fileStream, zip;
    if (fileName instanceof Function) {
      cb = fileName;
      fileName = this.options.out;
    }
    if (!fileName) {
      throw new Error("Filename required. Supply one in writeToFile() or in options.out.");
    }
    zip = this.createReadStream(fileName);
    fileStream = fs.createWriteStream(fileName);
    fileStream.once('finish', cb);
    zip.pipe(fileStream);
    return this.finalize();
  };

  XlsxWriter.prototype.createReadStream = function() {
    return this.getReadStream();
  };

  XlsxWriter.prototype.getReadStream = function() {
    return this.zip;
  };

  XlsxWriter.prototype.finalize = function() {
    if (this.finalized) {
      throw new Error("This XLSX was already finalized.");
    }
    this.finalized = true;
    if (this.haveHeader) {
      this._write(blobs.sheetDataFooter);
    }
    this._write(blobs.worksheetRels(this.relationships));
    this._generateStrings();
    this._generateRelationships();
    this.sheetStream.end(blobs.sheetFooter);
    return this._finalizeZip();
  };

  XlsxWriter.prototype.dispose = function() {
    if (this.disposed) {
      return;
    }
    this.sheetStream.end();
    this.sheetStream.unpipe();
    this.zip.unpipe();
    while (this.zip.read()) {
      1;
    }
    delete this.zip;
    delete this.sheetStream;
    return this.disposed = true;
  };

  XlsxWriter.prototype._addCell = function(value, col) {
    var cell, date, index, row;
    if (value == null) {
      value = '';
    }
    row = this.currentRow;
    cell = this._getCellIdentifier(row, col);
    if (Object.prototype.toString.call(value) === '[object Object]') {
      if (!value.value || !value.hyperlink) {
        throw new Error("A hyperlink cell must have both 'value' and 'hyperlink' keys.");
      }
      this._addCell(value.value, col);
      this._createRelationship(cell, value.hyperlink);
      return;
    }
    if (typeof value === 'number') {
      return this.rowBuffer += blobs.numberCell(value, cell);
    } else if (value instanceof Date) {
      date = this._dateToOADate(value);
      return this.rowBuffer += blobs.dateCell(date, cell);
    } else {
      index = this._lookupString(value);
      return this.rowBuffer += blobs.cell(index, cell);
    }
  };

  XlsxWriter.prototype._startRow = function() {
    this.rowBuffer = blobs.startRow(this.currentRow);
    return this.currentRow += 1;
  };

  XlsxWriter.prototype._endRow = function() {
    return this._write(this.rowBuffer + blobs.endRow);
  };

  XlsxWriter.prototype._getCellIdentifier = function(row, col) {
    var a, colIndex, input;
    colIndex = '';
    if (this.cellLabelMap[col]) {
      colIndex = this.cellLabelMap[col];
    } else {
      if (col === 0) {
        row = 1;
        col = 1;
      }
      input = (+col - 1).toString(26);
      while (input.length) {
        a = input.charCodeAt(input.length - 1);
        colIndex = String.fromCharCode(a + (a >= 48 && a <= 57 ? 17 : -22)) + colIndex;
        input = input.length > 1 ? (parseInt(input.substr(0, input.length - 1), 26) - 1).toString(26) : "";
      }
      this.cellLabelMap[col] = colIndex;
    }
    return colIndex + row;
  };

  XlsxWriter.prototype._generateColumnDefinition = function() {
    var column, columnDefinition, idx, index, _ref;
    if (!this.options.columns || !this.options.columns.length) {
      return '';
    }
    columnDefinition = '';
    columnDefinition += blobs.startColumns;
    idx = 1;
    _ref = this.options.columns;
    for (index in _ref) {
      column = _ref[index];
      columnDefinition += blobs.column(column.width || this.options.defaultWidth, idx);
      idx += 1;
    }
    columnDefinition += blobs.endColumns;
    return columnDefinition;
  };

  XlsxWriter.prototype._generateStrings = function() {
    var string, stringTable, _i, _len, _ref;
    stringTable = '';
    _ref = this.strings;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      string = _ref[_i];
      stringTable += blobs.string(this.escapeXml(string));
    }
    return this.stringsData = blobs.stringsHeader(this.strings.length) + stringTable + blobs.stringsFooter;
  };

  XlsxWriter.prototype._lookupString = function(value) {
    if (!this.stringMap[value]) {
      this.stringMap[value] = this.stringIndex;
      this.strings.push(value);
      this.stringIndex += 1;
    }
    return this.stringMap[value];
  };

  XlsxWriter.prototype._createRelationship = function(cell, target) {
    return this.relationships.push({
      cell: cell,
      target: target
    });
  };

  XlsxWriter.prototype._generateRelationships = function() {
    return this.relsData = blobs.externalWorksheetRels(this.relationships);
  };

  XlsxWriter.prototype._dateToOADate = function(date) {
    var dec, epoch, msPerDay, v;
    epoch = new Date(1899, 11, 30);
    msPerDay = 8.64e7;
    v = -1 * (epoch - date) / msPerDay;
    dec = v - Math.floor(v);
    if (v < 0 && dec) {
      v = Math.floor(v) - dec;
    }
    return v;
  };

  XlsxWriter.prototype._OADateToDate = function(oaDate) {
    var dec, epoch, msPerDay;
    epoch = new Date(1899, 11, 30);
    msPerDay = 8.64e7;
    dec = oaDate - Math.floor(oaDate);
    if (oaDate < 0 && dec) {
      oaDate = Math.floor(oaDate) - dec;
    }
    return new Date(oaDate * msPerDay + +epoch);
  };

  XlsxWriter.prototype._resetSheet = function() {
    var PassThrough;
    this.sheetData = '';
    this.strings = [];
    this.stringMap = {};
    this.stringIndex = 0;
    this.stringData = null;
    this.currentRow = 0;
    this.cellMap = [];
    this.cellLabelMap = {};
    this.columns = [];
    this.relData = '';
    this.relationships = [];
    this.haveHeader = false;
    this.finalized = false;
    PassThrough = require('stream').PassThrough;
    this.sheetStream = new PassThrough();
    return this._write(blobs.sheetHeader);
  };

  XlsxWriter.prototype._finalizeZip = function() {
    return this.zip.append(blobs.contentTypes, {
      name: '[Content_Types].xml'
    }).append(blobs.rels, {
      name: '_rels/.rels'
    }).append(blobs.workbook, {
      name: 'xl/workbook.xml'
    }).append(blobs.styles, {
      name: 'xl/styles.xml'
    }).append(blobs.workbookRels, {
      name: 'xl/_rels/workbook.xml.rels'
    }).append(this.relsData, {
      name: 'xl/worksheets/_rels/sheet1.xml.rels'
    }).append(this.stringsData, {
      name: 'xl/sharedStrings.xml'
    }).finalize();
  };

  XlsxWriter.prototype._write = function(data) {
    return this.sheetStream.write(data);
  };

  XlsxWriter.prototype.escapeXml = function(str) {
    if (str == null) {
      str = '';
    }
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  return XlsxWriter;

})();

_extend = function(dest, src) {
  var key, val;
  for (key in src) {
    val = src[key];
    dest[key] = val;
  }
  return dest;
};
