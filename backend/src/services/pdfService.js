const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.generatePdf = (data, meetingId) =>
  new Promise((resolve, reject) => {
    console.log("PDF: Generating with data:", {
      title: data.title,
      agenda: Array.isArray(data.agenda) ? `[${data.agenda.length} items]` : data.agenda,
      overview: data.overview ? `[${data.overview.length} chars]` : "empty",
      discussion: Array.isArray(data.discussion) ? `[${data.discussion.length} items]` : data.discussion ? `[${data.discussion.length} chars]` : "empty",
      decisions: Array.isArray(data.decisions) ? `[${data.decisions.length} items]` : data.decisions,
      action_items: Array.isArray(data.action_items) ? `[${data.action_items.length} items]` : data.action_items,
      summary: data.summary ? `[${data.summary.length} chars]` : "empty",
    });

    const fileName = `meeting-${meetingId}.pdf`;
    const doc = new PDFDocument();
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads", { recursive: true });
    }
    const stream = fs.createWriteStream(`uploads/${fileName}`);

    doc.pipe(stream);

    doc.fontSize(20).text("MEETING SUMMARY", { align: "center", underline: true }).moveDown(1);

    section(doc, "TITLE", data.title);
    section(doc, "AGENDA", data.agenda);
    section(doc, "OVERVIEW", data.overview);
    section(doc, "DISCUSSION", data.discussion);
    section(doc, "DECISIONS", data.decisions);
    section(doc, "ACTION ITEMS", data.action_items);
    section(doc, "SUMMARY", data.summary);

    doc.end();

    stream.on("finish", () => {
      console.log("PDF: File written successfully");
      resolve(fileName);
    });
    stream.on("error", reject);
  });

function section(doc, title, content) {
  doc.fontSize(16).font("Helvetica-Bold").text(title, { 
    underline: true,
    color: "#000000"
  }).moveDown(0.5);
  
  doc.fontSize(11).font("Helvetica").fillColor("#000000");
  
  if (!content || (Array.isArray(content) && content.length === 0)) {
    doc.text("—");
  } else if (Array.isArray(content)) {
    content.forEach((c) => {
      const text = String(c || "").trim();
      if (text && text.length > 0 && text !== "—") {
        doc.text(`• ${text}`, { 
          align: "left", 
          width: 500,
          continued: false 
        });
      }
    });
    if (content.every(c => !c || String(c).trim() === "—")) {
      doc.text("—");
    }
  } else {
    const text = String(content || "").trim();
    if (text && text.length > 0) {
      doc.text(text, { 
        align: "left", 
        width: 500,
        continued: false 
      });
    } else {
      doc.text("—");
    }
  }
  
  doc.moveDown(0.7);
}
