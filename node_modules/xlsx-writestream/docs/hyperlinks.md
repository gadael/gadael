Creating a hyperlink in xlsx
============================

Step 1 
------

Create a relationship in `xl/worksheets/_rels/sheet1.xml.rels`. 

Blob: 

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationships>
  <%= data %>
</Relationships>
```

Relationship example:

```xml
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://www.google.com/" TargetMode="External"/>
```

Each relationship must have a unique id, starting from 1.


Step 2
------

Ref that relationship in the sheet. `<hyperlinks>` should be placed just after `<cols>`. 

Blob:

```xml
<hyperlinks>
  <%= data %>
</hyperlinks>
```

Ref example:

```xml
<hyperlink ref="A2" r:id="rId1" />
```