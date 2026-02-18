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
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 35px;
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      color: #1e293b;
      line-height: 1.7;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 25px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
    }
    
    .header-content {
      flex: 1;
    }
    
    .church-name {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    .church-details {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.6;
      font-weight: 500;
    }
    
    .logo {
      width: 90px;
      height: 90px;
      object-fit: contain;
      border-radius: 12px;
      background: white;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .report-title {
      text-align: center;
      margin: 25px 0 30px;
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      color: white;
      padding: 28px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
    }
    
    .report-title h1 {
      font-size: 26px;
      margin-bottom: 8px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .report-title .period {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    
    .section {
      margin: 25px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 16px 20px;
      border-left: 5px solid #6366f1;
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 18px;
      color: #1e293b;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 20px;
      font-size: 12px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .table th {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      font-weight: 700;
      padding: 14px 12px;
      text-align: left;
      border: none;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .table td {
      padding: 14px 12px;
      border-bottom: 1px solid #e2e8f0;
      background: white;
    }
    
    .table tr:nth-child(even) td {
      background: #f8fafc;
    }
    
    .table tr:hover td {
      background: #f1f5f9;
    }
    
    .table tr:last-child td {
      border-bottom: none;
    }
    
    .amount {
      text-align: right;
      font-family: 'Courier New', 'SF Mono', Monaco, monospace;
      font-weight: 700;
      font-size: 13px;
    }
    
    .income-amount {
      color: #10b981;
      text-shadow: 0 1px 2px rgba(16, 185, 129, 0.1);
    }
    
    .expense-amount {
      color: #ef4444;
      text-shadow: 0 1px 2px rgba(239, 68, 68, 0.1);
    }
    
    .council-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
      border: 3px solid #f59e0b;
      border-radius: 16px;
      padding: 24px;
      margin: 30px 0;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
    }
    
    .council-box-title {
      font-size: 18px;
      font-weight: 800;
      color: #92400e;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      letter-spacing: -0.3px;
    }
    
    .council-box-title::before {
      content: '🏛️';
      margin-right: 10px;
      font-size: 24px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    .council-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
      color: #78350f;
      font-weight: 600;
    }
    
    .council-row.highlight {
      font-size: 17px;
      font-weight: 800;
      color: #92400e;
      padding-top: 15px;
      margin-top: 15px;
      border-top: 2px dashed #f59e0b;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    
    .summary-card {
      background: white;
      border: 3px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }
    
    .summary-card.income {
      border-color: #10b981;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    }
    
    .summary-card.expense {
      border-color: #ef4444;
      background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
    }
    
    .summary-card.balance {
      border-color: #6366f1;
      background: linear-gradient(135deg, #eef2ff 0%, #ddd6fe 100%);
    }
    
    .summary-card-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 8px;
      font-weight: 700;
      letter-spacing: 0.8px;
    }
    
    .summary-card-value {
      font-size: 28px;
      font-weight: 900;
      font-family: 'Courier New', monospace;
      letter-spacing: -1px;
    }
    
    .summary-card.income .summary-card-value {
      color: #059669;
      text-shadow: 0 2px 4px rgba(5, 150, 105, 0.15);
    }
    
    .summary-card.expense .summary-card-value {
      color: #dc2626;
      text-shadow: 0 2px 4px rgba(220, 38, 38, 0.15);
    }
    
    .summary-card.balance .summary-card-value {
      color: #4f46e5;
      text-shadow: 0 2px 4px rgba(79, 70, 229, 0.15);
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 25px;
      border-top: 3px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-around;
      margin: 50px 0 25px;
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
    }
    
    .signature-box {
      text-align: center;
      width: 240px;
    }
    
    .signature-line {
      border-top: 2px solid #334155;
      margin-top: 60px;
      padding-top: 10px;
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .disclaimer {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      padding: 16px;
      border-radius: 10px;
      font-size: 10px;
      color: #475569;
      text-align: center;
      margin-top: 25px;
      border: 2px solid #cbd5e1;
      font-weight: 500;
    }
    
    .page-number {
      position: fixed;
      bottom: 25px;
      right: 40px;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      background: white;
      padding: 6px 12px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    
    @media print {
      body {
        padding: 20px;
        background: white;
      }
      .summary-card, .council-box, .table {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-content">
      <div class="church-name">${data.church.name}</div>
      <div class="church-details">
        ${data.church.location || ''}<br>
        ${data.church.phone || ''}
      </div>
    </div>
    ${data.church.logoUrl ? `<img src="${data.church.logoUrl}" class="logo" alt="Logo">` : ''}
  </div>
  
  <!-- Report Title -->
  <div class="report-title">
    <h1>REPORTE FINANCIERO MENSUAL</h1>
    <div class="period">${data.period.month} ${data.period.year}</div>
  </div>
  
  <!-- Summary Cards -->
  <div class="summary-grid">
    <div class="summary-card income">
      <div class="summary-card-label">Total Ingresos</div>
      <div class="summary-card-value">RD$ ${data.summary.totalIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="summary-card expense">
      <div class="summary-card-label">Total Gastos</div>
      <div class="summary-card-value">RD$ ${data.summary.totalExpense.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
    </div>
  </div>
  
  <!-- Income Breakdown -->
  <div class="section">
    <div class="section-title">📊 Detalle de Ingresos</div>
    <table class="table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Categoría</th>
          <th>Cantidad</th>
          <th>Monto Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.incomeByCategory.map(cat => `
          <tr>
            <td style="font-weight: 600; color: #6366f1;">${cat.code}</td>
            <td>${cat.name}</td>
            <td>${cat.count} transacciones</td>
            <td class="amount income-amount">RD$ ${cat.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
        <tr style="background: #f9fafb; font-weight: bold;">
          <td colspan="3" style="text-align: right; padding-right: 15px;">TOTAL INGRESOS:</td>
          <td class="amount income-amount" style="font-size: 13px;">RD$ ${data.summary.totalIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- DESGLOSE DETALLADO DE DIEZMOS Y 10% CONCILIO -->
  ${data.tithesDetails && data.tithesDetails.length > 0 ? `
  <div class="section" style="page-break-inside: avoid;">
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 25px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #92400e; font-size: 20px; margin-bottom: 8px;">🏛️ DESGLOSE DE DIEZMOS - 10% PARA EL CONCILIO</h2>
        <p style="font-size: 13px; color: #92400e; margin: 0;">
          Cada diezmo que ingresa a la iglesia se divide: <strong>10% al Concilio + 90% a la Iglesia Local</strong>
        </p>
      </div>

      <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f59e0b; color: white;">
              <th style="padding: 12px; text-align: left; border-radius: 6px 0 0 0;">Fecha</th>
              <th style="padding: 12px; text-align: left;">Diezmador</th>
              <th style="padding: 12px; text-align: right;">Diezmo Total</th>
              <th style="padding: 12px; text-align: right; background: #d97706;">🏛️ 10% Concilio</th>
              <th style="padding: 12px; text-align: right; border-radius: 0 6px 0 0;">⛪ 90% Iglesia</th>
            </tr>
          </thead>
          <tbody>
            ${data.tithesDetails.map((tithe, index) => `
              <tr style="background: ${index % 2 === 0 ? '#fff' : '#fef3c7'}; border-bottom: 1px solid #fde68a;">
                <td style="padding: 10px; font-size: 11px;">${format(new Date(tithe.date), 'dd/MM/yyyy', { locale: es })}</td>
                <td style="padding: 10px; font-weight: 500;">${tithe.personName}</td>
                <td style="padding: 10px; text-align: right; font-family: 'Courier New', monospace; font-weight: 600; color: #059669;">RD$ ${tithe.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                <td style="padding: 10px; text-align: right; font-family: 'Courier New', monospace; font-weight: 700; color: #d97706; background: #fef3c7;">RD$ ${tithe.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                <td style="padding: 10px; text-align: right; font-family: 'Courier New', monospace; color: #059669;">RD$ ${tithe.churchAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
            <tr style="background: #92400e; color: white; font-weight: bold; font-size: 14px;">
              <td colspan="2" style="padding: 15px; text-align: right;">TOTAL DIEZMOS DEL MES:</td>
              <td style="padding: 15px; text-align: right; font-family: 'Courier New', monospace;">RD$ ${data.summary.totalTithes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
              <td style="padding: 15px; text-align: right; font-family: 'Courier New', monospace; background: #d97706;">RD$ ${data.summary.councilDeduction.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
              <td style="padding: 15px; text-align: right; font-family: 'Courier New', monospace;">RD$ ${(data.summary.totalTithes - data.summary.councilDeduction).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="background: #dc2626; color: white; border-radius: 8px; padding: 18px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="font-size: 13px; margin-bottom: 8px; opacity: 0.95;">💰 ACUMULADO MENSUAL PARA EL CONCILIO</div>
        <div style="font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; margin-bottom: 5px;">
          RD$ ${data.summary.councilDeduction.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
        </div>
        <div style="font-size: 12px; padding: 10px; background: rgba(255,255,255,0.15); border-radius: 6px; margin-top: 12px;">
          📋 Este monto se acumula mes a mes y se remite al concilio <strong>AL FINALIZAR EL AÑO FISCAL</strong>
        </div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <!-- Council Information Box (ANNUAL, not monthly) -->
  <div class="council-box">
    <div class="council-box-title">⚠️ Información del Concilio</div>
    <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
      <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 600;">
        📌 NOTA IMPORTANTE: El 10% de diezmos para el concilio se calcula y envía ANUALMENTE, no mensualmente.
      </p>
    </div>
    <div class="council-row">
      <span>Diezmos del Mes:</span>
      <span style="font-family: 'Courier New', monospace; font-weight: 600;">RD$ ${data.summary.totalTithes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
    </div>
    <div class="council-row">
      <span>Porcentaje Anual del Concilio:</span>
      <span style="font-weight: 600;">10% (sobre total anual)</span>
    </div>
    <div class="council-row" style="background: #f3f4f6; padding: 10px; border-radius: 6px; margin-top: 10px;">
      <span style="font-size: 11px; color: #6b7280;">
        💡 Para ver el cálculo del 10% anual, genere el "Reporte Anual del Concilio" al finalizar el año fiscal.
      </span>
    </div>
  </div>
  
  <!-- Expense Breakdown -->
  <div class="section">
    <div class="section-title">💸 Detalle de Gastos</div>
    <table class="table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Categoría</th>
          <th>Cantidad</th>
          <th>Monto Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.expenseByCategory.map(cat => `
          <tr>
            <td style="font-weight: 600; color: #ef4444;">${cat.code}</td>
            <td>${cat.name}</td>
            <td>${cat.count} transacciones</td>
            <td class="amount expense-amount">RD$ ${cat.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
        <tr style="background: #f9fafb; font-weight: bold;">
          <td colspan="3" style="text-align: right; padding-right: 15px;">TOTAL GASTOS:</td>
          <td class="amount expense-amount" style="font-size: 13px;">RD$ ${data.summary.totalExpense.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Final Balance -->
  <div class="section">
    <div class="section-title">💰 Balance Final del Mes</div>
    <table class="table">
      <tbody>
        <tr>
          <td style="font-weight: 600;">Total Ingresos:</td>
          <td class="amount income-amount">RD$ ${data.summary.totalIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Menos: Total Gastos:</td>
          <td class="amount expense-amount">RD$ ${data.summary.totalExpense.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr style="background: #eef2ff; font-size: 14px; font-weight: bold;">
          <td style="padding: 15px; color: #6366f1;">BALANCE NETO DEL MES:</td>
          <td class="amount" style="padding: 15px; color: #6366f1; font-size: 16px;">RD$ ${data.summary.netBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; margin-top: 15px; border-radius: 6px;">
      <p style="margin: 0; font-size: 11px; color: #0c4a6e;">
        <strong>Nota:</strong> Este balance NO incluye la deducción del 10% para el concilio, ya que esta se calcula y envía anualmente.
      </p>
    </div>
  </div>
  
  <!-- Signature Section -->
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">Pastor / Tesorero</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Secretario</div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <span>Generado por: ${data.generatedBy}</span>
      <span>Fecha: ${format(data.generatedAt, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</span>
    </div>
    <div class="disclaimer">
      Este documento es un reporte financiero oficial generado por el Sistema de Gestión de Iglesias.
      Los valores presentados corresponden a las transacciones registradas y aprobadas durante el período indicado.
    </div>
  </div>
  
  <div class="page-number">Página 1</div>
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
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
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
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.6;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header-content {
      flex: 1;
    }
    
    .church-name {
      font-size: 24px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 5px;
    }
    
    .church-details {
      font-size: 11px;
      color: #666;
      line-height: 1.4;
    }
    
    .logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
    }
    
    .report-title {
      text-align: center;
      margin: 30px 0;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
    }
    
    .report-title h1 {
      font-size: 28px;
      margin-bottom: 5px;
    }
    
    .report-title p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .section {
      margin-bottom: 35px;
    }
    
    .section-title {
      font-size: 18px;
      color: #6366f1;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
    }
    
    .council-highlight {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .council-highlight h2 {
      font-size: 22px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .council-amounts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }
    
    .amount-box {
      background: rgba(255, 255, 255, 0.15);
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .amount-box .label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    
    .amount-box .value {
      font-size: 26px;
      font-weight: bold;
    }
    
    .amount-box .percentage {
      font-size: 16px;
      opacity: 0.85;
      margin-top: 5px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    thead {
      background: #f9fafb;
    }
    
    th {
      padding: 14px 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    tbody tr {
      border-bottom: 1px solid #f3f4f6;
    }
    
    tbody tr:hover {
      background: #f9fafb;
    }
    
    tbody tr:last-child {
      border-bottom: none;
    }
    
    td {
      padding: 14px 12px;
      color: #1f2937;
      font-size: 13px;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .font-bold {
      font-weight: 600;
    }
    
    .text-green {
      color: #059669;
    }
    
    tfoot {
      background: #f9fafb;
      font-weight: bold;
    }
    
    tfoot td {
      padding: 16px 12px;
      font-size: 14px;
      border-top: 2px solid #d1d5db;
    }
    
    .info-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      margin: 20px 0;
      border-radius: 6px;
    }
    
    .info-box .title {
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .info-box .content {
      color: #1e3a8a;
      font-size: 13px;
      line-height: 1.6;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-around;
      margin-top: 60px;
      margin-bottom: 40px;
    }
    
    .signature-box {
      text-align: center;
      width: 200px;
    }
    
    .signature-line {
      border-top: 2px solid #333;
      padding-top: 8px;
      margin-top: 60px;
      font-size: 12px;
      color: #666;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      font-size: 11px;
      color: #6b7280;
    }
    
    .disclaimer {
      margin-top: 10px;
      font-style: italic;
      text-align: center;
    }
    
    .page-number {
      position: fixed;
      bottom: 20px;
      right: 40px;
      font-size: 10px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <!-- Header with Logo -->
  <div class="header">
    <div class="header-content">
      <div class="church-name">${data.church.name}</div>
      <div class="church-details">
        ${data.church.location ? `📍 ${data.church.location}<br>` : ''}
        ${data.church.phone ? `📞 ${data.church.phone}` : ''}
      </div>
    </div>
    ${data.church.logoUrl ? `<img src="${data.church.logoUrl}" alt="Logo" class="logo" />` : ''}
  </div>

  <!-- Title -->
  <div class="report-title">
    <h1>📊 REPORTE ANUAL DEL CONCILIO</h1>
    <p>Año Fiscal ${data.year}</p>
  </div>

  <!-- Info Box -->
  <div class="info-box">
    <div class="title">ℹ️ Acerca de este Reporte</div>
    <div class="content">
      Este documento contiene el cálculo anual del <strong>10% de los diezmos</strong> que se envía al concilio de la organización. 
      Los valores presentados corresponden a todas las transacciones de diezmos aprobadas durante el año ${data.year}.
    </div>
  </div>

  <!-- RESUMEN DESTACADO DEL CONCILIO -->
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 35px; border-radius: 15px; margin: 30px 0; box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3); page-break-inside: avoid;">
    <div style="text-align: center; margin-bottom: 25px;">
      <h2 style="font-size: 28px; margin: 0 0 10px 0;">🏛️ TOTAL A REMITIR AL CONCILIO</h2>
      <p style="font-size: 14px; opacity: 0.95; margin: 0;">Correspondiente al Año Fiscal ${data.year}</p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
      <div style="background: rgba(255, 255, 255, 0.15); padding: 20px; border-radius: 12px; text-align: center; border: 2px solid rgba(255, 255, 255, 0.3);">
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 10px;">💚 Total de Diezmos del Año</div>
        <div style="font-size: 28px; font-weight: bold; font-family: 'Courier New', monospace;">
          RD$ ${data.summary.totalTithesYear.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style="font-size: 13px; opacity: 0.85; margin-top: 8px;">100% de los diezmos recibidos</div>
      </div>
      
      <div style="background: rgba(255, 255, 255, 0.25); padding: 20px; border-radius: 12px; text-align: center; border: 3px solid white; box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">
        <div style="font-size: 13px; margin-bottom: 10px;">💰 MONTO PARA EL CONCILIO</div>
        <div style="font-size: 36px; font-weight: bold; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
          RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style="font-size: 15px; margin-top: 8px; font-weight: 600;">10% del total anual</div>
      </div>
    </div>
    
    <div style="background: rgba(255, 255, 255, 0.15); padding: 18px; border-radius: 10px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.3);">
      <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">⛪ La iglesia local retiene el 90% restante:</div>
      <div style="font-size: 24px; font-weight: bold; font-family: 'Courier New', monospace;">
        RD$ ${data.summary.churchRetention.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  </div>

  <!-- Monthly Breakdown -->
  <div class="section">
    <div class="section-title">📅 Desglose Mensual de Diezmos</div>
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
            <td class="font-bold">${month.month}</td>
            <td class="text-center">${month.count}</td>
            <td class="text-right text-green font-bold">RD$ ${month.total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td>TOTAL ANUAL</td>
          <td class="text-center">${data.summary.transactionCount}</td>
          <td class="text-right">RD$ ${data.summary.totalTithesYear.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Individual Tithes Breakdown -->
  ${data.tithesDetails && data.tithesDetails.length > 0 ? `
  <div class="section" style="page-break-before: always;">
    <div class="section-title">💚 Desglose Detallado de Cada Diezmo</div>
    <p style="font-size: 12px; color: #6b7280; margin-bottom: 15px;">
      Este listado muestra cada diezmo individual registrado durante el año ${data.year}, 
      con el cálculo del 10% para el concilio y el 90% que permanece en la iglesia local.
    </p>
    <table style="font-size: 11px;">
      <thead>
        <tr>
          <th style="width: 12%;">Fecha</th>
          <th style="width: 28%;">Diezmador</th>
          <th class="text-right" style="width: 20%;">Diezmo Total</th>
          <th class="text-right" style="width: 20%;">10% Concilio</th>
          <th class="text-right" style="width: 20%;">90% Iglesia</th>
        </tr>
      </thead>
      <tbody>
        ${data.tithesDetails.map((tithe, index) => `
          <tr ${index % 2 === 0 ? 'style="background: #f9fafb;"' : ''}>
            <td style="padding: 8px 12px; font-size: 11px;">${format(new Date(tithe.date), 'dd/MM/yyyy', { locale: es })}</td>
            <td style="padding: 8px 12px;">${tithe.personName}</td>
            <td class="text-right font-bold" style="color: #059669; padding: 8px 12px;">RD$ ${tithe.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            <td class="text-right font-bold" style="color: #d97706; padding: 8px 12px;">RD$ ${tithe.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
            <td class="text-right" style="color: #059669; padding: 8px 12px;">RD$ ${tithe.churchAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot style="background: #fef3c7;">
        <tr>
          <td colspan="2" style="padding: 12px; font-weight: bold; color: #92400e;">TOTALES DEL AÑO ${data.year}:</td>
          <td class="text-right" style="padding: 12px; font-weight: bold; color: #059669; font-size: 14px;">RD$ ${data.summary.totalTithesYear.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          <td class="text-right" style="padding: 12px; font-weight: bold; color: #d97706; font-size: 14px;">RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          <td class="text-right" style="padding: 12px; font-weight: bold; color: #059669; font-size: 14px;">RD$ ${data.summary.churchRetention.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tfoot>
    </table>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 6px;">
      <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 600;">
        📊 <strong>Total de ${data.summary.transactionCount} diezmos registrados.</strong><br>
        💰 Monto total a remitir al concilio: <span style="font-size: 14px; color: #d97706;">RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
      </p>
    </div>
  </div>
  ` : ''}

  <!-- Council Amount Highlight -->
  <div class="council-highlight">
    <h2>💰 Distribución de Diezmos</h2>
    <div class="council-amounts">
      <div class="amount-box">
        <div class="label">Para el Concilio</div>
        <div class="value">RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="percentage">${data.summary.councilPercentage}% del total</div>
      </div>
      <div class="amount-box">
        <div class="label">Retención de la Iglesia</div>
        <div class="value">RD$ ${data.summary.churchRetention.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="percentage">${data.summary.churchPercentage}% del total</div>
      </div>
    </div>
  </div>

  <!-- Summary Section -->
  <div class="section">
    <div class="section-title">📋 Resumen del Período</div>
    <table>
      <tbody>
        <tr>
          <td class="font-bold">Período Evaluado</td>
          <td class="text-right">1 de enero - 31 de diciembre ${data.year}</td>
        </tr>
        <tr>
          <td class="font-bold">Total de Transacciones</td>
          <td class="text-right">${data.summary.transactionCount} registros</td>
        </tr>
        <tr>
          <td class="font-bold">Total de Diezmos Recibidos</td>
          <td class="text-right text-green font-bold">RD$ ${data.summary.totalTithesYear.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr style="background: #fef3c7;">
          <td class="font-bold" style="color: #92400e;">Monto a Enviar al Concilio (10%)</td>
          <td class="text-right font-bold" style="color: #92400e;">RD$ ${data.summary.councilAmount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Signature Section -->
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">Pastor / Tesorero</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Secretario</div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <span>Generado por: ${data.generatedBy}</span>
      <span>Fecha: ${format(data.generatedAt, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</span>
    </div>
    <div class="disclaimer">
      Este documento es un reporte financiero oficial generado por el Sistema de Gestión de Iglesias.
      Los valores corresponden a las transacciones de diezmos registradas y aprobadas durante el año ${data.year}.
    </div>
  </div>
  
  <div class="page-number">Página 1</div>
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
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px',
    },
  })

  await browser.close()
  return Buffer.from(pdfBuffer)
}
