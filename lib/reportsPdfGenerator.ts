import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ACCORD Brand Color scheme (Restricted to Blue, Red, Black)
const COLORS = {
  primary: '#008cf7',   // ACCORD Blue
  danger: '#dc2626',    // Red
  text: '#000000',      // Black
  secondary: '#4b5563', // Dark Gray (for pending/neutral)
  lightGray: '#f9fafb', // Very light background
  border: '#e5e7eb',
  white: '#ffffff'
};

/**
 * Premium ACCORD Branding Header Bar helper
 */
const addHeaderBar = (doc: jsPDF) => {
  const pW = doc.internal.pageSize.getWidth();
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pW, 2, 'F');
  doc.setFillColor(COLORS.danger);
  doc.rect(0, 2, pW, 0.5, 'F');
};

// NEW: Full API Response Structure with detailed visits and quotations
export interface DetailedReportResponse {
  success: boolean;
  data: {
    report: Report;
    visits: Visit[];
    quotations: QuotationRequest[];
    statistics: {
      visits: {
        total: number;
        byOutcome: Record<string, number>;
        byPurpose: Record<string, number>;
        totalPotentialValue: number;
      };
      quotations: {
        total: number;
        byStatus: Record<string, number>;
        byUrgency: Record<string, number>;
      };
    };
    meta: {
      totalVisits: number;
      totalQuotations: number;
      weekRange: string;
      submittedAt: string;
      salesRep: {
        name: string;
        email: string;
        employeeId: string;
        phone?: string;
      };
    };
  };
}

export interface Visit {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
  };
  date: string;
  client: {
    name: string;
    type: string;
    location: string;
    county: string;
    coordinates?: { lat: number; lng: number };
  };
  visitPurpose: string;
  visitOutcome: string;
  contacts: Array<{
    name: string;
    role: string;
    phone: string;
    email: string;
    designation: string;
  }>;
  equipment: Array<{
    name: string;
    category: string;
    quantity: number;
    estimatedValue: number;
  }>;
  discussionNotes: string;
  challenges: string;
  opportunities: string;
  totalPotentialValue: number;
  followUpActions: Array<{
    action: string;
    dueDate: string;
    priority: string;
    status: string;
    assignedTo?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  photos: string[];
  createdAt: string;
}

export interface QuotationRequest {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
  };
  clientName: string;
  clientContact: string;
  clientEmail: string;
  productName: string;
  productCategory: string;
  quantity: number;
  specifications: string;
  urgency: string;
  status: string;
  responded: boolean;
  response?: {
    message: string;
    documentUrl: string;
    estimatedCost: number;
    respondedBy: {
      firstName: string;
      lastName: string;
      email: string;
    };
    respondedAt: string;
  };
  additionalNotes: string;
  attachments: string[];
  createdAt: string;
}

export interface Report {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
    phone?: string;
  };
  report?: string;
  filePath?: string;
  fileName?: string;
  fileUrl?: string;
  weekStart: string;
  weekEnd: string;
  weekRange?: string; // e.g., "06/10/2025 - 12/10/2025"
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string | null;
  createdAt: string;
  isDraft?: boolean;
  reviewedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewedAt?: string;
  // Report content - NEW STRUCTURE (nested)
  content?: {
    metadata?: {
      author?: string;
      submittedAt?: string;
      weekRange?: string;
    };
    sections?: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  };
  // LEGACY: sections at root level (backward compatibility)
  sections?: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  // Legacy metadata (backward compatibility)
  weeklySummary?: string;
  visits?: Array<{
    hospital?: string;
    clientName?: string;
    purpose?: string;
    outcome?: string;
    notes?: string;
  }>;
  quotations?: Array<{
    clientName?: string;
    equipment?: string;
    amount?: number;
    status?: string;
  }>;
  newLeads?: Array<{
    name?: string;
    interest?: string;
    notes?: string;
  }>;
  challenges?: string;
  nextWeekPlan?: string;
}

/**
 * Generate a comprehensive PDF report for all reports
 */
