package com.techcorp.compliance.service;

import lombok.extern.slf4j.Slf4j;

import org.apache.poi.wp.usermodel.HeaderFooterType;
import org.apache.poi.xwpf.usermodel.*;
import org.apache.poi.xwpf.usermodel.XWPFTable.XWPFBorderType;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

/**
 * DocxReportGenerator
 *
 * Converts Markdown report content to a properly formatted .docx file
 * using Apache POI XWPF. Called by ReportService.generateDocxBytes().
 *
 * Handles:
 * - # H1, ## H2, ### H3 headings with colour accent per report type
 * - | tables | with header row shading
 * - - bullet lists and 1. numbered lists
 * - **bold** inline text
 * - --- horizontal rules
 * - Normal paragraphs
 */
@Component
@Slf4j
public class DocxReportGenerator {

    // Accent colours per report type (hex without #)
    private static final java.util.Map<String, String> TYPE_COLORS = java.util.Map.of(
            "gap", "2563EB",
            "coverage", "16A34A",
            "risk", "DC2626",
            "audit", "7C3AED",
            "policy", "D97706",
            "executive", "0891B2");

    private static final String DEFAULT_COLOR = "2E75B6";
    private static final String FONT = "Arial";
    private static final int BODY_SIZE = 22; // 11pt in half-points
    private static final int TABLE_SIZE = 20; // 10pt

    /**
     * Generates a .docx file from markdown content and returns the bytes.
     *
     * @param title      Report title for the header
     * @param reportType Report type key (gap, coverage, risk, audit, policy,
     *                   executive)
     * @param markdown   Full markdown content from ReportService.getContent()
     * @return Byte array of the .docx file ready to stream to the browser
     */
    public byte[] generate(String title, String reportType, String markdown) throws Exception {
        String accent = TYPE_COLORS.getOrDefault(reportType, DEFAULT_COLOR);

        try (XWPFDocument doc = new XWPFDocument()) {

            // ── Document styles ───────────────────────────────────────────────
            setupStyles(doc, accent);

            // ── Parse and render markdown ─────────────────────────────────────
            renderMarkdown(doc, markdown, accent);

            // ── Footer with page numbers ──────────────────────────────────────
            addFooter(doc, title);

            // ── Serialize ─────────────────────────────────────────────────────
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        }
    }

    // ── Markdown renderer ─────────────────────────────────────────────────────

    private void renderMarkdown(XWPFDocument doc, String markdown, String accent) {
        String[] lines = markdown.split("\n");
        int i = 0;

        while (i < lines.length) {
            String line = lines[i];

            // H1
            if (line.startsWith("# ")) {
                addHeading(doc, line.substring(2), 1, accent);
                i++;
                continue;
            }
            // H2
            if (line.startsWith("## ")) {
                addHeading(doc, line.substring(3), 2, "404040");
                i++;
                continue;
            }
            // H3
            if (line.startsWith("### ")) {
                addHeading(doc, line.substring(4), 3, "404040");
                i++;
                continue;
            }
            // Horizontal rule
            if (line.trim().matches("-{3,}")) {
                addHRule(doc);
                i++;
                continue;
            }
            // Table — collect all | rows
            if (line.trim().startsWith("|")) {
                List<String> tableLines = new ArrayList<>();
                while (i < lines.length && lines[i].trim().startsWith("|")) {
                    tableLines.add(lines[i]);
                    i++;
                }
                addTable(doc, tableLines);
                continue;
            }
            // Bullet list
            if (line.startsWith("- ") || line.startsWith("* ")) {
                addBullet(doc, line.substring(2));
                i++;
                continue;
            }
            // Numbered list
            if (line.matches("^\\d+\\.\\s.*")) {
                String text = line.replaceFirst("^\\d+\\.\\s", "");
                addNumbered(doc, text);
                i++;
                continue;
            }
            // Blockquote
            if (line.startsWith("> ")) {
                addBlockquote(doc, line.substring(2));
                i++;
                continue;
            }
            // Blank line
            if (line.trim().isEmpty()) {
                doc.createParagraph(); // spacer
                i++;
                continue;
            }
            // Normal paragraph
            addParagraph(doc, line);
            i++;
        }
    }

    // ── Element builders ──────────────────────────────────────────────────────

    private void addHeading(XWPFDocument doc, String text, int level, String color) {
        XWPFParagraph p = doc.createParagraph();
        String style = level == 1 ? "Heading1" : level == 2 ? "Heading2" : "Heading3";
        p.setStyle(style);

        if (level == 1) {
            // Bottom border on H1
            CTBorder border = CTBorder.Factory.newInstance();
            border.setVal(STBorder.SINGLE);
            border.setColor(color);
            border.setSz(BigInteger.valueOf(6));
            border.setSpace(BigInteger.valueOf(4));
            p.getCTP().getPPr().addNewPBdr().addNewBottom().set(border);
        }

        XWPFRun run = p.createRun();
        run.setText(text.trim());
        run.setFontFamily(FONT);
        run.setColor(color);
        run.setBold(true);
        run.setFontSize(level == 1 ? 18 : level == 2 ? 14 : 12);
    }

