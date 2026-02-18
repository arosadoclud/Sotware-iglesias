import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs/promises'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MonthlyReportData {
  church: {
    name: string
    logoUrl?: string
    location?: string
    phone?: string
  }
  period: {
    month: string
    year: number
    startDate: Date
    endDate: Date
  }
  incomeByCategory: Array<{
    name: string
    code: string
    total: number
    count: number
  }>
  expenseByCategory: Array<{
    name: string
    code: string
    total: number
    count: number
  }>
  summary: {
    totalIncome: number
    totalExpense: number
    totalTithes: number
    councilDeduction: number
    netBalance: number
  }
  tithesDetails?: Array<{
    date: Date
    personName: string
    amount: number
    councilAmount: number
    churchAmount: number
  }>
  generatedBy: string
  generatedAt: Date
}

export async function generateMonthlyReportPDF(data: MonthlyReportData): Promise<Buffer> {
  const logoUrl = data.church.logoUrl 
    ? (data.church.logoUrl.startsWith('http') ? data.church.logoUrl : `https://sotware-iglesias-backend.onrender.com${data.church.logoUrl}`)
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 30px 35px;
      background: #ffffff;
      color: #1a1a2e;
      line-height: 1.5;
      font-size: 12px;
    }
    
    /* ---- HEADER ---- */
    .header {
      display: flex;
      align-items: center;
      padding-bottom: 18px;
      border-bottom: 3px solid #0f2b46;
      margin-bottom: 5px;
    }
    .logo-container {
      width: 75px;
      height: 75px;
      margin-right: 18px;
      flex-shrink: 0;
    }
    .logo {
      width: 75px;
      height: 75px;
      object-fit: contain;
      border-radius: 6px;
    }
    .header-text { flex: 1; }
    .church-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f2b46;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .church-address {
      font-size: 11px;
      color: #4a5568;
      line-height: 1.5;
    }
    .church-phone {
      font-size: 11px;
      color: #4a5568;
      margin-top: 2px;
    }
    
    /* ---- TITLE BAR ---- */
    .title-bar {
      background: #0f2b46;
      color: #ffffff;
      text-align: center;
      padding: 14px 20px;
      margin-bottom: 22px;
    }
    .title-bar h1 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin-bottom: 3px;
    }
    .title-bar .period {
      font-size: 13px;
      font-weight: 400;
      opacity: 0.9;
      text-transform: uppercase;
    }
    
    /* ---- SUMMARY BOXES ---- */
    .summary-row {
      display: flex;
      gap: 15px;
      margin-bottom: 22px;
    }
    .summary-box {
      flex: 1;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      padding: 14px 16px;
      text-align: center;
    }
    .summary-box.income { border-color: #16a34a; background: #f0fdf4; }
    .summary-box.expense { border-color: #dc2626; background: #fef2f2; }
    .summary-box.balance { border-color: #0f2b46; background: #eff6ff; }
    .summary-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .summary-value {
      font-size: 22px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
    }
    .summary-box.income .summary-value { color: #16a34a; }
    .summary-box.expense .summary-value { color: #dc2626; }
    .summary-box.balance .summary-value { color: #0f2b46; }
    
    /* ---- SECTIONS ---- */
    .section { margin: 20px 0; page-break-inside: avoid; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f2b46;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 8px 12px;
      background: #e8edf2;
      border-left: 4px solid #0f2b46;
      margin-bottom: 10px;
    }
    
    /* ---- TABLES ---- */
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 11px;
    }
    .table th {
      background: #0f2b46;
      color: #ffffff;
      font-weight: 600;
      padding: 10px 12px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table td {
      padding: 9px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .table tr:nth-child(even) td { background: #f9fafb; }
    .table tr:last-child td { border-bottom: none; }
    
    .amount { text-align: right; font-family: 'Courier New', monospace; font-weight: 700; }
    .income-amount { color: #16a34a; }
    .expense-amount { color: #dc2626; }
    
    .total-row td {
      background: #e8edf2 !important;
      font-weight: 700;
      font-size: 12px;
      border-top: 2px solid #0f2b46;
    }
    
    /* ---- TITHES SECTION ---- */
    .tithes-box {
      border: 2px solid #b45309;
      border-radius: 6px;
      padding: 18px;
      margin: 20px 0;
      background: #fffbeb;
      page-break-inside: avoid;
    }
    .tithes-title {
      font-size: 14px;
      font-weight: 700;
      color: #92400e;
      text-align: center;
      margin-bottom: 4px;
    }
    .tithes-subtitle {
      font-size: 11px;
      color: #92400e;
      text-align: center;
      margin-bottom: 15px;
    }
    .tithes-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 15px;
    }
    .tithes-table th {
      background: #92400e;
      color: white;
      padding: 8px 10px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
    }
    .tithes-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #fde68a;
    }
    .tithes-table tr:nth-child(even) td { background: #fef3c7; }
    .tithes-total-row td {
      background: #92400e !important;
      color: white;
      font-weight: 700;
      padding: 10px;
      font-size: 12px;
    }
    
    .council-summary {
      background: #0f2b46;
      color: white;
      border-radius: 6px;
      padding: 15px;
      text-align: center;
    }
    .council-summary .label { font-size: 11px; opacity: 0.9; margin-bottom: 6px; }
    .council-summary .value {
      font-size: 26px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
    }
    .council-summary .note {
      font-size: 10px;
      opacity: 0.8;
      margin-top: 8px;
      padding: 6px 10px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }
    
    /* ---- COUNCIL INFO ---- */
    .council-info {
      border: 2px solid #d1d5db;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      background: #f9fafb;
    }
    .council-info-title {
      font-size: 12px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 10px;
    }
    .council-info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #374151;
    }
    .council-info-note {
      font-size: 10px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 8px 10px;
      border-radius: 4px;
      margin-top: 8px;
    }
    
    /* ---- BALANCE ---- */
    .balance-table { margin-top: 5px; }
    .balance-total td {
      background: #0f2b46 !important;
      color: white !important;
      font-size: 14px;
      font-weight: 700;
      padding: 12px;
    }
    .balance-note {
      font-size: 10px;
      color: #4a5568;
      padding: 8px 10px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      margin-top: 8px;
    }
    
    /* ---- SIGNATURES ---- */
    .signature-section {
      display: flex;
      justify-content: space-around;
      margin: 45px 0 20px;
    }
    .signature-box { text-align: center; width: 220px; }
    .signature-line {
      border-top: 2px solid #1a1a2e;
      margin-top: 55px;
      padding-top: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
    }
    
    /* ---- FOOTER ---- */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #d1d5db;
      font-size: 10px;
      color: #6b7280;
    }
    .disclaimer {
      background: #f9fafb;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-size: 9px;
      color: #6b7280;
      text-align: center;
      margin-top: 10px;
    }
    
    @media print {
      body { padding: 20px; }
      .section, .tithes-box, .table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${logoUrl ? `<div class="logo-container"><img src="${logoUrl}" class="logo" alt="Logo" onerror="this.parentElement.style.display='none'"></div>` : ''}
    <div class="header-text">
      <div class="church-name">${data.church.name.toUpperCase()}</div>
      <div class="church-address">${data.church.location || ''}</div>
      ${data.church.phone ? `<div class="church-phone">Tel: ${data.church.phone}</div>` : ''}
    </div>
  </div>
  
  <!-- Title Bar -->
  <div class="title-bar">
    <h1>REPORTE FINANCIERO MENSUAL</h1>
    <div class="period">${data.period.month} ${data.period.year}</div>
  </div>
  
  <!-- Summary -->
  <div class="summary-row">
    <div class="summary-box income">
      <div class="summary-label">Total Ingresos</div>
      <div class="summary-value">RD$ ${data.summary.totalIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="summary-box expense">
      <div class="summary-label">Total Gastos</div>
      <div class="summary-value">RD$ ${data.summary.totalExpense.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="summary-box balance">
      <div class="summary-label">Balance Neto</div>
      <div class="summary-value">RD$ ${data.summary.netBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
    </div>
  </div>
  
  <!-- Income Breakdown -->
  <div class="section">
    <div class="section-title">Detalle de Ingresos</div>
    <table class="table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Categoría</th>
          <th>Cantidad</th>
          <th style="text-align:right;">Monto Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.incomeByCategory.map(cat => `
          <tr>
            <td style="font-weight: 600; color: #0f2b46;">${cat.code}</td>
            <td>${cat.name}</td>
            <td>${cat.count} transacciones</td>
            <td class="amount income-amount">RD$ ${cat.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">TOTAL INGRESOS:</td>
          <td class="amount income-amount">RD$ ${data.summary.totalIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Tithes Breakdown -->
  ${data.tithesDetails && data.tithesDetails.length > 0 ? `
  <div class="tithes-box">
    <div class="tithes-title">DESGLOSE DE DIEZMOS — 10% PARA EL CONCILIO</div>
    <div class="tithes-subtitle">Cada diezmo se divide: <strong>10% al Concilio</strong> + <strong>90% a la Iglesia Local</strong></div>

    <table class="tithes-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Diezmador</th>
          <th style="text-align:right;">Diezmo Total</th>
          <th style="text-align:right;">10% Concilio</th>
          <th style="text-align:right;">90% Iglesia</th>
        </tr>
      </thead>
      <tbody>
        ${data.tithesDetails.map((tithe, index) => `
          <tr>
            <td style="font-size:10px;">${format(new Date(tithe.date), 'dd/MM/yyyy', { locale: es })}</td>
            <td>${tithe.personName}</td>
            <td style="text-align:right; font-family:'Courier New',monospace; font-weight:600; color:#16a34a;">RD$ ${tithe.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            <td style="text-align:right; font-family:'Courier New',monospace; font-weight:700; color:#b45309;">RD$ ${tithe.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            <td style="text-align:right; font-family:'Courier New',monospace; color:#16a34a;">RD$ ${tithe.churchAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
        <tr class="tithes-total-row">
          <td colspan="2" style="text-align:right;">TOTAL DEL MES:</td>
          <td style="text-align:right; font-family:'Courier New',monospace;">RD$ ${data.summary.totalTithes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right; font-family:'Courier New',monospace;">RD$ ${data.summary.councilDeduction.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right; font-family:'Courier New',monospace;">RD$ ${(data.summary.totalTithes - data.summary.councilDeduction).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <div class="council-summary">
      <div class="label">ACUMULADO MENSUAL PARA EL CONCILIO</div>
      <div class="value">RD$ ${data.summary.councilDeduction.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
      <div class="note">Este monto se acumula mes a mes y se remite al concilio <strong>AL FINALIZAR EL AÑO</strong></div>
    </div>
  </div>
  ` : ''}
  
  <!-- Council Info -->
  <div class="council-info">
    <div class="council-info-title">Información del Concilio</div>
    <div style="border-left: 3px solid #b45309; padding: 8px 12px; background: #fffbeb; margin-bottom: 10px; font-size: 11px; color: #92400e; font-weight: 600;">
      NOTA: El 10% de diezmos para el concilio se calcula y envía ANUALMENTE, no mensualmente.
    </div>
    <div class="council-info-row">
      <span>Diezmos del Mes:</span>
      <span style="font-family:'Courier New',monospace; font-weight:700;">RD$ ${data.summary.totalTithes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
    </div>
    <div class="council-info-row">
      <span>Porcentaje Anual del Concilio:</span>
      <span style="font-weight:700;">10% (sobre total anual)</span>
    </div>
    <div class="council-info-note">
      Para ver el cálculo del 10% anual, genere el "Reporte Anual del Concilio" al finalizar el año.
    </div>
  </div>
  
  <!-- Expense Breakdown -->
  <div class="section">
    <div class="section-title">Detalle de Gastos</div>
    <table class="table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Categoría</th>
          <th>Cantidad</th>
          <th style="text-align:right;">Monto Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.expenseByCategory.map(cat => `
          <tr>
            <td style="font-weight: 600; color: #dc2626;">${cat.code}</td>
            <td>${cat.name}</td>
            <td>${cat.count} transacciones</td>
            <td class="amount expense-amount">RD$ ${cat.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">TOTAL GASTOS:</td>
          <td class="amount expense-amount">RD$ ${data.summary.totalExpense.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Balance -->
  <div class="section">
    <div class="section-title">Balance Final del Mes</div>
    <table class="table balance-table">
      <tbody>
        <tr>
          <td style="font-weight:600;">Total Ingresos:</td>
          <td class="amount income-amount">RD$ ${data.summary.totalIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Menos: Total Gastos:</td>
          <td class="amount expense-amount">RD$ ${data.summary.totalExpense.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr class="balance-total">
          <td>BALANCE NETO DEL MES:</td>
          <td class="amount">RD$ ${data.summary.netBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
    <div class="balance-note">
      <strong>Nota:</strong> Este balance NO incluye la deducción del 10% para el concilio, ya que se calcula y envía anualmente.
    </div>
  </div>
  
  <!-- Signatures -->
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">Pastor</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Tesorero/a</div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <span>Generado por: ${data.generatedBy}</span>
      <span>Fecha: ${format(data.generatedAt, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</span>
    </div>
    <div class="disclaimer">
      Este documento es un reporte financiero oficial generado por el Sistema de Gestión de Iglesias.
      Los valores presentados corresponden a las transacciones registradas y aprobadas durante el período indicado.
    </div>
  </div>
  
</body>
</html>
  `

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  
  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="width: 100%; text-align: center; font-size: 9px; color: #64748b; font-family: 'Segoe UI', sans-serif;">
        <span style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 4px 16px; border-radius: 12px; border: 1px solid #e2e8f0;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '50px',
      left: '20px',
    },
  })

  await browser.close()
  return Buffer.from(pdfBuffer)
}

// ======================== REPORTE ANUAL DEL CONCILIO ========================

interface AnnualCouncilReportData {
  church: {
    name: string
    logoUrl?: string
    location?: string
    phone?: string
  }
  year: number
  monthlyBreakdown: Array<{
    month: string
    monthNumber: number
    total: number
    count: number
  }>
  tithesDetails?: Array<{
    date: Date
    personName: string
    amount: number
    councilAmount: number
    councilPercentage: number
    churchAmount: number
    churchPercentage: number
  }>
  summary: {
    totalTithesYear: number
    councilAmount: number
    councilPercentage: number
    churchRetention: number
    churchPercentage: number
    transactionCount: number
  }
  generatedBy: string
  generatedAt: Date
}

export async function generateAnnualCouncilReportPDF(data: AnnualCouncilReportData): Promise<Buffer> {
  const logoUrl = data.church.logoUrl 
    ? (data.church.logoUrl.startsWith('http') ? data.church.logoUrl : `https://sotware-iglesias-backend.onrender.com${data.church.logoUrl}`)
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 30px 35px;
      background: #ffffff;
      color: #1a1a2e;
      line-height: 1.5;
      font-size: 12px;
    }
    
    /* ---- HEADER ---- */
    .header {
      display: flex;
      align-items: center;
      padding-bottom: 18px;
      border-bottom: 3px solid #0f2b46;
      margin-bottom: 5px;
    }
    .logo-container {
      width: 75px;
      height: 75px;
      margin-right: 18px;
      flex-shrink: 0;
    }
    .logo {
      width: 75px;
      height: 75px;
      object-fit: contain;
      border-radius: 6px;
    }
    .header-text { flex: 1; }
    .church-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f2b46;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .church-address {
      font-size: 11px;
      color: #4a5568;
      line-height: 1.5;
    }
    .church-phone {
      font-size: 11px;
      color: #4a5568;
      margin-top: 2px;
    }
    
    /* ---- TITLE BAR ---- */
    .title-bar {
      background: #0f2b46;
      color: #ffffff;
      text-align: center;
      padding: 14px 20px;
      margin-bottom: 22px;
    }
    .title-bar h1 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin-bottom: 3px;
    }
    .title-bar p {
      font-size: 13px;
      font-weight: 400;
      opacity: 0.9;
    }
    
    /* ---- INFO BOX ---- */
    .info-box {
      background: #f0f4f8;
      border-left: 4px solid #0f2b46;
      padding: 14px 16px;
      margin-bottom: 22px;
      font-size: 12px;
      color: #1a1a2e;
      line-height: 1.6;
    }
    .info-box strong { color: #0f2b46; }
    
    /* ---- HIGHLIGHT BOX ---- */
    .council-highlight {
      border: 2px solid #0f2b46;
      border-radius: 6px;
      padding: 22px;
      margin: 22px 0;
      background: #f8fafc;
      page-break-inside: avoid;
    }
    .council-highlight h2 {
      font-size: 16px;
      font-weight: 700;
      color: #0f2b46;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 18px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .amounts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    .amount-card {
      border: 2px solid #d1d5db;
      border-radius: 6px;
      padding: 14px;
      text-align: center;
    }
    .amount-card.total { border-color: #16a34a; background: #f0fdf4; }
    .amount-card.council { border-color: #0f2b46; background: #eff6ff; }
    .amount-card .label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .amount-card .value {
      font-size: 24px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
    }
    .amount-card.total .value { color: #16a34a; }
    .amount-card.council .value { color: #0f2b46; }
    .amount-card .pct {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
      font-weight: 600;
    }
    .retention-bar {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .retention-bar .label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
    .retention-bar .value {
      font-size: 20px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
      color: #16a34a;
    }
    
    /* ---- SECTIONS ---- */
    .section { margin: 20px 0; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f2b46;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 8px 12px;
      background: #e8edf2;
      border-left: 4px solid #0f2b46;
      margin-bottom: 10px;
    }
    
    /* ---- TABLES ---- */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 11px;
    }
    table th {
      background: #0f2b46;
      color: #ffffff;
      font-weight: 600;
      padding: 10px 12px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table td {
      padding: 9px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    table tr:nth-child(even) td { background: #f9fafb; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .text-green { color: #16a34a; }
    .text-amber { color: #b45309; }
    tfoot td {
      background: #e8edf2 !important;
      font-weight: 700;
      font-size: 12px;
      border-top: 2px solid #0f2b46;
      padding: 10px 12px;
    }
    
    /* ---- SIGNATURES ---- */
    .signature-section {
      display: flex;
      justify-content: space-around;
      margin: 45px 0 20px;
    }
    .signature-box { text-align: center; width: 220px; }
    .signature-line {
      border-top: 2px solid #1a1a2e;
      margin-top: 55px;
      padding-top: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #1a1a2e;
    }
    
    /* ---- FOOTER ---- */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #d1d5db;
      font-size: 10px;
      color: #6b7280;
    }
    .disclaimer {
      background: #f9fafb;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-size: 9px;
      color: #6b7280;
      text-align: center;
      margin-top: 10px;
      font-style: italic;
    }
    
    @media print {
      body { padding: 20px; }
      .council-highlight, table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${logoUrl ? `<div class="logo-container"><img src="${logoUrl}" class="logo" alt="Logo" onerror="this.parentElement.style.display='none'"></div>` : ''}
    <div class="header-text">
      <div class="church-name">${data.church.name.toUpperCase()}</div>
      <div class="church-address">
        ${data.church.location ? data.church.location : ''}
      </div>
      ${data.church.phone ? `<div class="church-phone">Tel: ${data.church.phone}</div>` : ''}
    </div>
  </div>

  <!-- Title -->
  <div class="title-bar">
    <h1>REPORTE ANUAL DEL CONCILIO</h1>
    <p>Año Fiscal ${data.year}</p>
  </div>

  <!-- Info -->
  <div class="info-box">
    Este documento contiene el cálculo anual del <strong>10% de los diezmos</strong> que se envía al concilio de la organización. 
    Los valores presentados corresponden a todas las transacciones de diezmos aprobadas durante el año ${data.year}.
  </div>

  <!-- Council Highlight -->
  <div class="council-highlight">
    <h2>Total a Remitir al Concilio — Año ${data.year}</h2>
    <div class="amounts-grid">
      <div class="amount-card total">
        <div class="label">Total Diezmos del Año</div>
        <div class="value">RD$ ${data.summary.totalTithesYear.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="pct">100% de los diezmos recibidos</div>
      </div>
      <div class="amount-card council">
        <div class="label">Monto para el Concilio</div>
        <div class="value">RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="pct">10% del total anual</div>
      </div>
    </div>
    <div class="retention-bar">
      <div class="label">La iglesia local retiene el 90% restante:</div>
      <div class="value">RD$ ${data.summary.churchRetention.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </div>
  </div>

  <!-- Monthly Breakdown -->
  <div class="section">
    <div class="section-title">Desglose Mensual de Diezmos</div>
    <table>
      <thead>
        <tr>
          <th>Mes</th>
          <th class="text-center">Transacciones</th>
          <th class="text-right">Monto Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.monthlyBreakdown.map(month => `
          <tr>
            <td class="font-bold" style="text-transform:capitalize;">${month.month}</td>
            <td class="text-center">${month.count}</td>
            <td class="text-right text-green font-bold" style="font-family:'Courier New',monospace;">RD$ ${month.total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td>TOTAL ANUAL</td>
          <td class="text-center">${data.summary.transactionCount}</td>
          <td class="text-right" style="font-family:'Courier New',monospace;">RD$ ${data.summary.totalTithesYear.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Individual Tithes -->
  ${data.tithesDetails && data.tithesDetails.length > 0 ? `
  <div class="section" style="page-break-before: always;">
    <div class="section-title">Desglose Detallado de Cada Diezmo</div>
    <p style="font-size: 11px; color: #6b7280; margin-bottom: 12px;">
      Listado de cada diezmo individual registrado durante el año ${data.year}, con el cálculo del 10% para el concilio y el 90% que permanece en la iglesia local.
    </p>
    <table style="font-size: 10px;">
      <thead>
        <tr>
          <th style="width:12%;">Fecha</th>
          <th style="width:28%;">Diezmador</th>
          <th class="text-right" style="width:20%;">Diezmo Total</th>
          <th class="text-right" style="width:20%;">10% Concilio</th>
          <th class="text-right" style="width:20%;">90% Iglesia</th>
        </tr>
      </thead>
      <tbody>
        ${data.tithesDetails.map((tithe, index) => `
          <tr>
            <td style="font-size:10px;">${format(new Date(tithe.date), 'dd/MM/yyyy', { locale: es })}</td>
            <td>${tithe.personName}</td>
            <td class="text-right font-bold text-green" style="font-family:'Courier New',monospace;">RD$ ${tithe.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            <td class="text-right font-bold text-amber" style="font-family:'Courier New',monospace;">RD$ ${tithe.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            <td class="text-right text-green" style="font-family:'Courier New',monospace;">RD$ ${tithe.churchAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot style="background: #fffbeb;">
        <tr>
          <td colspan="2" style="color:#92400e;">TOTALES DEL AÑO ${data.year}:</td>
          <td class="text-right text-green" style="font-family:'Courier New',monospace;">RD$ ${data.summary.totalTithesYear.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          <td class="text-right text-amber" style="font-family:'Courier New',monospace;">RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          <td class="text-right text-green" style="font-family:'Courier New',monospace;">RD$ ${data.summary.churchRetention.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tfoot>
    </table>
    <div style="background:#fffbeb; border-left:3px solid #b45309; padding:10px 14px; margin-top:12px; font-size:11px; color:#92400e;">
      <strong>Total de ${data.summary.transactionCount} diezmos registrados.</strong>
      Monto total a remitir al concilio: <strong style="font-size:13px;">RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>
    </div>
  </div>
  ` : ''}

  <!-- Distribution Summary -->
  <div class="section">
    <div class="section-title">Distribución de Diezmos</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
      <div style="background:#eff6ff; border:2px solid #0f2b46; border-radius:6px; padding:16px; text-align:center;">
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#6b7280; margin-bottom:6px; font-weight:700;">Para el Concilio</div>
        <div style="font-size:22px; font-weight:800; font-family:'Courier New',monospace; color:#0f2b46;">RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div style="font-size:12px; color:#6b7280; margin-top:4px; font-weight:600;">${data.summary.councilPercentage}% del total</div>
      </div>
      <div style="background:#f0fdf4; border:2px solid #16a34a; border-radius:6px; padding:16px; text-align:center;">
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#6b7280; margin-bottom:6px; font-weight:700;">Retención Iglesia</div>
        <div style="font-size:22px; font-weight:800; font-family:'Courier New',monospace; color:#16a34a;">RD$ ${data.summary.churchRetention.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div style="font-size:12px; color:#6b7280; margin-top:4px; font-weight:600;">${data.summary.churchPercentage}% del total</div>
      </div>
    </div>
  </div>

  <!-- Period Summary -->
  <div class="section">
    <div class="section-title">Resumen del Período</div>
    <table>
      <tbody>
        <tr>
          <td class="font-bold">Período Evaluado</td>
          <td class="text-right">1 de enero — 31 de diciembre ${data.year}</td>
        </tr>
        <tr>
          <td class="font-bold">Total de Transacciones</td>
          <td class="text-right">${data.summary.transactionCount} registros</td>
        </tr>
        <tr>
          <td class="font-bold">Total de Diezmos Recibidos</td>
          <td class="text-right text-green font-bold" style="font-family:'Courier New',monospace;">RD$ ${data.summary.totalTithesYear.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr style="background:#fffbeb !important;">
          <td class="font-bold" style="color:#92400e;">Monto a Enviar al Concilio (10%)</td>
          <td class="text-right font-bold" style="color:#92400e; font-family:'Courier New',monospace;">RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Signatures -->
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">Pastor</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Tesorero/a</div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <span>Generado por: ${data.generatedBy}</span>
      <span>Fecha: ${format(data.generatedAt, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</span>
    </div>
    <div class="disclaimer">
      Este documento es un reporte financiero oficial generado por el Sistema de Gestión de Iglesias.
      Los valores corresponden a las transacciones de diezmos registradas y aprobadas durante el año ${data.year}.
    </div>
  </div>
  
</body>
</html>
  `

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  
  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="width: 100%; text-align: center; font-size: 9px; color: #64748b; font-family: 'Segoe UI', sans-serif;">
        <span style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 4px 16px; border-radius: 12px; border: 1px solid #e2e8f0;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '50px',
      left: '20px',
    },
  })

  await browser.close()
  return Buffer.from(pdfBuffer)
}
