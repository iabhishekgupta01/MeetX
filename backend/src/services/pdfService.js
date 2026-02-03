const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.generatePdf = async (data) => {
  const fileName = `meeting-${Date.now()}.pdf`;
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(`uploads/${fileName}`));

  section(doc, "TITLE", data.title);
  section(doc, "AGENDA", data.agenda);
  section(doc, "OVERVIEW", data.overview);
  section(doc, "DISCUSSION", data.discussion);
  section(doc, "DECISIONS", data.decisions);
  section(doc, "ACTION ITEMS", data.action_items);
  section(doc, "SUMMARY", data.summary);

  doc.end();
  return fileName;
};

function section(doc, title, content) {
  doc.fontSize(14).text(title).moveDown(0.3);
  if (Array.isArray(content)) {
    content.forEach((c) => doc.text(`• ${JSON.stringify(c)}`));
  } else {
    doc.text(content);
  }
  doc.moveDown();
}
