'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LabEntry } from './useEntries';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false);

  const exportEntryToPDF = async (entry: LabEntry, workspaceName: string) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;

      // Helper function to check page boundaries and add page
      const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - margin) {
          doc.addPage();
          // Draw header on new page
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(160, 160, 160);
          doc.text(`LabFlow ELN | Entry: ${entry.title.substring(0, 30)}...`, margin, 10);
          doc.line(margin, 12, pageWidth - margin, 12);
          y = margin;
        }
      };

      // 1. Draw LabFlow Header Accent
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(margin, y, contentWidth, 8, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('ELECTRONIC LABORATORY NOTEBOOK RECORD', margin + 4, y + 5.5);
      
      y += 14;

      // 2. Document Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(24, 24, 27); // zinc-900
      const titleLines = doc.splitTextToSize(entry.title, contentWidth);
      doc.text(titleLines, margin, y);
      y += (titleLines.length * 8) + 4;

      // 3. Metadata block (Table-like grid)
      doc.setFillColor(250, 250, 250); // zinc-50
      doc.rect(margin, y, contentWidth, 24, 'F');
      doc.setDrawColor(228, 228, 231); // zinc-200
      doc.rect(margin, y, contentWidth, 24, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122); // zinc-500

      // Column 1
      doc.text('LAB WORKSPACE:', margin + 4, y + 6);
      doc.text('AUTHOR:', margin + 4, y + 12);
      doc.text('DATE CREATED:', margin + 4, y + 18);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(39, 39, 42); // zinc-800
      doc.text(workspaceName.toUpperCase(), margin + 38, y + 6);
      doc.text(entry.author?.display_name || 'Unknown Author', margin + 38, y + 12);
      doc.text(format(new Date(entry.created_at), 'PPP p'), margin + 38, y + 18);

      // Column 2
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(113, 113, 122);
      doc.text('STATUS:', margin + (contentWidth / 2) + 10, y + 6);
      doc.text('SAMPLE NAME:', margin + (contentWidth / 2) + 10, y + 12);
      doc.text('TAGS:', margin + (contentWidth / 2) + 10, y + 18);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(39, 39, 42);
      doc.text(entry.status, margin + (contentWidth / 2) + 40, y + 6);
      doc.text(entry.sample_name || 'N/A', margin + (contentWidth / 2) + 40, y + 12);
      
      const tagsList = entry.tags.map(t => t.name).join(', ') || 'None';
      const tagsLines = doc.splitTextToSize(tagsList, contentWidth / 2 - 44);
      doc.text(tagsLines[0] || 'None', margin + (contentWidth / 2) + 40, y + 18);

      y += 32;

      // 4. Content Parsing (Notion-like HTML to PDF flow)
      const contentHtml = entry.content || '<p>No log details provided.</p>';
      
      // Use DOMParser to structure document elements
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(contentHtml, 'text/html');
      const bodyElements = Array.from(htmlDoc.body.children);

      for (const element of bodyElements) {
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent || '';

        if (tagName === 'h1') {
          checkPageBreak(18);
          y += 4;
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(16);
          doc.setTextColor(15, 23, 42); // slate-900
          const lines = doc.splitTextToSize(text, contentWidth);
          doc.text(lines, margin, y);
          y += (lines.length * 6) + 4;
        } 
        else if (tagName === 'h2') {
          checkPageBreak(14);
          y += 3;
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(30, 41, 59); // slate-800
          const lines = doc.splitTextToSize(text, contentWidth);
          doc.text(lines, margin, y);
          y += (lines.length * 5) + 3;
        } 
        else if (tagName === 'h3') {
          checkPageBreak(12);
          y += 2;
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          const lines = doc.splitTextToSize(text, contentWidth);
          doc.text(lines, margin, y);
          y += (lines.length * 4.5) + 2.5;
        } 
        else if (tagName === 'p') {
          if (!text.trim()) continue;
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(63, 63, 70); // zinc-700
          const lines = doc.splitTextToSize(text, contentWidth);
          const heightNeeded = lines.length * 5;
          checkPageBreak(heightNeeded);
          doc.text(lines, margin, y);
          y += heightNeeded + 2;
        } 
        else if (tagName === 'blockquote') {
          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(10);
          doc.setTextColor(113, 113, 122);
          const lines = doc.splitTextToSize(text, contentWidth - 8);
          const heightNeeded = lines.length * 5;
          checkPageBreak(heightNeeded);
          
          // Draw quotation vertical bar
          doc.setFillColor(228, 228, 231);
          doc.rect(margin, y - 3, 2, heightNeeded + 2, 'F');
          
          doc.text(lines, margin + 6, y);
          y += heightNeeded + 3;
        } 
        else if (tagName === 'ul' || tagName === 'ol') {
          const listItems = Array.from(element.children);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(63, 63, 70);

          for (let index = 0; index < listItems.length; index++) {
            const itemText = listItems[index].textContent || '';
            const bullet = tagName === 'ul' ? '• ' : `${index + 1}. `;
            const lines = doc.splitTextToSize(bullet + itemText, contentWidth - 6);
            const heightNeeded = lines.length * 5;
            checkPageBreak(heightNeeded);
            doc.text(lines, margin + 4, y);
            y += heightNeeded + 1.5;
          }
          y += 2;
        } 
        else if (tagName === 'table') {
          // Render tables dynamically via autoTable
          const rows: string[][] = [];
          const headers: string[] = [];

          const trs = Array.from(element.querySelectorAll('tr'));
          trs.forEach((tr, trIdx) => {
            const cells = Array.from(tr.querySelectorAll('th, td'));
            const rowData = cells.map(c => c.textContent || '');
            
            if (trIdx === 0 && tr.querySelector('th')) {
              headers.push(...rowData);
            } else {
              rows.push(rowData);
            }
          });

          // Check page break for starting a table
          checkPageBreak(25);

          autoTable(doc, {
            head: headers.length > 0 ? [headers] : undefined,
            body: rows,
            startY: y - 2,
            margin: { left: margin, right: margin },
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 8.5, cellPadding: 2.5 },
            didDrawPage: (data) => {
              // Capture updated y coordinate from table rendering
              y = data.cursor?.y || y;
            }
          });
          
          y += 6;
        }
      }

      // 5. Signature Footer Block
      y += 10;
      checkPageBreak(40);
      doc.setDrawColor(228, 228, 231);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      doc.text('PREPARED BY (AUTHOR SIGNATURE):', margin, y);
      doc.text('VERIFIED BY (REVIEWER SIGNATURE):', margin + (contentWidth / 2) + 5, y);
      
      y += 5;
      
      // Author info
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(39, 39, 42); // zinc-800
      doc.text(entry.author?.display_name || 'Staff Member', margin, y + 5);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Date: ${format(new Date(entry.created_at), 'PPP')}`, margin, y + 10);
      
      // Draw signature line for author
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 12, margin + 60, y + 12);

      // Reviewer electronic signature seal
      const signature = (entry.metadata as any)?.signature;
      if (entry.status === 'approved' && signature) {
        // Green box background for the electronic signature seal
        doc.setFillColor(240, 253, 244); // emerald-50
        doc.rect(margin + (contentWidth / 2) + 2, y + 1, (contentWidth / 2) - 4, 18, 'F');
        doc.setDrawColor(187, 247, 208); // emerald-200
        doc.rect(margin + (contentWidth / 2) + 2, y + 1, (contentWidth / 2) - 4, 18, 'S');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(21, 128, 61); // emerald-700
        doc.text('✓ SIGNED ELECTRONICALLY', margin + (contentWidth / 2) + 6, y + 5);
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(6, 78, 59); // emerald-900
        doc.text(signature.signed_by, margin + (contentWidth / 2) + 6, y + 10);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(22, 101, 52); // emerald-800
        doc.text(`Email: ${signature.signer_email}`, margin + (contentWidth / 2) + 6, y + 13);
        doc.text(`Date: ${format(new Date(signature.signed_at), 'PPP p')}`, margin + (contentWidth / 2) + 6, y + 16);
      } else {
        y += 9;
        doc.setDrawColor(160, 160, 160);
        doc.line(margin + (contentWidth / 2) + 5, y, margin + (contentWidth / 2) + 65, y);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('DATE:', margin + (contentWidth / 2) + 5, y + 4);
      }

      y += 18;

      // Save the generated document
      const fileTitle = entry.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      doc.save(`lab-entry-${fileTitle}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      toast.error('Failed to export lab notebook PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportEntryToPDF,
  };
}
