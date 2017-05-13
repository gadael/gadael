module.exports = {
  contentTypes: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">\n    <Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>\n    <Default Extension=\"xml\" ContentType=\"application/xml\"/>\n    <Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>\n    <Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>\n    <Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>\n    <Override PartName=\"/xl/sharedStrings.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml\"/>\n</Types>".replace(/\n\s*/g, ''),
  rels: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n    <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>\n</Relationships>".replace(/\n\s*/g, ''),
  workbook: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">\n    <fileVersion appName=\"xl\" lastEdited=\"5\" lowestEdited=\"5\" rupBuild=\"9303\"/>\n    <workbookPr defaultThemeVersion=\"124226\"/>\n    <bookViews>\n        <workbookView xWindow=\"480\" yWindow=\"60\" windowWidth=\"18195\" windowHeight=\"8505\"/>\n    </bookViews>\n    <sheets>\n        <sheet name=\"Data\" sheetId=\"1\" r:id=\"rId1\"/>\n    </sheets>\n    <calcPr calcId=\"145621\"/>\n</workbook>".replace(/\n\s*/g, ''),
  workbookRels: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n    <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>\n    <Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings\" Target=\"sharedStrings.xml\"/>\n    <Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>\n</Relationships>".replace(/\n\s*/g, ''),
  styles: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\" mc:Ignorable=\"x14ac\" xmlns:x14ac=\"http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac\">\n    <fonts count=\"1\" x14ac:knownFonts=\"1\">\n        <font>\n            <sz val=\"11\"/>\n            <color theme=\"1\"/>\n            <name val=\"Calibri\"/>\n            <family val=\"2\"/>\n            <scheme val=\"minor\"/>\n        </font>\n    </fonts>\n    <fills count=\"2\">\n        <fill>\n            <patternFill patternType=\"none\"/>\n        </fill>\n        <fill>\n            <patternFill patternType=\"gray125\"/>\n        </fill>\n    </fills>\n    <borders count=\"1\">\n        <border>\n            <left/>\n            <right/>\n            <top/>\n            <bottom/>\n            <diagonal/>\n        </border>\n    </borders>\n    <cellStyleXfs count=\"1\">\n        <xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/>\n    </cellStyleXfs>\n    <cellXfs count=\"1\">\n        <xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>\n        <xf numFmtId=\"14\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>\n    </cellXfs>\n    <cellStyles count=\"1\">\n        <cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/>\n    </cellStyles>\n    <dxfs count=\"0\"/>\n    <tableStyles count=\"0\" defaultTableStyle=\"TableStyleMedium2\" defaultPivotStyle=\"PivotStyleLight16\"/>\n    <extLst>\n        <ext uri=\"{EB79DEF2-80B8-43e5-95BD-54CBDDF9020C}\" xmlns:x14=\"http://schemas.microsoft.com/office/spreadsheetml/2009/9/main\">\n            <x14:slicerStyles defaultSlicerStyle=\"SlicerStyleLight1\"/>\n        </ext>\n    </extLst>\n</styleSheet>".replace(/\n\s*/g, ''),
  stringsHeader: function(count) {
    return ("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<sst xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" count=\"" + count + "\" uniqueCount=\"" + count + "\">").replace(/\n\s*/g, '');
  },
  string: function(string) {
    return ("<si>\n    <t>" + string + "</t>\n</si>").replace(/\n\s*/g, '');
  },
  stringsFooter: "</sst>".replace(/\n\s*/g, ''),
  sheetHeader: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\" mc:Ignorable=\"x14ac\" xmlns:x14ac=\"http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac\">\n    <sheetViews>\n        <sheetView workbookViewId=\"0\"/>\n    </sheetViews>\n    <sheetFormatPr defaultRowHeight=\"15\" x14ac:dyDescent=\"0.25\"/>".replace(/\n\s*/g, ''),
  startColumns: "<cols>",
  column: function(width, index) {
    return "<col min=\"" + index + "\" max=\"" + index + "\" width=\"" + width + "\" customWidth=\"1\"/>";
  },
  endColumns: "</cols>",
  startRow: function(row) {
    return "<row r=\"" + (row + 1) + "\">";
  },
  endRow: "</row>",
  cell: function(index, cell) {
    return "<c r=\"" + cell + "\" t=\"s\"><v>" + index + "</v></c>";
  },
  dateCell: function(value, cell) {
    return "<c r=\"" + cell + "\" s=\"1\" t=\"n\"><v>" + value + "</v></c>";
  },
  numberCell: function(value, cell) {
    return "<c r=\"" + cell + "\" s=\"0\" t=\"n\"><v>" + value + "</v></c>";
  },
  sheetDataHeader: "<sheetData>",
  sheetDataFooter: "</sheetData>",
  sheetFooter: "</worksheet>".replace(/\n\s*/g, ''),
  worksheetRels: function(relationships) {
    var i, out, rel, _i, _len;
    if (relationships.length > 0) {
      out = "<hyperlinks>";
      for (i = _i = 0, _len = relationships.length; _i < _len; i = ++_i) {
        rel = relationships[i];
        out += "<hyperlink ref=\"" + rel.cell + "\" r:id=\"rId" + (i + 1) + "\" />";
      }
      out += "</hyperlinks>";
      return out;
    } else {
      return "";
    }
  },
  externalWorksheetRels: function(relationships) {
    var i, out, rel, _i, _len;
    out = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">";
    for (i = _i = 0, _len = relationships.length; _i < _len; i = ++_i) {
      rel = relationships[i];
      out += "<Relationship Id=\"rId" + (i + 1) + "\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink\" Target=\"" + rel.target + "\" TargetMode=\"External\" />";
    }
    out += "</Relationships>";
    return out.replace(/\n\s*/g, '');
  }
};