export async function generateReportsSummaryPDF(
  reports: Report[],
  adminName: string,
  filterStatus?: 'pending' | 'approved' | 'rejected' | 'all'
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  addHeaderBar(doc);

  // Add logo
  try {
    const logoImg = await loadImage('/accordlogo.png');
    doc.addImage(logoImg, 'PNG', 15, 10, 40, 20);
  } catch (error) {
    console.error('Failed to load logo:', error);
  }

  // Header - Company Info
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCORD', pageWidth - 15, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text('Field Activity Management System', pageWidth - 15, 26, { align: 'right' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Reports Summary', 15, 45);

  // Divider lines
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(1);
  doc.line(15, 48, pageWidth - 15, 48);
  doc.setDrawColor(COLORS.danger);
  doc.setLineWidth(0.2);
  doc.line(15, 49.5, pageWidth - 15, 49.5);

  // Report metadata
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })}`, 15, 55);
  doc.text(`Generated by: ${adminName}`, 15, 61);

  const filterText = filterStatus && filterStatus !== 'all'
    ? `Status Filter: ${filterStatus.toUpperCase()}`
    : 'Status Filter: ALL';
  doc.text(filterText, pageWidth - 15, 55, { align: 'right' });
  doc.text(`Total Reports: ${reports.length}`, pageWidth - 15, 61, { align: 'right' });

  // Summary statistics box
  doc.setFillColor(COLORS.lightGray);
  doc.roundedRect(15, 68, pageWidth - 30, 25, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Statistics:', 20, 77);

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const approvedCount = reports.filter(r => r.status === 'approved').length;
  const rejectedCount = reports.filter(r => r.status === 'rejected').length;

  doc.setFont('helvetica', 'normal');
  doc.text(`- Pending: ${pendingCount}`, 20, 83);
  doc.text(`- Approved: ${approvedCount}`, 70, 83);
  doc.text(`- Rejected: ${rejectedCount}`, 120, 83);

  // Reports table
  let yPos = 100;

  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Reports Overview', 15, yPos);

  yPos += 5;

  // Prepare table data
  const tableData = reports.map((report, index) => {
    const weekRange = `${new Date(report.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(report.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const statusColor =
      report.status === 'approved' ? COLORS.primary :
        report.status === 'rejected' ? COLORS.danger :
          COLORS.secondary;

    return [
      (index + 1).toString(),
      `${report.userId.firstName} ${report.userId.lastName}`,
      report.userId.email,
      weekRange,
      report.status.toUpperCase(),
      report.adminNotes || 'N/A',
      new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Staff Name', 'Email', 'Week', 'Status', 'Admin Notes', 'Submitted']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: '#ffffff',
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 45 },
      3: { cellWidth: 28 },
      4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 35 },
      6: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 15, right: 15 },
    didParseCell: (data) => {
      // Color code status column
      if (data.column.index === 4 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status.includes('APPROVED')) {
          data.cell.styles.textColor = COLORS.primary;
        } else if (status.includes('REJECTED')) {
          data.cell.styles.textColor = COLORS.danger;
        } else if (status.includes('PENDING')) {
          data.cell.styles.textColor = COLORS.secondary;
        }
      }
    }
  });

  // Footer and Header bar on each page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderBar(doc);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.secondary);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'ACCORD - Confidential',
      15,
      pageHeight - 10
    );
    doc.text(
      new Date().toLocaleDateString(),
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Save PDF
  const filterSuffix = filterStatus && filterStatus !== 'all' ? `_${filterStatus}` : '';
  const fileName = `ACCORD_Reports_Summary${filterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Generate detailed PDF report for a single report entry
 */
export async function generateIndividualReportPDF(
  report: Report,
  adminName: string
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  addHeaderBar(doc);

  // Add logo
  try {
    const logoImg = await loadImage('/accordlogo.png');
    doc.addImage(logoImg, 'PNG', 15, 10, 40, 20);
  } catch (error) {
    console.error('Failed to load logo:', error);
  }

  // Header
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCORD', pageWidth - 15, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text('Field Activity Management System', pageWidth - 15, 26, { align: 'right' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Report Details', 15, 45);

  // Divider lines
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(1);
  doc.line(15, 48, pageWidth - 15, 48);
  doc.setDrawColor(COLORS.danger);
  doc.setLineWidth(0.2);
  doc.line(15, 49.5, pageWidth - 15, 49.5);

  // Staff information box
  doc.setFillColor(COLORS.primary);
  doc.roundedRect(15, 55, pageWidth - 30, 30, 2, 2, 'F');

  doc.setFontSize(14);
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${report.userId.firstName} ${report.userId.lastName}`,
    20,
    65
  );

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (report.userId.employeeId) {
    doc.text(`Employee ID: ${report.userId.employeeId}`, 20, 72);
  }
  doc.text(`Email: ${report.userId.email}`, 20, 78);

  // Use weekRange if available, otherwise format from weekStart/weekEnd
  const weekDisplay = report.weekRange ||
    `${new Date(report.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(report.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  doc.text(
    `Week: ${weekDisplay}`,
    pageWidth - 20,
    65,
    { align: 'right' }
  );

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Status: ${report.status.toUpperCase()}`,
    pageWidth - 20,
    78,
    { align: 'right' }
  );

  // Report metadata
  let yPos = 95;
  doc.setFontSize(9);
  doc.setTextColor(COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`, 15, yPos);
  doc.text(`Generated by: ${adminName}`, pageWidth - 15, yPos, { align: 'right' });

  // Report details summary box
  yPos += 15;
  doc.setFillColor(COLORS.lightGray);
  doc.roundedRect(15, yPos, pageWidth - 30, 35, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Submission Summary', 20, yPos + 8);

  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');

  doc.text(`- Report ID: ${report._id}`, 20, yPos + 16);
  doc.text(`- File name: ${report.fileName || 'N/A'}`, 20, yPos + 22);
  doc.text(`- Submitted at: ${new Date(report.createdAt).toLocaleString()}`, 20, yPos + 28);

  // Admin notes section (if available) - styled like the planner
  if (report.adminNotes && report.adminNotes.trim()) {
    yPos += 45;
    doc.setFillColor(COLORS.lightGray);
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('Admin Review Notes:', 20, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(report.adminNotes, pageWidth - 40);
    doc.text(splitNotes, 20, yPos + 14);
    yPos += 35; // Height of the admin notes box + spacing
  } else {
    yPos += 45; // Just spacing from the submission summary if no admin notes
  }

  // Render Sections / Content
  const reportSections = report.content?.sections || report.sections;

  if (reportSections && reportSections.length > 0) {
    const sectionOrder = ['summary', 'visits', 'quotations', 'leads', 'challenges', 'nextWeek', 'next-week'];
    const sortedSections = [...reportSections].sort((a, b) => {
      const indexA = sectionOrder.indexOf(a.id);
      const indexB = sectionOrder.indexOf(b.id);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    sortedSections.forEach((section) => {
      if (!section.content || section.content.trim() === '') return;

      if (yPos + 40 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, 15, yPos);
      yPos += 5;

      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');
      const contentSplit = doc.splitTextToSize(section.content, pageWidth - 30);
      doc.text(contentSplit, 15, yPos);
      yPos += (contentSplit.length * 4) + 10;
    });
  } else if (report.report && report.report.trim()) {
    // Fallback for legacy plain text report
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Activity Narrative', 15, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'normal');
    const reportSplit = doc.splitTextToSize(report.report, pageWidth - 30);
    doc.text(reportSplit, 15, yPos);
    yPos += (reportSplit.length * 4) + 10;
  } else if (report.weeklySummary && report.weeklySummary.trim()) {
    // Fallback for weeklySummary
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Weekly Summary', 15, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'normal');
    const summarySplit = doc.splitTextToSize(report.weeklySummary, pageWidth - 30);
    doc.text(summarySplit, 15, yPos);
    yPos += (summarySplit.length * 4) + 10;
  }

  // Customer Visits Table (Structured)
  if (report.visits && report.visits.length > 0) {
    if (yPos + 30 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Visits', 15, yPos);
    yPos += 5;

    const visitsTableData = report.visits.map((v, idx) => [
      (idx + 1).toString(),
      v.clientName || v.hospital || 'N/A',
      v.purpose || 'N/A',
      v.outcome || 'N/A',
      v.notes || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Client/Hospital', 'Purpose', 'Outcome', 'Key Notes']],
      body: visitsTableData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: '#ffffff' },
      columnStyles: { 0: { cellWidth: 10 }, 4: { cellWidth: 'auto' } },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Quotations Table (Structured)
  if (report.quotations && report.quotations.length > 0) {
    if (yPos + 30 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Quotations Generated', 15, yPos);
    yPos += 5;

    const quotesTableData = report.quotations.map((q, idx) => [
      (idx + 1).toString(),
      q.clientName || 'N/A',
      q.equipment || 'N/A',
      `KES ${(q.amount || 0).toLocaleString()}`,
      q.status || 'Pending'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Client Name', 'Equipment', 'Amount', 'Status']],
      body: quotesTableData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: '#ffffff' },
      columnStyles: { 0: { cellWidth: 10 }, 3: { halign: 'right' } },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // New Leads Section
  if (report.newLeads && report.newLeads.length > 0) {
    if (yPos + 30 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(COLORS.lightGray);
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(`New Leads (${report.newLeads.length} leads)`, 20, yPos + 6);

    yPos += 12;

    report.newLeads.forEach((lead, idx) => {
      if (yPos + 12 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.text(`- ${lead.name || 'N/A'}`, 20, yPos);
      yPos += 5;

      if (lead.interest) {
        const interestSplit = doc.splitTextToSize(`  ${lead.interest}`, pageWidth - 45);
        doc.text(interestSplit, 22, yPos);
        yPos += (interestSplit.length * 4);
      }
      if (lead.notes) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.secondary);
        const notesSplit = doc.splitTextToSize(`  ${lead.notes}`, pageWidth - 45);
        doc.text(notesSplit, 22, yPos);
        yPos += (notesSplit.length * 4);
        doc.setTextColor(COLORS.text);
      }
      yPos += 4;
    });
    yPos += 5;
  }

  // Challenges Section
  if (report.challenges) {
    if (yPos + 30 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor('#fee2e2');
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setTextColor(COLORS.danger);
    doc.setFont('helvetica', 'bold');
    doc.text('Challenges Faced', 20, yPos + 6);

    yPos += 12;
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'normal');
    const challengesSplit = doc.splitTextToSize(report.challenges, pageWidth - 40);
    doc.text(challengesSplit, 20, yPos);
    yPos += (challengesSplit.length * 4) + 10;
  }

  // Next Week Plan Section
  if (report.nextWeekPlan) {
    if (yPos + 30 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(COLORS.lightGray);
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text("Next Week's Plan", 20, yPos + 6);

    yPos += 12;
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'normal');
    const planSplit = doc.splitTextToSize(report.nextWeekPlan, pageWidth - 40);
    doc.text(planSplit, 20, yPos);
    yPos += (planSplit.length * 4) + 10;
  }

  // Admin Notes section
  if (report.adminNotes && report.adminNotes.trim()) {
    if (yPos + 30 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(COLORS.lightGray);
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('Admin Notes:', 20, yPos + 6);

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(report.adminNotes, pageWidth - 40);
    doc.text(splitNotes, 20, yPos);
    yPos += (splitNotes.length * 4) + 10;
  }

  // File information box
  if (yPos + 30 > pageHeight - 20) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(COLORS.lightGray);
  doc.roundedRect(15, yPos, pageWidth - 30, 25, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('File Access', 20, yPos + 8);

  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');

  if (report.fileUrl) {
    doc.text(`- File URL: ${report.fileUrl}`, 20, yPos + 16);
    doc.text('- Access: Available online', 20, yPos + 22);
  } else {
    doc.text('- File URL: Not available', 20, yPos + 16);
    doc.text('- Access: Contact administrator', 20, yPos + 22);
  }

  // Footer and Header bar on each page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderBar(doc);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.secondary);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'ACCORD - Confidential',
      15,
      pageHeight - 10
    );
    doc.text(
      new Date().toLocaleDateString(),
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    );

    // Signature lines
    if (i === totalPages && yPos + 40 < pageHeight - 20) {
      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.text('_________________________', 15, pageHeight - 30);
      doc.text('Reviewed by', 15, pageHeight - 24);

      doc.text('_________________________', pageWidth - 55, pageHeight - 30);
      doc.text('Date', pageWidth - 55, pageHeight - 24);
    }
  }

  // Save PDF
  const fileName = `ACCORD_Report_${report.userId.firstName}_${report.userId.lastName}_${new Date(report.weekStart).toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Helper function to load images
 */
function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * NEW: Generate detailed PDF from comprehensive API response
 * Uses GET /:id endpoint with full visits and quotations data
 */
export async function generateDetailedReportPDF(
  reportData: DetailedReportResponse['data'],
  adminName: string
): Promise<void> {
  const { report, visits, quotations, statistics, meta } = reportData;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  addHeaderBar(doc);

  // Add logo
  try {
    const logoImg = await loadImage('/accordlogo.png');
    doc.addImage(logoImg, 'PNG', 15, 10, 40, 20);
  } catch (error) {
    console.error('Failed to load logo:', error);
  }

  // ========================================
  // PAGE 1: EXECUTIVE SUMMARY
  // ========================================

  // Header
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCORD', pageWidth - 15, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text('Field Activity Management System', pageWidth - 15, 26, { align: 'right' });

  // Title
  doc.setFontSize(22);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('WEEKLY ACTIVITY REPORT', 15, 45);

  // Divider
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(1);
  doc.line(15, 48, pageWidth - 15, 48);

  // Sales Rep Info Box
  const statusColor =
    report.status === 'approved' ? COLORS.primary :
      report.status === 'rejected' ? COLORS.danger :
        COLORS.secondary;

  doc.setFillColor(statusColor);
  doc.roundedRect(15, 55, pageWidth - 30, 40, 3, 3, 'F');

  doc.setFontSize(16);
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.text(meta.salesRep.name, 20, 65);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Employee ID: ${meta.salesRep.employeeId || 'N/A'}`, 20, 72);
  doc.text(`Email: ${meta.salesRep.email}`, 20, 78);
  if (meta.salesRep.phone) {
    doc.text(`Phone: ${meta.salesRep.phone}`, 20, 84);
  }

  const weekDisplay = meta.weekRange && meta.weekRange !== 'undefined' ? meta.weekRange : 'N/A';
  doc.text(`Week: ${weekDisplay}`, pageWidth - 20, 65, { align: 'right' });
  doc.text(`Status: ${report.status.toUpperCase()}`, pageWidth - 20, 78, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Submitted: ${new Date(meta.submittedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })}`, pageWidth - 20, 88, { align: 'right' });

  // Key Metrics Section
  let yPos = 105;
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('PERFORMANCE SUMMARY', 15, yPos);

  yPos += 10;

  // Metrics Grid
  const metrics = [
    { label: 'Total Visits', value: statistics.visits.total, color: COLORS.primary, bgColor: '#dbeafe' },
    { label: 'Total Quotations', value: statistics.quotations.total, color: COLORS.primary, bgColor: '#f1f5f9' },
    { label: 'Potential Value', value: `KES ${(statistics.visits.totalPotentialValue || 0).toLocaleString()}`, color: COLORS.secondary, bgColor: '#f3f4f6' },
    { label: 'Success Rate', value: `${statistics.visits.total > 0 ? Math.round((statistics.visits.byOutcome.successful || 0) / statistics.visits.total * 100) : 0}%`, color: COLORS.primary, bgColor: '#dbeafe' }
  ];

  const boxWidth = (pageWidth - 40) / 2;
  const boxHeight = 20;
  let xPos = 15;
  let yRow = yPos;

  metrics.forEach((metric, idx) => {
    if (idx % 2 === 0 && idx > 0) {
      yRow += boxHeight + 5;
      xPos = 15;
    }

    // Background
    doc.setFillColor(metric.bgColor);
    doc.roundedRect(xPos, yRow, boxWidth, boxHeight, 2, 2, 'F');

    // Label
    doc.setFontSize(9);
    doc.setTextColor(COLORS.secondary);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, xPos + 5, yRow + 8);

    // Value
    doc.setFontSize(14);
    doc.setTextColor(metric.color);
    doc.setFont('helvetica', 'bold');
    doc.text(String(metric.value), xPos + 5, yRow + 16);

    xPos += boxWidth + 10;
  });

  yPos = yRow + boxHeight + 15;

  // Visit Outcomes Breakdown
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Visit Outcomes', 15, yPos);

  yPos += 8;

  const outcomes = [
    { label: 'Successful', value: statistics.visits.byOutcome.successful || 0, color: COLORS.primary },
    { label: 'Pending', value: statistics.visits.byOutcome.pending || 0, color: COLORS.secondary },
    { label: 'Follow-up Required', value: statistics.visits.byOutcome.followup_required || 0, color: COLORS.primary },
    { label: 'No Interest', value: statistics.visits.byOutcome.no_interest || 0, color: COLORS.danger }
  ];

  outcomes.forEach(outcome => {
    if (outcome.value > 0) {
      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');

      // Color dot
      doc.setFillColor(outcome.color);
      doc.circle(18, yPos - 2, 1.5, 'F');

      doc.text(`${outcome.label}: ${outcome.value}`, 23, yPos);
      yPos += 6;
    }
  });

  // Quotation Status Breakdown
  yPos += 5;
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation Status', pageWidth / 2 + 5, yPos - (outcomes.filter(o => o.value > 0).length * 6) - 13);

  let yPosQuote = yPos - (outcomes.filter(o => o.value > 0).length * 6) - 5;

  const quotationStatuses = [
    { label: 'Responded', value: statistics.quotations.byStatus.responded || 0, color: COLORS.primary },
    { label: 'In Progress', value: statistics.quotations.byStatus.in_progress || 0, color: COLORS.primary },
    { label: 'Pending', value: statistics.quotations.byStatus.pending || 0, color: COLORS.secondary },
    { label: 'Completed', value: statistics.quotations.byStatus.completed || 0, color: '#1e293b' } // Darker Black/Blue
  ];

  quotationStatuses.forEach(status => {
    if (status.value > 0) {
      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');

      // Color dot
      doc.setFillColor(status.color);
      doc.circle(pageWidth / 2 + 8, yPosQuote - 2, 1.5, 'F');

      doc.text(`${status.label}: ${status.value}`, pageWidth / 2 + 13, yPosQuote);
      yPosQuote += 6;
    }
  });

  // ========================================
  // DETAILED VISITS SECTION
  // ========================================

  if (visits.length > 0) {
    if (yPos + 40 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 15;
    }

    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(`CLIENT VISITS (${visits.length})`, 15, yPos);

    yPos += 10;
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    const visitsTableData = visits.map((v, idx) => [
      (idx + 1).toString(),
      new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      v.client.name,
      v.visitPurpose,
      v.visitOutcome.replace('_', ' '),
      `KES ${(v.totalPotentialValue || 0).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Date', 'Client', 'Purpose', 'Outcome', 'Potential Value']],
      body: visitsTableData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: '#ffffff', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        5: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: COLORS.primary }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Detailed Notes for each visit (if they are long)
    visits.forEach((visit, idx) => {
      if (visit.discussionNotes && visit.discussionNotes.length > 50) {
        if (yPos + 20 > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Note for visit #${idx + 1} (${visit.client.name}):`, 15, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        const notesSplit = doc.splitTextToSize(visit.discussionNotes, pageWidth - 30);
        doc.text(notesSplit, 15, yPos);
        yPos += (notesSplit.length * 4) + 8;
      }
    });
  }

  // ========================================
  // DETAILED QUOTATIONS SECTION
  // ========================================

  if (quotations.length > 0) {
    if (yPos + 40 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 10;
    }

    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(`QUOTATION REQUESTS (${quotations.length})`, 15, yPos);

    yPos += 10;
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    const quotesTableData = quotations.map((q, idx) => [
      (idx + 1).toString(),
      q.clientName,
      q.productName,
      q.quantity.toString(),
      q.urgency.toUpperCase(),
      q.status.replace('_', ' ')
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Client', 'Product', 'Qty', 'Urgency', 'Status']],
      body: quotesTableData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: '#ffffff', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ========================================
  // REPORT CONTENT SECTIONS
  // ========================================

  if (yPos + 40 > pageHeight - 20) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos += 20;
  }

  doc.setFontSize(18);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('WEEKLY REPORT', 15, yPos);

  yPos += 10;
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  // Display sections or basic report content
  // Check for sections in nested content.sections OR root-level sections
  const reportSections = report.content?.sections || report.sections;

  if (reportSections && reportSections.length > 0) {
    const sectionOrder = ['summary', 'visits', 'quotations', 'leads', 'challenges', 'nextWeek', 'next-week'];
    const sortedSections = [...reportSections].sort((a, b) => {
      const indexA = sectionOrder.indexOf(a.id);
      const indexB = sectionOrder.indexOf(b.id);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    sortedSections.forEach((section) => {
      if (!section.content || section.content.trim() === '') return;

      if (yPos + 40 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      let bgColor = COLORS.lightGray;
      let titleColor = COLORS.primary;
      let icon = '';

      switch (section.id) {
        case 'summary':
          bgColor = COLORS.lightGray;
          titleColor = COLORS.primary;
          break;
        case 'visits':
          bgColor = '#dbeafe';
          titleColor = COLORS.primary;
          break;
        case 'quotations':
          bgColor = '#eff6ff'; // Light Blue
          titleColor = COLORS.primary;
          break;
        case 'leads':
          bgColor = COLORS.lightGray;
          titleColor = COLORS.primary;
          break;
        case 'challenges':
          bgColor = '#fee2e2';
          titleColor = COLORS.danger;
          break;
        case 'nextWeek':
        case 'next-week':
          bgColor = '#eff6ff'; // Light Blue
          titleColor = COLORS.primary;
          break;
      }

      doc.setFillColor(bgColor);
      doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');

      doc.setFontSize(11);
      doc.setTextColor(titleColor);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, 20, yPos + 6);

      yPos += 12;

      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');

      const contentSplit = doc.splitTextToSize(section.content, pageWidth - 40);

      for (let i = 0; i < contentSplit.length; i++) {
        if (yPos + 5 > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(contentSplit[i], 20, yPos);
        yPos += 4;
      }
      yPos += 10;
    });
  } else if (report.report && report.report.trim()) {
    doc.setFillColor(COLORS.lightGray);
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Content', 20, yPos + 6);

    yPos += 12;
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'normal');
    const reportSplit = doc.splitTextToSize(report.report, pageWidth - 40);

    for (let i = 0; i < reportSplit.length; i++) {
      if (yPos + 5 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(reportSplit[i], 20, yPos);
      yPos += 4;
    }
  } else if (report.weeklySummary && report.weeklySummary.trim()) {
    doc.setFillColor(COLORS.lightGray);
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Weekly Summary', 20, yPos + 6);

    yPos += 12;
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'normal');
    const summarySplit = doc.splitTextToSize(report.weeklySummary, pageWidth - 40);

    for (let i = 0; i < summarySplit.length; i++) {
      if (yPos + 5 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(summarySplit[i], 20, yPos);
      yPos += 4;
    }
  }

  // Admin Notes
  if (report.adminNotes && report.adminNotes.trim()) {
    if (yPos + 30 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 10;
    doc.setFillColor(COLORS.lightGray);
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('Admin Notes:', 20, yPos + 6);

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(report.adminNotes, pageWidth - 40);
    for (let i = 0; i < splitNotes.length; i++) {
      if (yPos + 5 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(splitNotes[i], 20, yPos);
      yPos += 4;
    }
  }

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderBar(doc);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.secondary);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'ACCORD - Confidential',
      15,
      pageHeight - 10
    );
    doc.text(
      new Date().toLocaleDateString(),
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Save PDF
  const fileName = `ACCORD_Detailed_Report_${meta.salesRep.name.replace(' ', '_')}_${report.weekStart.split('T')[0]}.pdf`;
  doc.save(fileName);
}
