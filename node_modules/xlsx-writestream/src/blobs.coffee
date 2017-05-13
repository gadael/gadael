module.exports =

    #
    # Static strings
    #

    contentTypes: """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
            <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
            <Default Extension="xml" ContentType="application/xml"/>
            <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
            <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
            <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
            <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
        </Types>
    """.replace(/\n\s*/g, '')

    rels: """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
            <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
        </Relationships>
    """.replace(/\n\s*/g, '')

    workbook: """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
            <fileVersion appName="xl" lastEdited="5" lowestEdited="5" rupBuild="9303"/>
            <workbookPr defaultThemeVersion="124226"/>
            <bookViews>
                <workbookView xWindow="480" yWindow="60" windowWidth="18195" windowHeight="8505"/>
            </bookViews>
            <sheets>
                <sheet name="Data" sheetId="1" r:id="rId1"/>
            </sheets>
            <calcPr calcId="145621"/>
        </workbook>
    """.replace(/\n\s*/g, '')

    workbookRels: """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
            <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
            <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
            <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
        </Relationships>
    """.replace(/\n\s*/g, '')

    styles: """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">
            <fonts count="1" x14ac:knownFonts="1">
                <font>
                    <sz val="11"/>
                    <color theme="1"/>
                    <name val="Calibri"/>
                    <family val="2"/>
                    <scheme val="minor"/>
                </font>
            </fonts>
            <fills count="2">
                <fill>
                    <patternFill patternType="none"/>
                </fill>
                <fill>
                    <patternFill patternType="gray125"/>
                </fill>
            </fills>
            <borders count="1">
                <border>
                    <left/>
                    <right/>
                    <top/>
                    <bottom/>
                    <diagonal/>
                </border>
            </borders>
            <cellStyleXfs count="1">
                <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
            </cellStyleXfs>
            <cellXfs count="1">
                <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
                <xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0"/>
            </cellXfs>
            <cellStyles count="1">
                <cellStyle name="Normal" xfId="0" builtinId="0"/>
            </cellStyles>
            <dxfs count="0"/>
            <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
            <extLst>
                <ext uri="{EB79DEF2-80B8-43e5-95BD-54CBDDF9020C}" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main">
                    <x14:slicerStyles defaultSlicerStyle="SlicerStyleLight1"/>
                </ext>
            </extLst>
        </styleSheet>
    """.replace(/\n\s*/g, '')

    #
    # Strings strings
    #

    stringsHeader: (count) -> """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="#{count}" uniqueCount="#{count}">
    """.replace(/\n\s*/g, '')

    string: (string) -> """
        <si>
            <t>#{string}</t>
        </si>
    """.replace(/\n\s*/g, '')

    stringsFooter: """
        </sst>
    """.replace(/\n\s*/g, '')

    #
    # Sheet strings
    #

    sheetHeader: """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">
            <sheetViews>
                <sheetView workbookViewId="0"/>
            </sheetViews>
            <sheetFormatPr defaultRowHeight="15" x14ac:dyDescent="0.25"/>
    """.replace(/\n\s*/g, '')

    startColumns: """<cols>"""
    column: (width, index) -> """<col min="#{index}" max="#{index}" width="#{width}" customWidth="1"/>"""
    endColumns: """</cols>"""

    startRow: (row) -> """<row r="#{row + 1}">"""
    endRow: """</row>"""

    cell: (index, cell) -> """<c r="#{cell}" t="s"><v>#{index}</v></c>"""
    dateCell: (value, cell) -> """<c r="#{cell}" s="1" t="n"><v>#{value}</v></c>"""
    numberCell: (value, cell) -> """<c r="#{cell}" s="0" t="n"><v>#{value}</v></c>"""

    sheetDataHeader: """<sheetData>"""
    sheetDataFooter: """</sheetData>"""

    sheetFooter: """
        </worksheet>
    """.replace(/\n\s*/g, '')


    #
    # Rel strings
    #

    # Printed inside worksheet
    worksheetRels: (relationships) ->
        if relationships.length > 0
            out = "<hyperlinks>"
            for rel, i in relationships
                out += """<hyperlink ref="#{rel.cell}" r:id="rId#{i + 1}" />"""
            out += "</hyperlinks>"
            return out
        else
            return ""

    # Printed in xl/worksheets/_rels/sheet1.xml.rels
    externalWorksheetRels: (relationships) ->
        out = """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        """
        for rel, i in relationships
            out += """<Relationship Id="rId#{i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="#{rel.target}" TargetMode="External" />"""
        out += """</Relationships>"""
        return out.replace(/\n\s*/g, '')

