import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Brand palette ─────────────────────────────────────────────────────────────
const BLACK      = [15,  15,  15]  as [number, number, number]
const DARK_GRAY  = [60,  60,  60]  as [number, number, number]
const LIGHT_GRAY = [245, 245, 245] as [number, number, number]
const MID_GRAY   = [180, 180, 180] as [number, number, number]
const WHITE      = [255, 255, 255] as [number, number, number]

// Accent colours for charts / tiles
const BLUE   = [59,  130, 246] as [number, number, number]
const PINK   = [219, 39,  119] as [number, number, number]
const GREEN  = [16,  185, 129] as [number, number, number]
const AMBER  = [245, 158, 11]  as [number, number, number]
const PURPLE = [139, 92,  246] as [number, number, number]
const CYAN   = [6,   182, 212] as [number, number, number]
const SLATE  = [100, 116, 139] as [number, number, number]

// ─── Page dimensions helper ────────────────────────────────────────────────────
function pw(doc: jsPDF) { return doc.internal.pageSize.getWidth() }

// ─── Page-break guard ─────────────────────────────────────────────────────────
function ensureSpace(doc: jsPDF, y: number, need: number): number {
  const pageH = doc.internal.pageSize.getHeight()
  if (y + need > pageH - 18) {
    doc.addPage()
    return 20
  }
  return y
}

// ─── Header ───────────────────────────────────────────────────────────────────
function addHeader(doc: jsPDF, title: string, subtitle: string, branchName?: string): number {
  const W = pw(doc)

  // Top bar
  doc.setFillColor(...BLACK)
  doc.rect(0, 0, W, 28, 'F')

  doc.setTextColor(...WHITE)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('THE OLD APOSTOLIC CHURCH', 14, 12)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Church Attendance & Analytics Platform', 14, 20)

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  doc.text(dateStr, W - 14, 17, { align: 'right' })

  // Title band
  doc.setFillColor(...LIGHT_GRAY)
  doc.rect(0, 28, W, 22, 'F')

  doc.setTextColor(...BLACK)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 14, 40)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK_GRAY)
  doc.text(subtitle, 14, 47)
  if (branchName) doc.text(`Branch: ${branchName}`, W - 14, 47, { align: 'right' })

  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.8)
  doc.line(0, 50, W, 50)

  return 58
}

// ─── Section title ─────────────────────────────────────────────────────────────
function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text(title.toUpperCase(), 14, y)
  doc.setDrawColor(...MID_GRAY)
  doc.setLineWidth(0.3)
  doc.line(14, y + 2, pw(doc) - 14, y + 2)
  return y + 8
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  const W = pw(doc)
  const H = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...LIGHT_GRAY)
    doc.rect(0, H - 12, W, 12, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)
    doc.text('The Old Apostolic Church — Confidential', 14, H - 4)
    doc.text(`Page ${i} of ${pageCount}`, W - 14, H - 4, { align: 'right' })
  }
}

// ─── KPI tile row (coloured stat cards) ────────────────────────────────────────
function drawKPIRow(
  doc: jsPDF,
  tiles: { label: string; value: string; color: [number, number, number] }[],
  y: number
): number {
  const W = pw(doc)
  const gap = 4
  const tileW = (W - 28 - gap * (tiles.length - 1)) / tiles.length

  tiles.forEach((t, i) => {
    const x = 14 + i * (tileW + gap)
    doc.setFillColor(...t.color)
    doc.roundedRect(x, y, tileW, 22, 2, 2, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(t.value, x + tileW / 2, y + 13, { align: 'center' })
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(t.label.toUpperCase(), x + tileW / 2, y + 19, { align: 'center' })
  })
  return y + 28
}

// ─── Horizontal percentage bar ─────────────────────────────────────────────────
function drawHBar(
  doc: jsPDF,
  label: string,
  value: number,
  total: number,
  color: [number, number, number],
  y: number
): number {
  const W = pw(doc)
  const barX = 55
  const barW = W - barX - 28
  const pct = total > 0 ? value / total : 0

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK_GRAY)
  doc.text(label, 14, y + 4)

  // Track (background)
  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(barX, y, barW, 6, 1, 1, 'F')

  // Fill
  if (pct > 0) {
    doc.setFillColor(...color)
    doc.roundedRect(barX, y, barW * pct, 6, 1, 1, 'F')
  }

  // Percentage label
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text(`${value}  (${Math.round(pct * 100)}%)`, W - 14, y + 4.5, { align: 'right' })

  return y + 10
}