    private void addParagraph(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingAfter(60);
        addInlineRuns(p, text, BODY_SIZE, false);
    }

    private void addBullet(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setNumID(BigInteger.valueOf(1));
        p.getCTP().getPPr().getNumPr().addNewIlvl().setVal(BigInteger.ZERO);
        addInlineRuns(p, text, BODY_SIZE, false);
    }

    private void addNumbered(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setNumID(BigInteger.valueOf(2));
        p.getCTP().getPPr().getNumPr().addNewIlvl().setVal(BigInteger.ZERO);
        addInlineRuns(p, text, BODY_SIZE, false);
    }

    private void addBlockquote(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setIndentationLeft(720);
        addInlineRuns(p, text, BODY_SIZE, false);
    }

    private void addHRule(XWPFDocument doc) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(120);
        p.setSpacingAfter(120);
        CTBorder border = CTBorder.Factory.newInstance();
        border.setVal(STBorder.SINGLE);
        border.setColor("DDDDDD");
        border.setSz(BigInteger.valueOf(4));
        border.setSpace(BigInteger.valueOf(2));
        if (p.getCTP().getPPr() == null)
            p.getCTP().addNewPPr();
        p.getCTP().getPPr().addNewPBdr().addNewBottom().set(border);
    }

    private void addTable(XWPFDocument doc, List<String> lines) {
        // Parse rows — skip separator lines (---|---|---)
        List<List<String>> rows = new ArrayList<>();
        for (String line : lines) {
            List<String> cells = new ArrayList<>();
            String[] parts = line.split("\\|");
            for (int j = 1; j < parts.length; j++) {
                cells.add(parts[j].trim());
            }
            if (!cells.isEmpty() && !cells.stream().allMatch(c -> c.matches("[-:]+"))) {
                rows.add(cells);
            }
        }

        if (rows.isEmpty())
            return;

        int colCount = rows.get(0).size();
        XWPFTable table = doc.createTable(rows.size(), colCount);
        table.setWidth("100%");

        // Remove default borders first
        CTTblPr tblPr = table.getCTTbl().getTblPr();
        if (tblPr == null)
            tblPr = table.getCTTbl().addNewTblPr();

        for (int ri = 0; ri < rows.size(); ri++) {
            List<String> row = rows.get(ri);
            XWPFTableRow tableRow = table.getRow(ri);
            boolean isHeader = (ri == 0);

            for (int ci = 0; ci < Math.min(row.size(), colCount); ci++) {
                XWPFTableCell cell = tableRow.getCell(ci);
                if (cell == null)
                    cell = tableRow.addNewTableCell();

                // Cell shading
                if (isHeader) {
                    CTShd shd = cell.getCTTc().addNewTcPr().addNewShd();
                    shd.setFill("EBF3FB");
                    shd.setVal(STShd.CLEAR);
                }

                // Cell text
                XWPFParagraph cellPara = cell.getParagraphArray(0);
                if (cellPara == null)
                    cellPara = cell.addParagraph();
                addInlineRuns(cellPara, row.get(ci), TABLE_SIZE, isHeader);
            }
        }
    }

    // ── Inline bold/normal text parser ────────────────────────────────────────

    private void addInlineRuns(XWPFParagraph p, String text, int fontSize, boolean defaultBold) {
        // Split on **bold** markers
        String[] parts = text.split("(\\*\\*)", -1);
        boolean bold = defaultBold;
        for (String part : parts) {
            if (part.isEmpty()) {
                bold = !bold;
                continue;
            }
            XWPFRun run = p.createRun();
            // Strip leading * for bullet (already handled above)
            run.setText(part);
            run.setFontFamily(FONT);
            run.setFontSize(fontSize / 2); // half-points to points
            run.setBold(bold);
            bold = !bold;
        }
        // Reset — if parts count is even, last toggle was extra
        // The split on ** means every other segment is bold
    }

    // ── Document setup ────────────────────────────────────────────────────────

    private void setupStyles(XWPFDocument doc, String accent) {
        // POI creates default styles automatically
        // We just set page margins via section properties
        CTSectPr sectPr = doc.getDocument().getBody().addNewSectPr();
        CTPageMar mar = sectPr.addNewPgMar();
        mar.setTop(BigInteger.valueOf(1440));
        mar.setBottom(BigInteger.valueOf(1440));
        mar.setLeft(BigInteger.valueOf(1080));
        mar.setRight(BigInteger.valueOf(1080));
    }

    private void addFooter(XWPFDocument doc, String title) {
        try {
            XWPFFooter footer = doc.createFooter(HeaderFooterType.DEFAULT);
            XWPFParagraph p = footer.createParagraph();
            p.setAlignment(ParagraphAlignment.RIGHT);
            XWPFRun run = p.createRun();
            run.setText("ComplianceAI Platform  |  " + title + "  |  Page ");
            run.setFontFamily(FONT);
            run.setFontSize(8);
            run.setColor("AAAAAA");
        } catch (Exception e) {
            log.warn("Could not add footer: {}", e.getMessage());
        }
    }
}
