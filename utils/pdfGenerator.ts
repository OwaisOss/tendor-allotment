import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { PattiRecord } from "../types";
import { BuyerReport } from "../types";
import { ProfileService } from "./storage";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Convert name to a filesystem-safe string (spaces/specials → underscore) */
function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

/** Format a date string (YYYY-MM-DD) or Date to DD/MM/YY */
function toDDMMYY(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** Format a date string (YYYY-MM-DD) to DD/MM/YYYY for display */
function toDDMMYYYY(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Share a generated PDF after renaming it to the desired filename.
 *  fileName may contain '/' in the date part (display-friendly);
 *  they are replaced with '-' for the actual on-disk path. */
async function shareWithName(
  htmlContent: string,
  fileName: string
): Promise<boolean> {
  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });

    // '/' is a path separator — use '-' in the actual file path
    const safeFileName = fileName.replace(/\//g, "-");
    const destUri = `${FileSystem.cacheDirectory}${safeFileName}`;
    await FileSystem.copyAsync({ from: uri, to: destUri });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(destUri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: fileName, // shows DD/MM/YY format in the share sheet title
      });
      // cleanup
      await FileSystem.deleteAsync(uri, { idempotent: true });
      await FileSystem.deleteAsync(destUri, { idempotent: true });
      return true;
    } else {
      console.warn("Sharing is not available on this device");
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return false;
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}

// ── Farmer bill ───────────────────────────────────────────────────────────────

/**
 * Generates a PDF bill for a farmer and shares it.
 * File is named: FarmerName-DDMMYY-BillNo.pdf
 */
export async function generateAndShareFarmerBill(
  farmerName: string,
  patti: PattiRecord
): Promise<boolean> {
  const billNo = patti.billNumber ?? patti.id;
  const fileName = `${safeName(farmerName)}-${toDDMMYY(patti.date)}-${billNo}.pdf`;
  const htmlContent = generateBillHTML(farmerName, patti);
  return shareWithName(htmlContent, fileName);
}

/**
 * Generates HTML content in Tally-style format for a farmer patti bill
 */
function generateBillHTML(farmerName: string, patti: PattiRecord): string {
  const profile = ProfileService.getProfile();
  const firmName = profile.name?.trim() || "OS Tech";
  const firmAddress1 = profile.address1?.trim() || "";
  const firmAddress2 = profile.address2?.trim() || "";
  const dateStr = toDDMMYYYY(patti.date);
  const billNo = patti.billNumber ?? patti.id;

  // Build table rows
  let serialNo = 1;
  let tableRows = "";

  for (const product of patti.products) {
    const qty = product.weight > 0 ? product.weight : "-";
    if (product.purchases.length === 0) {
      tableRows += `
        <tr>
          <td class="center">${serialNo++}</td>
          <td>${product.productName}</td>
          <td class="center">0</td>
          <td class="center">${qty}</td>
          <td class="right">${product.rate}</td>
          <td class="right">0</td>
        </tr>`;
    } else {
      // Group purchases by rate — same rate → merge into one row
      const rateGroups = new Map<number, { bags: number; amount: number }>();
      for (const purchase of product.purchases) {
        const g = rateGroups.get(purchase.rate);
        if (g) {
          g.bags += purchase.quantity;
          g.amount += purchase.totalAmount;
        } else {
          rateGroups.set(purchase.rate, { bags: purchase.quantity, amount: purchase.totalAmount });
        }
      }
      for (const [rate, { bags, amount }] of rateGroups) {
        tableRows += `
          <tr>
            <td class="center">${serialNo++}</td>
            <td>${product.productName}</td>
            <td class="center">${bags}</td>
            <td class="center">${qty}</td>
            <td class="right">${rate}</td>
            <td class="right">${Math.round(amount)}</td>
          </tr>`;
      }
    }
  }

  const total      = Math.round(patti.totalPattiAmount);
  const lessAmount = Math.round(patti.totalDeductions);
  const netTotal   = Math.round(patti.finalPayableAmount);
  const others     = Math.round(patti.otherExpenses);
  const hamalli    = Math.round(patti.hamalliAmount);
  const lorry      = Math.round(patti.lorryAmount);
  const cash       = Math.round(patti.cashAmount);
  const commission = Math.round(patti.commissionAmount);

  const summaryRow = (label: string, amount: number) =>
    amount > 0
      ? `<tr><td class="s-label">${label}</td><td class="s-amount">${amount}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #000;
      background: #fff;
    }

    .bill { border: 2px solid #000; margin: 10px; }

    /* Firm header */
    .firm-header {
      text-align: center;
      padding: 10px 12px 8px;
      border-bottom: 2px solid #000;
    }
    .firm-name {
      font-size: 22px;
      font-weight: bold;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .firm-sub { font-size: 11px; margin-top: 3px; color: #000; }

    /* Bill type title */
    .bill-title {
      text-align: center;
      font-size: 12px;
      font-weight: bold;
      padding: 4px;
      letter-spacing: 4px;
      border-bottom: 1px solid #000;
      background: #fff;
    }

    /* Party / bill meta */
    .meta-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
    .meta-left  { padding: 8px 12px; border-right: 1px solid #000; }
    .meta-right { width: 210px; padding: 8px 12px; }
    .meta-line  { line-height: 1.9; font-size: 12px; }
    .meta-key   { font-weight: bold; }

    /* Items table */
    .items-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
    .items-table th,
    .items-table td { border: 1px solid #000; padding: 4px 7px; font-size: 11px; }
    .items-table th { text-align: center; font-weight: bold; background: #fff; }
    .subtotal-row td { background: #fff; border-top: 1px dashed #000; }
    .center { text-align: center; }
    .right  { text-align: right; }

    /* Summary */
    .summary-outer { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
    .summary-spacer { }
    .summary-cell   { width: 260px; padding: 10px 14px 10px 0; vertical-align: top; }
    .summary-table  { border-collapse: collapse; width: 260px; }
    .summary-table td { padding: 3px 6px; font-size: 12px; line-height: 1.7; }
    .s-label  { text-align: left; }
    .s-amount { text-align: right; min-width: 80px; }
    .s-total td { font-weight: bold; border-top: 1px solid #000; }
    .s-net   td { font-weight: bold; font-size: 13px; border-top: 2px solid #000; padding-top: 5px; }

    /* Footer */
    .footer-table { width: 100%; border-collapse: collapse; }
    .footer-left  { padding: 8px 14px; font-size: 11px; }
    .footer-right { width: 200px; padding: 8px 14px; font-size: 11px; text-align: right; line-height: 2.2; }
  </style>
</head>
<body>
  <div class="bill">

    <div class="firm-header">
      <div class="firm-name">${firmName}</div>
      ${firmAddress1 ? `<div class="firm-sub">${firmAddress1}</div>` : ""}
      ${firmAddress2 ? `<div class="firm-sub">${firmAddress2}</div>` : ""}
    </div>

    <div class="bill-title">P &nbsp; A &nbsp; T &nbsp; T &nbsp; I</div>

    <table class="meta-table">
      <tr>
        <td class="meta-left">
          <div class="meta-line"><span class="meta-key">Farmer Name :</span>&nbsp;${farmerName}</div>
        </td>
        <td class="meta-right">
          <div class="meta-line"><span class="meta-key">Bill No.</span> : ${billNo}</div>
          <div class="meta-line"><span class="meta-key">Date&nbsp;&nbsp;&nbsp;&nbsp;</span> : ${dateStr}</div>
        </td>
      </tr>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th>S.No.</th>
          <th>Item Name</th>
          <th>Bags</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <table class="summary-outer">
      <tr>
        <td class="summary-spacer"></td>
        <td class="summary-cell">
          <table class="summary-table">
            <tr>
              <td class="s-label">Total</td>
              <td class="s-amount">${total}</td>
            </tr>
            ${summaryRow("Commission", commission)}
            ${summaryRow("Hamalli", hamalli)}
            ${summaryRow("Lorry", lorry)}
            ${summaryRow("Cash", cash)}
            ${summaryRow("Others", others)}
            <tr class="s-total">
              <td class="s-label">Less Amount</td>
              <td class="s-amount">${lessAmount}</td>
            </tr>
            <tr class="s-net">
              <td class="s-label">Net Payable</td>
              <td class="s-amount">${netTotal}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table class="footer-table">
      <tr>
        <td class="footer-left">E. &amp; O.E.</td>
        <td class="footer-right">For ${firmName}<br><br>Authorised Signatory</td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}

// ── Buyer report ──────────────────────────────────────────────────────────────

/**
 * Generates a purchase statement PDF for a buyer and shares it.
 * File is named: BuyerName-DDMMYY.pdf  (today's date, since it's a report)
 */
export async function generateAndShareBuyerReport(
  buyer: BuyerReport
): Promise<boolean> {
  const today = new Date();
  const fileName = `${safeName(buyer.buyerName)}-${toDDMMYY(today)}.pdf`;
  const htmlContent = generateBuyerHTML(buyer);
  return shareWithName(htmlContent, fileName);
}

function generateBuyerHTML(buyer: BuyerReport): string {
  const profile = ProfileService.getProfile();
  const firmName = profile.name?.trim() || "OS Tech";
  const today = toDDMMYYYY(new Date());

  // Sort purchases descending by date
  const sorted = [...buyer.purchases].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  let rows = "";
  sorted.forEach((p, i) => {
    const qty = p.unit > 0 ? p.weight : "-";
    rows += `
      <tr>
        <td class="center">${i + 1}</td>
        <td>${toDDMMYYYY(p.date)}</td>
        <td>${p.farmerName}</td>
        <td>${p.productName}</td>
        <td class="center">${p.quantity}</td>
        <td class="center">${qty}</td>
        <td class="right">₹${p.rate}</td>
        <td class="right">₹${Math.round(p.amount)}</td>
      </tr>`;
  });

  const totalAmount = Math.round(buyer.totalAmount);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; }
    .bill { border: 2px solid #000; margin: 10px; }
    .firm-header { text-align: center; padding: 10px 12px 8px; border-bottom: 2px solid #000; }
    .firm-name { font-size: 22px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; }
    .bill-title {
      text-align: center; font-size: 12px; font-weight: bold;
      padding: 4px; letter-spacing: 4px; border-bottom: 1px solid #000;
    }
    .meta-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
    .meta-left  { padding: 8px 12px; border-right: 1px solid #000; }
    .meta-right { width: 210px; padding: 8px 12px; }
    .meta-line  { line-height: 1.9; font-size: 12px; }
    .meta-key   { font-weight: bold; }
    .summary-box {
      display: flex; justify-content: flex-end;
      padding: 8px 14px; border-top: 1px solid #000; gap: 30px;
    }
    .summary-item { font-size: 12px; }
    .summary-label { color: #444; }
    .summary-value { font-weight: bold; margin-left: 8px; }
    table.items { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
    table.items th, table.items td { border: 1px solid #000; padding: 4px 7px; font-size: 11px; }
    table.items th { text-align: center; font-weight: bold; background: #fff; }
    .center { text-align: center; }
    .right  { text-align: right; }
    .total-row td { font-weight: bold; border-top: 2px solid #000; background: #f5f5f5; }
    .footer-table { width: 100%; border-collapse: collapse; }
    .footer-left  { padding: 8px 14px; font-size: 11px; }
    .footer-right { width: 200px; padding: 8px 14px; font-size: 11px; text-align: right; line-height: 2.2; }
  </style>
</head>
<body>
  <div class="bill">
    <div class="firm-header">
      <div class="firm-name">${firmName}</div>
    </div>

    <div class="bill-title">B U Y E R &nbsp; S T A T E M E N T</div>

    <table class="meta-table">
      <tr>
        <td class="meta-left">
          <div class="meta-line"><span class="meta-key">Buyer Name :</span>&nbsp;${buyer.buyerName}</div>
        </td>
        <td class="meta-right">
          <div class="meta-line"><span class="meta-key">Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> : ${today}</div>
          <div class="meta-line"><span class="meta-key">Purchases</span> : ${buyer.totalPurchases}</div>
          <div class="meta-line"><span class="meta-key">Total Bags</span> : ${buyer.totalBags}</div>
        </td>
      </tr>
    </table>

    <table class="items">
      <thead>
        <tr>
          <th>S.No.</th>
          <th>Date</th>
          <th>Farmer</th>
          <th>Product</th>
          <th>Bags</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td colspan="4" class="center">Total</td>
          <td class="center">${buyer.totalBags}</td>
          <td></td>
          <td></td>
          <td class="right">₹${totalAmount}</td>
        </tr>
      </tbody>
    </table>

    <table class="footer-table">
      <tr>
        <td class="footer-left">E. &amp; O.E.</td>
        <td class="footer-right">For ${firmName}<br><br>Authorised Signatory</td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}