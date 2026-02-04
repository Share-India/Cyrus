import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { Domain, ScoringResult } from "./scoring-engine"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
    interface jsPDF {
        autoTable: typeof autoTable
    }
}

export async function downloadPDFSummary(
    result: ScoringResult,
    domains: Domain[],
    clientName: string = '',
    industryName: string = '',
    clientEmail: string = '',
    submissionDate: string = '',
    protocolId: string = ''
) {
    const doc = new jsPDF()

    // Share India Brand Colors
    const NAVY = [26, 35, 50] as [number, number, number]
    const BLUE = [42, 126, 254] as [number, number, number]
    const LIGHT_GRAY = [241, 245, 249] as [number, number, number]
    const DARK_GRAY = [71, 85, 105] as [number, number, number]

    let yPosition = 20

    // Add Share India Logo with proper aspect ratio
    try {
        const logoImg = await loadImage('/share-india-logo.png')
        // Fixed aspect ratio - logo is approximately 3:1 (width:height)
        const logoWidth = 45
        const logoHeight = 15 // Maintains 3:1 aspect ratio
        doc.addImage(logoImg, 'PNG', 15, yPosition, logoWidth, logoHeight)
    } catch (error) {
        console.warn('Logo not loaded, continuing without it')
    }

    yPosition += 20

    // Company Header
    doc.setFontSize(10)
    doc.setTextColor(...NAVY)
    doc.setFont('helvetica', 'bold')
    doc.text('SHARE INDIA INSURANCE BROKERS', 15, yPosition)
    yPosition += 5

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)
    doc.text('An IRDAI Licensed Direct Insurance Broker (Composite)', 15, yPosition)
    yPosition += 4
    doc.text('"YOU GENERATE, WE MULTIPLY"', 15, yPosition)
    yPosition += 10

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('CYBER RISK ASSESSMENT SUMMARY', 15, yPosition)
    yPosition += 10

    // Client Information Section - Always show with all available details
    const hasClientInfo = clientName || industryName || clientEmail || submissionDate || protocolId
    if (hasClientInfo) {
        // Calculate height based on number of fields
        let infoHeight = 12 // Base height
        if (clientName) infoHeight += 5
        if (clientEmail) infoHeight += 5
        if (industryName) infoHeight += 5
        if (submissionDate) infoHeight += 5
        if (protocolId) infoHeight += 5
        infoHeight += 3 // Padding

        doc.setFillColor(245, 247, 250) // Light blue-gray background
        doc.roundedRect(15, yPosition, 180, infoHeight, 2, 2, 'F')

        yPosition += 7
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...NAVY)
        doc.text('CLIENT INFORMATION', 20, yPosition)
        yPosition += 6

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...DARK_GRAY)
        doc.setFontSize(8)

        if (clientName) {
            doc.setFont('helvetica', 'bold')
            doc.text('Organization:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(clientName, 55, yPosition)
            yPosition += 5
        }

        if (clientEmail) {
            doc.setFont('helvetica', 'bold')
            doc.text('Email:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(clientEmail, 55, yPosition)
            yPosition += 5
        }

        if (industryName) {
            doc.setFont('helvetica', 'bold')
            doc.text('Industry Type:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(industryName, 55, yPosition)
            yPosition += 5
        }

        if (submissionDate) {
            doc.setFont('helvetica', 'bold')
            doc.text('Submission Date:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(submissionDate, 55, yPosition)
            yPosition += 5
        }

        if (protocolId) {
            doc.setFont('helvetica', 'bold')
            doc.text('Protocol ID:', 20, yPosition)
            doc.setFont('helvetica', 'normal')
            doc.text(protocolId, 55, yPosition)
            yPosition += 5
        }

        yPosition += 5
    }

    // Horizontal line
    doc.setDrawColor(...BLUE)
    doc.setLineWidth(0.5)
    doc.line(15, yPosition, 195, yPosition)
    yPosition += 10

    // Assessment Summary Box
    doc.setFillColor(...LIGHT_GRAY)
    doc.roundedRect(15, yPosition, 180, 60, 3, 3, 'F')

    yPosition += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('ASSESSMENT OVERVIEW', 20, yPosition)
    yPosition += 8

    // Risk Score
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Overall Risk Score:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BLUE)
    doc.text(result.totalScore.toFixed(2), 70, yPosition)
    yPosition += 6

    // Risk Tier with color coding
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('Risk Tier:', 20, yPosition)

    // Color code based on tier
    const tierColors: Record<string, [number, number, number]> = {
        'A': [16, 185, 129] as [number, number, number], // Green
        'B': [59, 130, 246] as [number, number, number], // Blue
        'C': [251, 146, 60] as [number, number, number], // Orange
        'D': [239, 68, 68] as [number, number, number]   // Red
    }
    doc.setTextColor(...(tierColors[result.riskTier] || BLUE))
    doc.setFontSize(12)
    doc.text(result.riskTier, 70, yPosition)
    doc.setFontSize(9)
    yPosition += 6

    // Premium Loading
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('Premium Loading:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)
    doc.text(result.premiumLoading, 70, yPosition)
    yPosition += 6

    // Auto-Decline Status
    doc.setFont('helvetica', 'bold')
    doc.text('Status:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    if (result.autoDeclined) {
        doc.setTextColor(239, 68, 68) // Red
        doc.text('DECLINED - Critical Controls Failed', 70, yPosition)
    } else {
        doc.setTextColor(16, 185, 129) // Green
        doc.text('ELIGIBLE FOR UNDERWRITING', 70, yPosition)
    }
    yPosition += 6

    // Normalized Score
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('Normalized Score:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)
    doc.text(result.normalizedScore.toFixed(2), 70, yPosition)
    yPosition += 6

    // Volatility Score
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('Volatility Score:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)
    doc.text(result.volatilityScore.toFixed(2), 70, yPosition)

    yPosition += 15

    // Domain Scores Table
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text('DOMAIN-LEVEL PERFORMANCE', 15, yPosition)
    yPosition += 5

    const tableData = result.domainScores.map(ds => [
        ds.domain,
        ds.score.toFixed(1) + '%',
        ds.earnedScore.toFixed(1),
        ds.maxScore.toString(),
        ds.activeWeight.toFixed(1) + '%',
        ds.contribution.toFixed(2)
    ])

    autoTable(doc, {
        startY: yPosition,
        head: [['Domain', 'Score %', 'Earned', 'Max', 'Weight %', 'Contribution']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: NAVY,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8
        },
        bodyStyles: {
            fontSize: 7,
            textColor: DARK_GRAY
        },
        alternateRowStyles: {
            fillColor: LIGHT_GRAY
        },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10

    // Failed Killer Questions (if any)
    if (result.failedKillers.length > 0) {
        // Check if we need a new page
        if (yPosition > 240) {
            doc.addPage()
            yPosition = 20
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(239, 68, 68) // Red
        doc.text('CRITICAL CONTROL FAILURES', 15, yPosition)
        yPosition += 5

        const killerData = result.failedKillers.map(k => [
            k.id,
            k.domain,
            k.text
        ])

        autoTable(doc, {
            startY: yPosition,
            head: [['ID', 'Domain', 'Failed Control']],
            body: killerData,
            theme: 'striped',
            headStyles: {
                fillColor: [239, 68, 68], // Red
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8
            },
            bodyStyles: {
                fontSize: 7,
                textColor: DARK_GRAY
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 50 },
                2: { cellWidth: 110 }
            },
            margin: { left: 15, right: 15 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Decline Narrative (if present)
    if (result.declineNarrative && result.declineNarrative.trim() !== '') {
        // Check if we need a new page
        if (yPosition > 240) {
            doc.addPage()
            yPosition = 20
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...NAVY)
        doc.text('UNDERWRITING NARRATIVE', 15, yPosition)
        yPosition += 7

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...DARK_GRAY)

        const narrativeLines = doc.splitTextToSize(result.declineNarrative, 180)
        narrativeLines.forEach((line: string) => {
            if (yPosition > 280) {
                doc.addPage()
                yPosition = 20
            }
            doc.text(line, 15, yPosition)
            yPosition += 5
        })
    }

    // Footer - Disclaimer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Footer line
        doc.setDrawColor(...LIGHT_GRAY)
        doc.setLineWidth(0.5)
        doc.line(15, 285, 195, 285)

        doc.setFontSize(7)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...DARK_GRAY)
        doc.text(
            'DISCLAIMER: This report is based on self-attested controls. Final underwriting is subject to Share India\'s verification and approval.',
            15,
            290
        )

        // Page number and date
        doc.setFont('helvetica', 'normal')
        const date = new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
        doc.text(`Generated: ${date}`, 15, 294)
        doc.text(`Page ${i} of ${pageCount}`, 180, 294)
    }

    // Download the PDF
    const filename = `ShareIndia_CyberRisk_Summary_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
}

// Helper function to load image
function loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(img, 0, 0)
                resolve(canvas.toDataURL('image/png'))
            } else {
                reject(new Error('Could not get canvas context'))
            }
        }
        img.onerror = () => reject(new Error('Could not load image'))
        img.src = url
    })
}
