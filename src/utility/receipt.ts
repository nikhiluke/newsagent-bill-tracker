import { DistributorProfile, IPayment } from "../types";


// 1. Generate Print-Ready HTML Layout resembling your Receipt Modal
export const generateReceiptHTML = (profile: DistributorProfile, payment: IPayment) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Payment Receipt - ${payment.receiptNumber}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #0f172a;
              background-color: #ffffff;
            }
            .receipt-container {
              max-width: 480px;
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
              font-size: 18px;
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
              background-color: #ecfdf5;
              color: #047857;
              font-size: 10px;
              font-weight: 800;
              padding: 5px 14px;
              border-radius: 9999px;
              letter-spacing: 0.5px;
            }
            .fields-container {
              display: flex;
              flex-direction: column;
              gap: 10px;
              border-bottom: 2px dashed #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .field-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12px;
            }
            .field-label {
              color: #94a3b8;
              font-weight: 700;
            }
            .field-value {
              color: #334155;
              font-weight: 700;
            }
            .field-value-mono {
              font-family: monospace, 'Courier New', Courier;
              font-weight: 700;
              color: #0f172a;
              font-size: 13px;
            }
            .bold {
              font-weight: 900;
              color: #0f172a;
            }
            .method-badge {
              background-color: #f1f5f9;
              color: #475569;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 8px;
              border-radius: 6px;
              text-transform: uppercase;
            }
            .breakdown-box {
              background-color: #f8fafc;
              border: 1px solid #f1f5f9;
              border-radius: 12px;
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 10px;
              margin-bottom: 20px;
            }
            .discount-label {
              color: #047857;
              font-weight: 700;
            }
            .discount-value {
              color: #047857;
              font-weight: 700;
            }
            .late-label {
              color: #ef4444;
              font-weight: 700;
            }
            .late-value {
              color: #ef4444;
              font-weight: 700;
            }
            .net-paid-row {
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
              margin-top: 4px;
            }
            .net-paid-label {
              font-size: 13px;
              font-weight: 900;
              color: #0f172a;
            }
            .net-paid-value {
              font-size: 15px;
              font-weight: 900;
              color: #10b981;
            }
            .balance-label {
              font-size: 11px;
              color: #94a3b8;
            }
            .balance-value {
              font-size: 12px;
              font-weight: 700;
              color: #475569;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
            }
            .thankyou {
              font-size: 12px;
              font-weight: 900;
              color: #334155;
              margin-bottom: 4px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1 class="business-name">${profile.businessName}</h1>
              <p class="subtitle">Distributor Receipt • Mob: ${profile.phone}</p>
              <div class="badge">PAYMENT RECEIPT</div>
            </div>
            
            <div class="fields-container">
              <div class="field-row">
                <span class="field-label">Receipt No:</span>
                <span class="field-value field-value-mono">${payment.receiptNumber}</span>
              </div>
              <div class="field-row">
                <span class="field-label">Date Received:</span>
                <span class="field-value">${payment.paymentDate}</span>
              </div>
              <div class="field-row">
                <span class="field-label">Customer Name:</span>
                <span class="field-value bold">${payment.customerName}</span>
              </div>
              <div class="field-row">
                <span class="field-label">Mobile Phone:</span>
                <span class="field-value">${payment.phone}</span>
              </div>
              <div class="field-row">
                <span class="field-label">For Month:</span>
                <span class="field-value bold">${payment.month} ${payment.year}</span>
              </div>
              <div class="field-row">
                <span class="field-label">Payment Method:</span>
                <span class="field-value">
                  <span class="method-badge">${payment.paymentMode}</span>
                </span>
              </div>
            </div>

            <div class="breakdown-box">
              <div class="field-row">
                <span class="field-label" style="color:#64748b;">Newspaper Bill Amount:</span>
                <span class="field-value">₹${payment.billAmount}</span>
              </div>
              ${payment.discount > 0 ? `
                <div class="field-row">
                  <span class="discount-label">Discount (Granted):</span>
                  <span class="discount-value">-₹${payment.discount}</span>
                </div>
              ` : ''}
              ${payment.lateFee > 0 ? `
                <div class="field-row">
                  <span class="late-label">Late Payment Fee:</span>
                  <span class="late-value">+₹${payment.lateFee}</span>
                </div>
              ` : ''}
              <div class="field-row net-paid-row">
                <span class="net-paid-label">Net Amount Paid:</span>
                <span class="net-paid-value">₹${payment.paidAmount}</span>
              </div>
              <div class="field-row">
                <span class="balance-label">Remaining Balance:</span>
                <span class="balance-value">₹${payment.balance}</span>
              </div>
            </div>

            <div class="footer">
              <p class="thankyou">Thank you for your prompt payment! 🌟</p>
              <p>Computer generated receipt. Seal & Signature not required.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };