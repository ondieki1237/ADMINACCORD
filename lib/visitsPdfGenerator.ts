import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Load and convert logo image to base64 for PDF embedding
 */
const loadLogoAsBase64 = async (): Promise<string> => {
  try {
    const response = await fetch('/accordlogo_only.png');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo:', error);
    return '';
  }
};

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  employeeId?: string;
}

interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  designation: string;
}

interface Client {
  name: string;
  location: string;
  county: string;
  type: string;
}

interface Equipment {
  name: string;
  category: string;
  quantity: number;
  estimatedValue: number;
}

interface Visit {
  _id: string;
  userId: User;
  date: string;
  client: Client;
  contacts: Contact[];
  equipment: Equipment[];
  visitPurpose: string;
  visitOutcome: string;
  totalPotentialValue: number;
  followUpActions?: any[];
}

/**
 * Generate a comprehensive visits data extraction PDF
 * Focuses on key data: contacts, facilities, locations
 * Minimal theory, maximum data
 */
export const generateVisitsExtractionPDF = async (visits: Visit[]): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Load and add ACCORD Logo
  const logoBase64 = await loadLogoAsBase64();
  const addLogo = () => {
    if (logoBase64) {
      try {
        // Add logo image (20x20 size, positioned at top-left)
        doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20);
        
        // ACCORD text next to logo
        doc.setTextColor(0, 140, 247);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('ACCORD', 40, 20);
        
        // Tagline
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Medical Equipment Solutions', 40, 25);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
        // Fallback to text logo
        addTextLogo();
      }
    } else {
      // Fallback to text logo if image fails to load
      addTextLogo();
    }
  };

  // Fallback text-based logo
  const addTextLogo = () => {
    doc.setFillColor(0, 140, 247);
    doc.circle(20, 15, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('A', 16.5, 18);
    doc.setTextColor(0, 140, 247);
    doc.setFontSize(18);
    doc.text('ACCORD', 30, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Medical Equipment Solutions', 30, 22);
  };

  // Header with logo and title
  addLogo();
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Visits Data Extraction Report', pageWidth / 2, 25, { align: 'center' });

  // Date range and summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth / 2, 32, { align: 'center' });
  doc.text(`Total Visits: ${visits.length}`, pageWidth / 2, 38, { align: 'center' });

  yPosition = 50;

  // Summary Statistics
  const totalContacts = visits.reduce((sum, visit) => sum + (visit.contacts?.length || 0), 0);
  const totalEquipment = visits.reduce((sum, visit) => sum + (visit.equipment?.length || 0), 0);
  const totalValue = visits.reduce((sum, visit) => sum + (visit.totalPotentialValue || 0), 0);
  const uniqueFacilities = new Set(visits.map(v => v.client.name)).size;

  // Quick Stats Box
  doc.setFillColor(240, 247, 255);
  doc.roundedRect(14, yPosition - 5, pageWidth - 28, 25, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  const statsX = 20;
  doc.text(`Facilities: ${uniqueFacilities}`, statsX, yPosition + 2);
  doc.text(`Contacts: ${totalContacts}`, statsX + 45, yPosition + 2);
  doc.text(`Equipment Items: ${totalEquipment}`, statsX + 90, yPosition + 2);
  doc.text(`Total Value: KES ${totalValue.toLocaleString()}`, statsX, yPosition + 10);

  yPosition += 35;

  // Main Data Table - Visit by Visit
  const tableData: any[] = [];
  
  visits.forEach((visit, index) => {
    // Facility row (main row with merged style)
    const facilityRow = [
      `${index + 1}`,
      visit.client.name,
      `${visit.client.location}, ${visit.client.county}`,
      visit.client.type || 'N/A',
      new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      visit.visitOutcome || 'N/A'
    ];
    tableData.push(facilityRow);

    // Sales Rep
    tableData.push([
      '',
      { content: `Sales Rep: ${visit.userId.firstName} ${visit.userId.lastName}`, colSpan: 3, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
      { content: `Purpose: ${visit.visitPurpose}`, colSpan: 2, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } }
    ]);

    // Contacts section
    if (visit.contacts && visit.contacts.length > 0) {
      visit.contacts.forEach((contact, cIndex) => {
        tableData.push([
          '',
          { 
            content: `📞 ${contact.name}`, 
            colSpan: 2,
            styles: { fontStyle: 'bold', textColor: [0, 140, 247] }
          },
          { 
            content: `${contact.role} - ${contact.designation}`, 
            colSpan: 1,
            styles: { fontSize: 8 }
          },
          { 
            content: contact.phone, 
            colSpan: 1,
            styles: { fontSize: 8 }
          },
          { 
            content: contact.email, 
            colSpan: 1,
            styles: { fontSize: 8 }
          }
        ]);
      });
    }

    // Equipment section (condensed)
    if (visit.equipment && visit.equipment.length > 0) {
      const equipmentSummary = visit.equipment.map(eq => 
        `${eq.name} (${eq.quantity}x - KES ${eq.estimatedValue.toLocaleString()})`
      ).join(', ');
      
      tableData.push([
        '',
        { 
          content: `Equipment: ${equipmentSummary}`, 
          colSpan: 5,
          styles: { fontSize: 8, textColor: [80, 80, 80], cellPadding: 2 }
        }
      ]);
    }

    // Potential Value highlight
    if (visit.totalPotentialValue > 0) {
      tableData.push([
        '',
        { 
          content: `💰 Potential Value: KES ${visit.totalPotentialValue.toLocaleString()}`, 
          colSpan: 5,
          styles: { 
            fontStyle: 'bold', 
            textColor: [22, 163, 74], 
            fillColor: [240, 253, 244],
            fontSize: 9
          }
        }
      ]);
    }

    // Spacer row
    tableData.push([
      { content: '', colSpan: 6, styles: { minCellHeight: 3, fillColor: [250, 250, 250] } }
    ]);
  });

  autoTable(doc, {
    startY: yPosition,
    head: [[
      '#',
      'Facility Name',
      'Location',
      'Type',
      'Date',
      'Outcome'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [0, 140, 247],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 28 }
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on each page
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        'ACCORD - Medical Equipment Solutions',
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }
  });

  // Download the PDF
  const fileName = `ACCORD_Visits_Extraction_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Generate a contacts-focused extraction PDF
 * Pure contact directory from all visits
 */
export const generateContactsExtractionPDF = async (visits: Visit[]): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Load and add ACCORD Logo
  const logoBase64 = await loadLogoAsBase64();
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20);
      doc.setTextColor(0, 140, 247);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCORD', 40, 20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Medical Equipment Solutions', 40, 25);
    } catch (error) {
      console.error('Error adding logo:', error);
      // Fallback to text logo
      doc.setFillColor(0, 140, 247);
      doc.circle(20, 15, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('A', 16.5, 18);
      doc.setTextColor(0, 140, 247);
      doc.setFontSize(18);
      doc.text('ACCORD', 30, 18);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Medical Equipment Solutions', 30, 22);
    }
  } else {
    // Fallback to text logo
    doc.setFillColor(0, 140, 247);
    doc.circle(20, 15, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('A', 16.5, 18);
    doc.setTextColor(0, 140, 247);
    doc.setFontSize(18);
    doc.text('ACCORD', 30, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Medical Equipment Solutions', 30, 22);
  }

  // Header
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text('Contacts Directory', pageWidth / 2, 35, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Extracted: ${new Date().toLocaleDateString()}`, pageWidth / 2, 42, { align: 'center' });

  // Collect all unique contacts
  const contactsMap = new Map<string, { contact: Contact; facilities: string[] }>();
  
  visits.forEach(visit => {
    if (visit.contacts && visit.contacts.length > 0) {
      visit.contacts.forEach(contact => {
        const key = `${contact.email}_${contact.phone}`;
        if (contactsMap.has(key)) {
          const existing = contactsMap.get(key)!;
          if (!existing.facilities.includes(visit.client.name)) {
            existing.facilities.push(visit.client.name);
          }
        } else {
          contactsMap.set(key, {
            contact,
            facilities: [visit.client.name]
          });
        }
      });
    }
  });

  const contactsData = Array.from(contactsMap.values());

  // Contacts table
  const tableData = contactsData.map((item, index) => [
    `${index + 1}`,
    item.contact.name,
    item.contact.designation,
    item.contact.role,
    item.contact.phone,
    item.contact.email,
    item.facilities.join(', ')
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['#', 'Name', 'Designation', 'Role', 'Phone', 'Email', 'Facilities']],
    body: tableData,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [0, 140, 247],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 35 },
      6: { cellWidth: 27 }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });

  const fileName = `ACCORD_Contacts_Directory_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Generate a facilities-focused extraction PDF
 * List of all facilities visited with summary data
 */
export const generateFacilitiesExtractionPDF = async (visits: Visit[]): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Load and add ACCORD Logo
  const logoBase64 = await loadLogoAsBase64();
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20);
      doc.setTextColor(0, 140, 247);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCORD', 40, 20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Medical Equipment Solutions', 40, 25);
    } catch (error) {
      console.error('Error adding logo:', error);
      // Fallback to text logo
      doc.setFillColor(0, 140, 247);
      doc.circle(20, 15, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('A', 16.5, 18);
      doc.setTextColor(0, 140, 247);
      doc.setFontSize(18);
      doc.text('ACCORD', 30, 18);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Medical Equipment Solutions', 30, 22);
    }
  } else {
    // Fallback to text logo
    doc.setFillColor(0, 140, 247);
    doc.circle(20, 15, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('A', 16.5, 18);
    doc.setTextColor(0, 140, 247);
    doc.setFontSize(18);
    doc.text('ACCORD', 30, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Medical Equipment Solutions', 30, 22);
  }

  // Header
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text('Facilities Summary', pageWidth / 2, 35, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Extracted: ${new Date().toLocaleDateString()}`, pageWidth / 2, 42, { align: 'center' });

  // Group visits by facility
  const facilitiesMap = new Map<string, {
    client: Client;
    visitCount: number;
    totalValue: number;
    lastVisit: string;
    outcomes: string[];
  }>();

  visits.forEach(visit => {
    const key = visit.client.name;
    if (facilitiesMap.has(key)) {
      const existing = facilitiesMap.get(key)!;
      existing.visitCount++;
      existing.totalValue += visit.totalPotentialValue || 0;
      existing.outcomes.push(visit.visitOutcome);
      if (new Date(visit.date) > new Date(existing.lastVisit)) {
        existing.lastVisit = visit.date;
      }
    } else {
      facilitiesMap.set(key, {
        client: visit.client,
        visitCount: 1,
        totalValue: visit.totalPotentialValue || 0,
        lastVisit: visit.date,
        outcomes: [visit.visitOutcome]
      });
    }
  });

  const facilitiesData = Array.from(facilitiesMap.values())
    .sort((a, b) => b.totalValue - a.totalValue); // Sort by value descending

  // Facilities table
  const tableData = facilitiesData.map((item, index) => [
    `${index + 1}`,
    item.client.name,
    `${item.client.location}, ${item.client.county}`,
    item.client.type || 'N/A',
    `${item.visitCount}`,
    new Date(item.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    `KES ${item.totalValue.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['#', 'Facility Name', 'Location', 'Type', 'Visits', 'Last Visit', 'Total Value']],
    body: tableData,
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [0, 140, 247],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25 },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 28 },
      6: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });

  const fileName = `ACCORD_Facilities_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
