import { DistributorProfile } from "../types";

// Generate Print-Ready HTML Layout for Monthly Customer Summary Report
export const generateMonthlyReportHTML = (
  profile: DistributorProfile,
  rows: any[],
  monthSummary: { targetAmount: number; collectedAmount: number; pendingAmount: number },
  summaryMonth: string,
  summaryYear: string | number
) => {
  // Fallbacks in case data is missing
  const businessName = profile?.businessName || 'Distributor';
  const phone = profile?.phone || 'N/A';
  const targetAmount = monthSummary?.targetAmount ?? 0;
  const collectedAmount = monthSummary?.collectedAmount ?? 0;
  const pendingAmount = monthSummary?.pendingAmount ?? 0;
  const safeRows = rows && rows.length > 0 ? rows : [];

  const statusStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'background-color:#ecfdf5;color:#047857;';
    if (s === 'pending' || s === 'unpaid') return 'background-color:#fef2f2;color:#dc2626;';
    if (s === 'partial') return 'background-color:#fffbeb;color:#b45309;';
    return 'background-color:#f1f5f9;color:#475569;';
  };

  const rowsHTML = safeRows.length > 0
    ? safeRows.map((r, idx) => `
        <tr>
          <td class="cell cell-idx">${idx + 1}</td>
          <td class="cell cell-name">${r.name || 'N/A'}</td>
          <td class="cell">${r.phone || 'N/A'}</td>
          <td class="cell">${r.newspaper || 'N/A'}</td>
          <td class="cell cell-right">₹${r.monthlyBill ?? 0}</td>
          <td class="cell cell-right">₹${r.periodBilled ?? 0}</td>
          <td class="cell cell-center">
            <span class="status-badge" style="${statusStyle(r.status)}">${r.status || 'N/A'}</span>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="7" class="cell cell-center" style="color:#94a3b8;padding:20px;">No records found for this period.</td></tr>`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Monthly Report - ${summaryMonth} ${summaryYear}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 30px;
            color: #0f172a;
            background-color: #ffffff;
          }
          .report-container {
            max-width: 900px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .business-name {
            font-size: 20px;
            font-weight: 800;
            text-transform: uppercase;
            margin: 0 0 4px 0;
            color: #0f172a;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
            margin: 0 0 12px 0;
          }
          .badge {
            display: inline-block;
            background-color: #eff6ff;
            color: #1d4ed8;
            font-size: 10px;
            font-weight: 800;
            padding: 5px 14px;
            border-radius: 9999px;
            letter-spacing: 0.5px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748b;
            margin-bottom: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          thead th {
            background-color: #f8fafc;
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 10px 8px;
            border-bottom: 2px solid #e2e8f0;
            text-align: left;
          }
          .th-right { text-align: right; }
          .th-center { text-align: center; }
          .cell {
            font-size: 12px;
            color: #334155;
            padding: 9px 8px;
            border-bottom: 1px solid #f1f5f9;
          }
          .cell-idx { color: #94a3b8; font-weight: 700; }
          .cell-name { font-weight: 700; color: #0f172a; }
          .cell-right { text-align: right; font-family: monospace, 'Courier New', Courier; }
          .cell-center { text-align: center; }
          .status-badge {
            font-size: 10px;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
          }
          .summary-box {
            background-color: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            gap: 16px;
          }
          .summary-item {
            flex: 1;
            text-align: center;
          }
          .summary-label {
            font-size: 10px;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .summary-value {
            font-size: 16px;
            font-weight: 900;
          }
          .value-target { color: #0f172a; }
          .value-collected { color: #10b981; }
          .value-pending { color: #ef4444; }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1 class="business-name">${businessName}</h1>
            <p class="subtitle">Distributor Report • Mob: ${phone}</p>
            <div class="badge">MONTHLY SUMMARY REPORT</div>
          </div>

          <div class="meta-row">
            <span><strong>Period:</strong> ${summaryMonth} ${summaryYear}</span>
            <span><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Newspaper</th>
                <th class="th-right">Rate</th>
                <th class="th-right">Bill</th>
                <th class="th-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-item">
              <div class="summary-label">Total Expected</div>
              <div class="summary-value value-target">₹${targetAmount}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Received</div>
              <div class="summary-value value-collected">₹${collectedAmount}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Outstanding</div>
              <div class="summary-value value-pending">₹${pendingAmount}</div>
            </div>
          </div>

          <div class="footer">
            <p>Computer generated report • ${safeRows.length} customer${safeRows.length !== 1 ? 's' : ''} listed</p>
          </div>
        </div>
      </body>
    </html>
  `;
};