// ─── Mini bar chart (attendance sparkline) ─────────────────────────────────────
function drawMiniBarChart(
  doc: jsPDF,
  data: { label: string; value: number }[],
  y: number,
  chartH = 30
): number {
  const W = pw(doc)
  const chartX = 14
  const chartW = W - 28
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const barW = Math.max(2, (chartW / data.length) - 1)

  // Baseline
  doc.setDrawColor(...MID_GRAY)
  doc.setLineWidth(0.3)
  doc.line(chartX, y + chartH, chartX + chartW, y + chartH)

  data.forEach((d, i) => {
    const bh = (d.value / maxVal) * chartH
    const bx = chartX + i * (chartW / data.length)
    doc.setFillColor(...BLUE)
    doc.rect(bx, y + chartH - bh, barW, bh, 'F')
  })

  // Max label
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK_GRAY)
  doc.text(`Max: ${maxVal}`, W - 14, y + 4, { align: 'right' })

  // First / last date labels
  if (data.length > 0) {
    doc.text(data[0].label, chartX, y + chartH + 5)
    if (data.length > 1) doc.text(data[data.length - 1].label, W - 14, y + chartH + 5, { align: 'right' })
  }
  return y + chartH + 10
}

// ─── ANALYTICS REPORT ─────────────────────────────────────────────────────────

