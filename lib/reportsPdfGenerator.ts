import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ACCORD Brand Color scheme
const COLORS = {
  primary: '#008cf7', // ACCORD Blue
  secondary: '#6b7280', // Gray
  success: '#059669', // Green
  warning: '#f59e0b', // Orange
  danger: '#dc2626', // Red
  text: '#000000', // Black
  lightGray: '#f3f4f6',
  border: '#e5e7eb',
  white: '#ffffff'
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
  
  // Divider line
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(15, 48, pageWidth - 15, 48);
  
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
  doc.text(`• Pending: ${pendingCount}`, 20, 83);
  doc.text(`• Approved: ${approvedCount}`, 70, 83);
  doc.text(`• Rejected: ${rejectedCount}`, 120, 83);

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
      report.status === 'approved' ? COLORS.success :
      report.status === 'rejected' ? COLORS.danger :
      COLORS.warning;
    
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
          data.cell.styles.textColor = COLORS.success;
        } else if (status.includes('REJECTED')) {
          data.cell.styles.textColor = COLORS.danger;
        } else if (status.includes('PENDING')) {
          data.cell.styles.textColor = COLORS.warning;
        }
      }
    }
  });

  // Footer on each page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
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
  
  // Divider
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(15, 48, pageWidth - 15, 48);
  
  // Staff information box
  const statusColor = 
    report.status === 'approved' ? COLORS.success :
    report.status === 'rejected' ? COLORS.danger :
    COLORS.warning;
  
  doc.setFillColor(statusColor);
  doc.roundedRect(15, 55, pageWidth - 30, 35, 2, 2, 'F');
  
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
  doc.text(
    `Submitted: ${new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    pageWidth - 20,
    85,
    { align: 'right' }
  );

  // Report metadata
  let yPos = 100;
  doc.setFontSize(9);
  doc.setTextColor(COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`, 15, yPos);
  doc.text(`Generated by: ${adminName}`, pageWidth - 15, yPos, { align: 'right' });

  // Report details section
  yPos += 15;
  doc.setFillColor(COLORS.lightGray);
  doc.roundedRect(15, yPos, pageWidth - 30, 45, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Information', 20, yPos + 8);
  
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  
  yPos += 16;
  doc.text(`• Report ID: ${report._id}`, 20, yPos);
  yPos += 6;
  doc.text(`• File Name: ${report.fileName || 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`• File Available: ${report.fileUrl ? 'Yes' : 'No'}`, 20, yPos);
  yPos += 6;
  doc.text(`• Submission Date: ${new Date(report.createdAt).toLocaleString()}`, 20, yPos);
  yPos += 6;
  doc.text(`• Current Status: ${report.status.toUpperCase()}`, 20, yPos);

  // Admin notes section (if available)
  if (report.adminNotes && report.adminNotes.trim()) {
    yPos += 15;
    doc.setFillColor('#fff3cd');
    doc.roundedRect(15, yPos, pageWidth - 30, 25, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('Admin Notes:', 20, yPos + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(report.adminNotes, pageWidth - 40);
    doc.text(splitNotes, 20, yPos + 14);
    yPos += 25;
  }

  // Action log section
  yPos += 15;
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Timeline', 15, yPos);
  
  yPos += 5;

  const timelineData = [
    ['Event', 'Date/Time', 'Details'],
    ['Report Submitted', new Date(report.createdAt).toLocaleString(), `Submitted by ${report.userId.firstName} ${report.userId.lastName}`],
    ['Current Status', new Date().toLocaleString(), `Status: ${report.status.toUpperCase()}`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [timelineData[0]],
    body: timelineData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 }
  });

  // Get position after table
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========================================
  // NEW: Sections-based content display
  // Check for sections in nested content.sections OR root-level sections
  // ========================================
  const reportSections = report.content?.sections || report.sections;
  
  if (reportSections && reportSections.length > 0) {
    // Sort sections to ensure consistent order
    const sectionOrder = ['summary', 'visits', 'quotations', 'leads', 'challenges', 'nextWeek', 'next-week'];
    const sortedSections = [...reportSections].sort((a, b) => {
      const indexA = sectionOrder.indexOf(a.id);
      const indexB = sectionOrder.indexOf(b.id);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    sortedSections.forEach((section) => {
      // Skip empty sections
      if (!section.content || section.content.trim() === '') return;

      // Check if we need a new page
      if (yPos + 40 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      // Determine section styling based on ID
      let bgColor = COLORS.lightGray;
      let titleColor = COLORS.primary;
      let icon = '📄';

      switch (section.id) {
        case 'summary':
          bgColor = COLORS.lightGray;
          titleColor = COLORS.primary;
          icon = '📋';
          break;
        case 'visits':
          bgColor = '#dbeafe';
          titleColor = COLORS.primary;
          icon = '👥';
          break;
        case 'quotations':
          bgColor = '#d1fae5';
          titleColor = COLORS.success;
          icon = '💰';
          break;
        case 'leads':
          bgColor = '#fef3c7';
          titleColor = COLORS.warning;
          icon = '🎯';
          break;
        case 'challenges':
          bgColor = '#fee2e2';
          titleColor = COLORS.danger;
          icon = '⚠️';
          break;
        case 'nextWeek':
        case 'next-week':
          bgColor = '#e9d5ff';
          titleColor = '#9333ea';
          icon = '⚡';
          break;
        default:
          bgColor = COLORS.lightGray;
          titleColor = COLORS.primary;
          icon = '📄';
      }

      // Section header
      doc.setFillColor(bgColor);
      doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(titleColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${icon} ${section.title}`, 20, yPos + 6);
      
      yPos += 12;

      // Section content
      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');
      
      const contentSplit = doc.splitTextToSize(section.content, pageWidth - 40);
      
      // Check if content fits on current page
      const contentHeight = contentSplit.length * 4;
      if (yPos + contentHeight + 10 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(contentSplit, 20, yPos);
      yPos += contentHeight + 10;
    });
  }
  
  // ========================================
  // BASIC TEXT CONTENT (if sections not available but report text exists)
  // ========================================
  else if (report.report && report.report.trim()) {
    if (yPos + 40 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(COLORS.lightGray);
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 Report Content', 20, yPos + 6);
    
    yPos += 12;
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'normal');
    const reportSplit = doc.splitTextToSize(report.report, pageWidth - 40);
    
    // Handle pagination for long content
    for (let i = 0; i < reportSplit.length; i++) {
      if (yPos + 5 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(reportSplit[i], 20, yPos);
      yPos += 4;
    }
    yPos += 10;
  }
  
  // ========================================
  // LEGACY: Old metadata structure (fallback)
  // ========================================
  else if (report.weeklySummary) {
    if (yPos + 40 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(COLORS.lightGray);
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 Weekly Summary', 20, yPos + 6);
    
    yPos += 12;
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'normal');
    const summarySplit = doc.splitTextToSize(report.weeklySummary, pageWidth - 40);
    doc.text(summarySplit, 20, yPos);
    yPos += (summarySplit.length * 4) + 10;
  }

  // Customer Visits Section
  if (report.visits && report.visits.length > 0) {
    if (yPos + 40 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor('#dbeafe');
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(`👥 Customer Visits (${report.visits.length} visits)`, 20, yPos + 6);
    
    yPos += 12;
    
    report.visits.forEach((visit, idx) => {
      if (yPos + 25 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${visit.hospital || visit.clientName || 'N/A'}`, 20, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      if (visit.purpose) {
        const purposeText = `   Purpose: ${visit.purpose}`;
        const purposeSplit = doc.splitTextToSize(purposeText, pageWidth - 45);
        doc.text(purposeSplit, 20, yPos);
        yPos += (purposeSplit.length * 4);
      }
      if (visit.outcome) {
        const outcomeText = `   Outcome: ${visit.outcome}`;
        const outcomeSplit = doc.splitTextToSize(outcomeText, pageWidth - 45);
        doc.text(outcomeSplit, 20, yPos);
        yPos += (outcomeSplit.length * 4);
      }
      if (visit.notes) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(COLORS.secondary);
        const notesSplit = doc.splitTextToSize(`   Notes: ${visit.notes}`, pageWidth - 45);
        doc.text(notesSplit, 20, yPos);
        yPos += (notesSplit.length * 4);
        doc.setTextColor(COLORS.text);
      }
      yPos += 6;
    });
  }

  // Quotations Section
  if (report.quotations && report.quotations.length > 0) {
    if (yPos + 40 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    const totalQuotationValue = report.quotations.reduce((sum, q) => sum + (q.amount || 0), 0);

    doc.setFillColor('#d1fae5');
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(COLORS.success);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `💰 Quotations Generated (${report.quotations.length} quotations, KES ${totalQuotationValue.toLocaleString()} total)`,
      20,
      yPos + 6
    );
    
    yPos += 12;
    
    report.quotations.forEach((quote, idx) => {
      if (yPos + 15 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');
      const quoteLine = `• ${quote.equipment || 'Equipment'} for ${quote.clientName || 'N/A'}`;
      doc.text(quoteLine, 20, yPos);
      yPos += 5;
      
      if (quote.amount) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.success);
        doc.text(`  KES ${quote.amount.toLocaleString()}`, 25, yPos);
        doc.setTextColor(COLORS.text);
        yPos += 5;
      }
      if (quote.status) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`  Status: ${quote.status}`, 25, yPos);
        yPos += 5;
      }
      yPos += 2;
    });
    yPos += 5;
  }

  // New Leads Section
  if (report.newLeads && report.newLeads.length > 0) {
    if (yPos + 30 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor('#fef3c7');
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(COLORS.warning);
    doc.setFont('helvetica', 'bold');
    doc.text(`🎯 New Leads (${report.newLeads.length} leads)`, 20, yPos + 6);
    
    yPos += 12;
    
    report.newLeads.forEach((lead, idx) => {
      if (yPos + 12 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${lead.name || 'N/A'}`, 20, yPos);
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
    doc.text('⚠️ Challenges Faced', 20, yPos + 6);
    
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

    doc.setFillColor('#e9d5ff');
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor('#9333ea');
    doc.setFont('helvetica', 'bold');
    doc.text("⚡ Next Week's Plan", 20, yPos + 6);
    
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

    doc.setFillColor('#fff3cd');
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('📝 Admin Notes:', 20, yPos + 6);
    
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
    doc.text(`• File URL: ${report.fileUrl}`, 20, yPos + 16);
    doc.text('• Access: Available online', 20, yPos + 22);
  } else {
    doc.text('• File URL: Not available', 20, yPos + 16);
    doc.text('• Access: Contact administrator', 20, yPos + 22);
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
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
 * ✨ NEW: Generate detailed PDF from comprehensive API response
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
    report.status === 'approved' ? COLORS.success :
    report.status === 'rejected' ? COLORS.danger :
    COLORS.warning;
  
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
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Week: ${meta.weekRange}`, pageWidth - 20, 65, { align: 'right' });
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
  doc.text('📊 PERFORMANCE SUMMARY', 15, yPos);
  
  yPos += 10;
  
  // Metrics Grid
  const metrics = [
    { label: 'Total Visits', value: statistics.visits.total, color: COLORS.primary, bgColor: '#dbeafe' },
    { label: 'Total Quotations', value: statistics.quotations.total, color: COLORS.success, bgColor: '#d1fae5' },
    { label: 'Potential Value', value: `KES ${(statistics.visits.totalPotentialValue || 0).toLocaleString()}`, color: COLORS.warning, bgColor: '#fef3c7' },
    { label: 'Success Rate', value: `${statistics.visits.total > 0 ? Math.round((statistics.visits.byOutcome.successful || 0) / statistics.visits.total * 100) : 0}%`, color: COLORS.success, bgColor: '#d1fae5' }
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
    { label: 'Successful', value: statistics.visits.byOutcome.successful || 0, color: '#10b981' },
    { label: 'Pending', value: statistics.visits.byOutcome.pending || 0, color: '#f59e0b' },
    { label: 'Follow-up Required', value: statistics.visits.byOutcome.followup_required || 0, color: '#3b82f6' },
    { label: 'No Interest', value: statistics.visits.byOutcome.no_interest || 0, color: '#ef4444' }
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
    { label: 'Responded', value: statistics.quotations.byStatus.responded || 0, color: '#10b981' },
    { label: 'In Progress', value: statistics.quotations.byStatus.in_progress || 0, color: '#3b82f6' },
    { label: 'Pending', value: statistics.quotations.byStatus.pending || 0, color: '#f59e0b' },
    { label: 'Completed', value: statistics.quotations.byStatus.completed || 0, color: '#059669' }
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
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(`👥 CLIENT VISITS (${visits.length})`, 15, yPos);
    
    yPos += 10;
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;
    
    visits.forEach((visit, idx) => {
      // Check if we need a new page
      if (yPos + 60 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      
      // Visit Header
      doc.setFillColor('#dbeafe');
      doc.roundedRect(15, yPos, pageWidth - 30, 10, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${visit.client.name}`, 20, yPos + 7);
      
      // Visit Date
      doc.setFontSize(9);
      doc.setTextColor(COLORS.secondary);
      doc.setFont('helvetica', 'normal');
      doc.text(
        new Date(visit.date).toLocaleDateString('en-US', { 
          weekday: 'short', month: 'short', day: 'numeric' 
        }),
        pageWidth - 20,
        yPos + 7,
        { align: 'right' }
      );
      
      yPos += 14;
      
      // Client Details
      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.text(`Type: ${visit.client.type}`, 20, yPos);
      doc.text(`Location: ${visit.client.location}, ${visit.client.county}`, 20, yPos + 5);
      
      yPos += 12;
      
      // Purpose and Outcome
      const purposeColor = COLORS.primary;
      const outcomeColor = 
        visit.visitOutcome === 'successful' ? COLORS.success :
        visit.visitOutcome === 'no_interest' ? COLORS.danger :
        COLORS.warning;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purposeColor);
      doc.text(`Purpose: ${visit.visitPurpose.toUpperCase()}`, 20, yPos);
      
      doc.setTextColor(outcomeColor);
      doc.text(`Outcome: ${visit.visitOutcome.toUpperCase().replace('_', ' ')}`, pageWidth / 2, yPos);
      
      yPos += 7;
      
      // Equipment Discussed
      if (visit.equipment && visit.equipment.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Equipment Discussed:', 20, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        visit.equipment.forEach(equip => {
          if (yPos + 5 > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`• ${equip.name} (${equip.category}) - Qty: ${equip.quantity}`, 23, yPos);
          if (equip.estimatedValue > 0) {
            doc.setTextColor(COLORS.success);
            doc.text(`KES ${equip.estimatedValue.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
            doc.setTextColor(COLORS.text);
          }
          yPos += 5;
        });
      }
      
      // Total Potential Value
      if (visit.totalPotentialValue > 0) {
        yPos += 2;
        doc.setFillColor('#d1fae5');
        doc.roundedRect(20, yPos, pageWidth - 40, 7, 1, 1, 'F');
        
        doc.setFontSize(9);
        doc.setTextColor(COLORS.success);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Potential Value:', 23, yPos + 5);
        doc.text(
          `KES ${visit.totalPotentialValue.toLocaleString()}`,
          pageWidth - 23,
          yPos + 5,
          { align: 'right' }
        );
        yPos += 10;
      }
      
      // Contacts
      if (visit.contacts && visit.contacts.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Contacts:', 20, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        visit.contacts.slice(0, 2).forEach(contact => {
          if (yPos + 5 > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`• ${contact.name} (${contact.role}) - ${contact.phone}`, 23, yPos);
          yPos += 5;
        });
      }
      
      // Discussion Notes
      if (visit.discussionNotes && visit.discussionNotes.trim()) {
        yPos += 2;
        doc.setFontSize(9);
        doc.setTextColor(COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Discussion Notes:', 20, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const notesSplit = doc.splitTextToSize(visit.discussionNotes, pageWidth - 50);
        const maxLines = Math.min(notesSplit.length, 3);
        for (let i = 0; i < maxLines; i++) {
          if (yPos + 4 > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(notesSplit[i], 23, yPos);
          yPos += 4;
        }
        if (notesSplit.length > 3) {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(COLORS.secondary);
          doc.text('(See full notes in system)', 23, yPos);
          yPos += 4;
        }
      }
      
      // Follow-up Actions
      if (visit.followUpActions && visit.followUpActions.length > 0) {
        yPos += 2;
        doc.setFontSize(9);
        doc.setTextColor(COLORS.warning);
        doc.setFont('helvetica', 'bold');
        doc.text(`Follow-up Actions (${visit.followUpActions.length}):`, 20, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        visit.followUpActions.slice(0, 2).forEach(action => {
          if (yPos + 5 > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          const priorityColor = 
            action.priority === 'high' ? COLORS.danger :
            action.priority === 'medium' ? COLORS.warning :
            COLORS.secondary;
          
          doc.setTextColor(priorityColor);
          doc.text(`• [${action.priority.toUpperCase()}]`, 23, yPos);
          doc.setTextColor(COLORS.text);
          doc.text(action.action, 40, yPos);
          yPos += 5;
        });
      }
      
      yPos += 10;
      
      // Separator line
      if (idx < visits.length - 1) {
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.3);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 8;
      }
    });
  }

  // ========================================
  // DETAILED QUOTATIONS SECTION
  // ========================================
  
  if (quotations.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(18);
    doc.setTextColor(COLORS.success);
    doc.setFont('helvetica', 'bold');
    doc.text(`💰 QUOTATION REQUESTS (${quotations.length})`, 15, yPos);
    
    yPos += 10;
    doc.setDrawColor(COLORS.success);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;
    
    quotations.forEach((quote, idx) => {
      // Check if we need a new page
      if (yPos + 50 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      
      // Quotation Header
      const statusColor = 
        quote.status === 'responded' || quote.status === 'completed' ? '#d1fae5' :
        quote.status === 'in_progress' ? '#dbeafe' :
        quote.status === 'rejected' ? '#fee2e2' :
        '#fef3c7';
      
      doc.setFillColor(statusColor);
      doc.roundedRect(15, yPos, pageWidth - 30, 10, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(COLORS.success);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${quote.productName}`, 20, yPos + 7);
      
      // Status Badge
      doc.setFontSize(8);
      const textColor = 
        quote.status === 'responded' || quote.status === 'completed' ? COLORS.success :
        quote.status === 'rejected' ? COLORS.danger :
        COLORS.warning;
      doc.setTextColor(textColor);
      doc.text(quote.status.toUpperCase().replace('_', ' '), pageWidth - 20, yPos + 7, { align: 'right' });
      
      yPos += 14;
      
      // Client Details
      doc.setFontSize(9);
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.text(`Client: ${quote.clientName}`, 20, yPos);
      doc.text(`Contact: ${quote.clientContact}`, 20, yPos + 5);
      
      yPos += 12;
      
      // Product Details
      doc.setFontSize(8);
      doc.text(`Category: ${quote.productCategory}`, 20, yPos);
      doc.text(`Quantity: ${quote.quantity}`, pageWidth / 2, yPos);
      
      yPos += 5;
      
      const urgencyColor = 
        quote.urgency === 'high' ? COLORS.danger :
        quote.urgency === 'medium' ? COLORS.warning :
        COLORS.secondary;
      
      doc.setTextColor(urgencyColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`Urgency: ${quote.urgency.toUpperCase()}`, 20, yPos);
      
      doc.setTextColor(COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Submitted: ${new Date(quote.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        pageWidth / 2,
        yPos
      );
      
      yPos += 8;
      
      // Specifications
      if (quote.specifications && quote.specifications.trim()) {
        doc.setFontSize(8);
        doc.setTextColor(COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Specifications:', 20, yPos);
        yPos += 4;
        
        doc.setFont('helvetica', 'normal');
        const specSplit = doc.splitTextToSize(quote.specifications, pageWidth - 50);
        const maxLines = Math.min(specSplit.length, 2);
        for (let i = 0; i < maxLines; i++) {
          if (yPos + 4 > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(specSplit[i], 23, yPos);
          yPos += 4;
        }
        yPos += 2;
      }
      
      // Response Details (if responded)
      if (quote.responded && quote.response) {
        yPos += 2;
        doc.setFillColor('#d1fae5');
        doc.roundedRect(20, yPos, pageWidth - 40, 20, 2, 2, 'F');
        
        doc.setFontSize(9);
        doc.setTextColor(COLORS.success);
        doc.setFont('helvetica', 'bold');
        doc.text('✓ Response Provided', 23, yPos + 6);
        
        yPos += 11;
        doc.setFontSize(8);
        doc.setTextColor(COLORS.text);
        doc.setFont('helvetica', 'normal');
        
        if (quote.response.estimatedCost) {
          doc.text(`Estimated Cost: KES ${quote.response.estimatedCost.toLocaleString()}`, 23, yPos);
        }
        
        doc.text(
          `By: ${quote.response.respondedBy.firstName} ${quote.response.respondedBy.lastName}`,
          pageWidth - 23,
          yPos,
          { align: 'right' }
        );
        
        yPos += 5;
        doc.setFontSize(7);
        doc.setTextColor(COLORS.secondary);
        doc.text(
          `Responded: ${new Date(quote.response.respondedAt).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}`,
          23,
          yPos
        );
        
        yPos += 5;
      }
      
      yPos += 10;
      
      // Separator line
      if (idx < quotations.length - 1) {
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.3);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 8;
      }
    });
  }

  // ========================================
  // REPORT CONTENT SECTIONS
  // ========================================
  
  doc.addPage();
  yPos = 20;
  
  doc.setFontSize(18);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('📋 WEEKLY REPORT', 15, yPos);
  
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
      let icon = '📄';

      switch (section.id) {
        case 'summary':
          bgColor = COLORS.lightGray;
          titleColor = COLORS.primary;
          icon = '📋';
          break;
        case 'visits':
          bgColor = '#dbeafe';
          titleColor = COLORS.primary;
          icon = '👥';
          break;
        case 'quotations':
          bgColor = '#d1fae5';
          titleColor = COLORS.success;
          icon = '💰';
          break;
        case 'leads':
          bgColor = '#fef3c7';
          titleColor = COLORS.warning;
          icon = '🎯';
          break;
        case 'challenges':
          bgColor = '#fee2e2';
          titleColor = COLORS.danger;
          icon = '⚠️';
          break;
        case 'nextWeek':
        case 'next-week':
          bgColor = '#e9d5ff';
          titleColor = '#9333ea';
          icon = '⚡';
          break;
      }

      doc.setFillColor(bgColor);
      doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(titleColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${icon} ${section.title}`, 20, yPos + 6);
      
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
    doc.text('📋 Report Content', 20, yPos + 6);
    
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
  }
  
  // Admin Notes
  if (report.adminNotes && report.adminNotes.trim()) {
    if (yPos + 30 > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 10;
    doc.setFillColor('#fff3cd');
    doc.roundedRect(15, yPos, pageWidth - 30, 8, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('📝 Admin Notes:', 20, yPos + 6);
    
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