export function exportAnalyticsPDF(data: any, branchName: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = addHeader(
    doc,
    'Analytics Report',
    `Generated: ${new Date().toLocaleString('en-GB')}`,
    branchName
  )

  // ── KPI tiles ────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 30)
  y = addSectionTitle(doc, 'Key Metrics', y)
  y = drawKPIRow(doc, [
    { label: 'Total Members',   value: String(data.summary.totalMembers),   color: BLACK  },
    { label: 'Total Events',    value: String(data.summary.totalEvents),    color: SLATE  },
    { label: 'Total Attendance',value: String(data.summary.totalAttendance),color: BLUE   },
    { label: 'Avg / Event',     value: String(data.summary.avgAttendance),  color: GREEN  },
  ], y)

  y = ensureSpace(doc, y, 30)
  y = drawKPIRow(doc, [
    { label: 'Male Members',       value: String(data.summary.maleCount),        color: BLUE   },
    { label: 'Female Members',     value: String(data.summary.femaleCount),       color: PINK   },
    { label: 'Admin Registered',   value: String(data.summary.adminRegistered),   color: PURPLE },
    { label: 'Self Registered',    value: String(data.summary.selfRegistered),    color: CYAN   },
  ], y)

  y = ensureSpace(doc, y, 30)
  y = drawKPIRow(doc, [
    { label: 'Attendance Rate', value: `${data.attendanceRate}%`, color: AMBER },
  ], y)

  // ── Gender distribution ───────────────────────────────────────────
  y = ensureSpace(doc, y, 40)
  y = addSectionTitle(doc, 'Gender Distribution', y)
  const gTotal = data.summary.maleCount + data.summary.femaleCount
  y = drawHBar(doc, 'Male',   data.summary.maleCount,   gTotal, BLUE, y)
  y = drawHBar(doc, 'Female', data.summary.femaleCount, gTotal, PINK, y)
  y += 4

  // ── Registration sources ──────────────────────────────────────────
  y = ensureSpace(doc, y, 30)
  y = addSectionTitle(doc, 'Registration Sources', y)
  const rTotal = data.summary.adminRegistered + data.summary.selfRegistered
  y = drawHBar(doc, 'Admin Registered', data.summary.adminRegistered, rTotal, PURPLE, y)
  y = drawHBar(doc, 'Self Registered',  data.summary.selfRegistered,  rTotal, CYAN,   y)
  y += 4

  // ── Age distribution table ────────────────────────────────────────
  y = ensureSpace(doc, y, 40)
  y = addSectionTitle(doc, 'Age Distribution', y)

  const AGE_COLORS = [PURPLE, CYAN, GREEN, AMBER, PINK]
  data.ageDistribution.forEach((row: any, idx: number) => {
    y = ensureSpace(doc, y, 12)
    y = drawHBar(doc, `${row.name}  (M: ${row.male}  F: ${row.female})`, row.total, data.summary.totalMembers, AGE_COLORS[idx % AGE_COLORS.length], y)
  })
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Age Group', 'Total', 'Male', 'Female', '% of Members']],
    body: data.ageDistribution.map((row: any) => [
      row.name,
      row.total,
      row.male,
      row.female,
      data.summary.totalMembers > 0
        ? `${Math.round((row.total / data.summary.totalMembers) * 100)}%`
        : '0%',
    ]),
    theme: 'grid',
    headStyles: { fillColor: BLACK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: DARK_GRAY },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 14, right: 14 },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // ── Attendance trends chart ───────────────────────────────────────
  if (data.trends && data.trends.length > 0) {
    y = ensureSpace(doc, y, 60)
    y = addSectionTitle(doc, 'Attendance Trends — Last 90 Days', y)

    const chartData = data.trends.slice(-30).map((r: any) => ({
      label: r.date ? String(r.date).slice(5) : '',
      value: Number(r.attendance) || 0,
    }))
    y = drawMiniBarChart(doc, chartData, y, 35)

    autoTable(doc, {
      startY: y,
      head: [['Event', 'Date', 'Attendance']],
      body: data.trends.map((row: any) => [row.event, row.date, row.attendance]),
      theme: 'grid',
      headStyles: { fillColor: BLACK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: DARK_GRAY },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Top attendees ─────────────────────────────────────────────────
  if (data.topAttendees && data.topAttendees.length > 0) {
    y = ensureSpace(doc, y, 40)
    y = addSectionTitle(doc, 'Top Attendees', y)
    autoTable(doc, {
      startY: y,
      head: [['Rank', 'Name', 'Phone', 'Events Attended']],
      body: data.topAttendees.map((row: any, i: number) => [
        `#${i + 1}`,
        row.name,
        row.phone,
        row.attendanceCount,
      ]),
      theme: 'grid',
      headStyles: { fillColor: BLACK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: DARK_GRAY },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      columnStyles: { 0: { cellWidth: 14, halign: 'center' }, 3: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    })
  }

  addFooter(doc)
  doc.save(`OAC-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ─── ATTENDANCE REPORT ─────────────────────────────────────────────────────────

type AttendanceExportRow = {
  id: string
  type: 'Member' | 'Guest'
  full_name: string
  gender: 'Male' | 'Female' | 'N/A'
  age: number | null
  phone_number: string | null
  branch_name: string | null
  checked_in_at: string
}

type AttendanceExportOptions = {
  scope?: 'combined' | 'members' | 'guests'
}

export function exportAttendancePDF(
  attendanceRows: AttendanceExportRow[],
  eventTitle: string,
  eventDate: string,
  branchName: string,
  options?: AttendanceExportOptions
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = addHeader(
    doc,
    'Event Attendance Report',
    `${eventTitle}  ·  ${new Date(eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    branchName
  )

  const male = attendanceRows.filter((r) => r.gender === 'Male').length
  const female = attendanceRows.filter((r) => r.gender === 'Female').length
  const members = attendanceRows.filter((r) => r.type === 'Member').length
  const guests = attendanceRows.filter((r) => r.type === 'Guest').length
  const total = attendanceRows.length

  // ── KPI tiles ────────────────────────────────────────────────────
  y = addSectionTitle(doc, 'Event Summary', y)
  y = drawKPIRow(doc, [
    { label: 'Total Checked In', value: String(total), color: BLACK },
    { label: 'Members', value: String(members), color: BLUE },
    { label: 'Guests', value: String(guests), color: PURPLE },
    { label: 'Female', value: String(female), color: PINK },
  ], y)

  // ── Gender bar ────────────────────────────────────────────────────
  y = addSectionTitle(doc, 'Gender Breakdown', y)
  y = drawHBar(doc, 'Male', male, total || 1, BLUE, y)
  y = drawHBar(doc, 'Female', female, total || 1, PINK, y)
  y += 6

  // ── Age distribution for rows that include age ───────────────────
  const ageGroups: Record<string, number> = { '0-12': 0, '13-18': 0, '19-35': 0, '36-60': 0, '60+': 0 }
  attendanceRows.forEach((row) => {
    if (row.age === null) return
    const age = row.age
    if      (age <= 12) ageGroups['0-12']++
    else if (age <= 18) ageGroups['13-18']++
    else if (age <= 35) ageGroups['19-35']++
    else if (age <= 60) ageGroups['36-60']++
    else                ageGroups['60+']++
  })
  const AGE_COLORS = [PURPLE, CYAN, GREEN, AMBER, PINK]
  const ageEntries = Object.entries(ageGroups)
  const hasAgeData = ageEntries.some(([, v]) => v > 0)
  if (hasAgeData) {
    y = addSectionTitle(doc, 'Age Distribution (Where Available)', y)
    ageEntries.forEach(([label, val], idx) => {
      y = drawHBar(doc, label, val, total || 1, AGE_COLORS[idx], y)
    })
    y += 4
  }

  // ── Attendance register ───────────────────────────────────────────
  y = ensureSpace(doc, y, 20)
  const scopeLabel = options?.scope
    ? options.scope.charAt(0).toUpperCase() + options.scope.slice(1)
    : 'Combined'
  y = addSectionTitle(doc, `Attendance Register (${scopeLabel} · ${total} rows)`, y)
  autoTable(doc, {
    startY: y,
    head: [['#', 'Type', 'Full Name', 'Gender', 'Age', 'Phone', 'Branch', 'Check-in Time']],
    body: attendanceRows.map((row, i) => {
      return [
        i + 1,
        row.type,
        row.full_name || 'Unknown',
        row.gender || 'N/A',
        row.age ?? 'N/A',
        row.phone_number || 'N/A',
        row.branch_name || 'N/A',
        new Date(row.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      ]
    }),
    theme: 'grid',
    headStyles: { fillColor: BLACK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: DARK_GRAY },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 10, halign: 'center' },
      7: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  })

  addFooter(doc)
  const safeName = eventTitle.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
  doc.save(`OAC-Attendance-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ─── MEMBERS DIRECTORY REPORT ──────────────────────────────────────────────────

export function exportMembersPDF(
  members: any[],
  branches: any[],
  filterLabel: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = addHeader(
    doc,
    'Members Directory',
    `Generated: ${new Date().toLocaleString('en-GB')}  ·  Filter: ${filterLabel}`
  )

  const male              = members.filter(m => m.gender === 'Male').length
  const female            = members.filter(m => m.gender === 'Female').length
  const adminRegistered   = members.filter(m => m.registration_source === 'admin').length
  const selfRegistered    = members.filter(m => m.registration_source === 'self_registration').length

  // ── KPI tiles ────────────────────────────────────────────────────
  y = addSectionTitle(doc, 'Summary', y)
  y = drawKPIRow(doc, [
    { label: 'Total Members',     value: String(members.length), color: BLACK  },
    { label: 'Male',              value: String(male),           color: BLUE   },
    { label: 'Female',            value: String(female),         color: PINK   },
    { label: 'Admin Registered',  value: String(adminRegistered),color: PURPLE },
  ], y)

  // ── Gender bar ─────────────────────────────────────────────────────
  y = addSectionTitle(doc, 'Gender Breakdown', y)
  y = drawHBar(doc, 'Male',   male,   members.length, BLUE, y)
  y = drawHBar(doc, 'Female', female, members.length, PINK, y)
  y += 4

  // ── Branch breakdown ──────────────────────────────────────────────
  if (branches.length > 1) {
    y = ensureSpace(doc, y, 40)
    y = addSectionTitle(doc, 'Members by Branch', y)
    branches.forEach((b, idx) => {
      const count = members.filter(m => m.branch_id === b.id).length
      y = ensureSpace(doc, y, 12)
      y = drawHBar(
        doc,
        b.name,
        count,
        members.length,
        [BLUE, PINK, GREEN, AMBER, PURPLE, CYAN][idx % 6],
        y
      )
    })
    y += 4
  }

  // ── Age distribution ──────────────────────────────────────────────
  const ageBuckets: Record<string, number> = { '0-12': 0, '13-18': 0, '19-35': 0, '36-60': 0, '60+': 0 }
  members.forEach(m => {
    if (m.date_of_birth) {
      const age = Math.floor((Date.now() - new Date(m.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365))
      if      (age <= 12) ageBuckets['0-12']++
      else if (age <= 18) ageBuckets['13-18']++
      else if (age <= 35) ageBuckets['19-35']++
      else if (age <= 60) ageBuckets['36-60']++
      else                ageBuckets['60+']++
    }
  })
  y = ensureSpace(doc, y, 50)
  y = addSectionTitle(doc, 'Age Distribution', y)
  const AGE_COLORS = [PURPLE, CYAN, GREEN, AMBER, PINK]
  Object.entries(ageBuckets).forEach(([label, val], idx) => {
    y = drawHBar(doc, label, val, members.length || 1, AGE_COLORS[idx], y)
  })
  y += 4

  // ── Full member directory ─────────────────────────────────────────
  y = ensureSpace(doc, y, 20)
  y = addSectionTitle(doc, `Full Directory  (${members.length} members)`, y)
  autoTable(doc, {
    startY: y,
    head: [['#', 'Full Name', 'Gender', 'Age', 'Baptism Yr', 'Phone', 'Branch', 'Source', 'Registered']],
    body: members.map((m, i) => {
      const age = m.date_of_birth
        ? Math.floor((Date.now() - new Date(m.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 'N/A'
      const branch = branches.find((b: any) => b.id === m.branch_id)?.name || 'N/A'
      const source = m.registration_source === 'admin' ? 'Admin' : 'Self'
      const regDate = m.created_at
        ? new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A'
      return [i + 1, m.full_name, m.gender, age, m.baptism_year ?? '—', m.phone_number, branch, source, regDate]
    }),
    theme: 'grid',
    headStyles: { fillColor: BLACK, textColor: WHITE, fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: DARK_GRAY },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  })

  addFooter(doc)
  doc.save(`OAC-Members-Directory-${new Date().toISOString().split('T')[0]}.pdf`)
}
