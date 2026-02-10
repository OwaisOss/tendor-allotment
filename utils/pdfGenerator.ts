import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { PattiRecord } from "../types";

/**
 * Generates a PDF bill for a farmer and shares it
 * @param farmerName - Name of the farmer
 * @param patti - The patti record containing all bill details
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function generateAndShareFarmerBill(
  farmerName: string,
  patti: PattiRecord
): Promise<boolean> {
  try {
    // Generate HTML content for the PDF
    const htmlContent = generateBillHTML(farmerName, patti);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Share the PDF
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri);
      return true;
    } else {
      console.warn("Sharing is not available on this device");
      return false;
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}

/**
 * Generates HTML content for the farmer bill
 */
function generateBillHTML(farmerName: string, patti: PattiRecord): string {
  const date = new Date(patti.date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalBags = patti.products.reduce(
    (sum, p) => sum + p.totalQuantity,
    0
  );

  // Generate products table rows
  const productsRows = patti.products
    .map((product) => {
      const buyersList =
        product.purchases.length > 0
          ? product.purchases
              .map((p) => `${p.buyerName || "Anonymous"}: ${p.quantity} bags`)
              .join(", ")
          : "No purchases";

      return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${product.totalQuantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${product.weight} kg</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${product.rate.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${product.totalAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="5" style="padding: 4px 8px; font-size: 11px; color: #666; border-bottom: 1px solid #eee;">
          Buyers: ${buyersList}
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bill - ${farmerName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }
          .header h2 {
            margin: 5px 0;
            font-size: 18px;
            color: #666;
            font-weight: normal;
          }
          .bill-info {
            margin-bottom: 20px;
          }
          .bill-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #f5f5f5;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #333;
            font-weight: 600;
          }
          th.text-center {
            text-align: center;
          }
          th.text-right {
            text-align: right;
          }
          .summary {
            margin-top: 20px;
            border-top: 2px solid #333;
            padding-top: 15px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 14px;
          }
          .summary-row.total {
            font-weight: bold;
            font-size: 16px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            margin-top: 10px;
          }
          .deductions {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
          }
          .deduction-item {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 13px;
            color: #666;
          }
          .final-payable {
            margin-top: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border: 2px solid #333;
            border-radius: 5px;
          }
          .final-payable-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .final-payable-amount {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FARMER BILL</h1>
          <h2>${farmerName}</h2>
        </div>

        <div class="bill-info">
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Bill No:</strong> ${patti.id}</p>
          <p><strong>Total Bags:</strong> ${totalBags}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th class="text-center">Bags</th>
              <th class="text-center">Weight</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${productsRows}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Total Sales:</span>
            <span>₹${patti.totalPattiAmount.toFixed(2)}</span>
          </div>

          <div class="deductions">
            <div class="deduction-item">
              <span>Commission (${patti.commissionPercentage}%):</span>
              <span>₹${patti.commissionAmount.toFixed(2)}</span>
            </div>
            <div class="deduction-item">
              <span>Hamalli (${patti.hamalliPerBag} per bag):</span>
              <span>₹${patti.hamalliAmount.toFixed(2)}</span>
            </div>
            ${patti.lorryAmount > 0 ? `
            <div class="deduction-item">
              <span>Lorry:</span>
              <span>₹${patti.lorryAmount.toFixed(2)}</span>
            </div>
            ` : ""}
            ${patti.cashAmount > 0 ? `
            <div class="deduction-item">
              <span>Cash:</span>
              <span>₹${patti.cashAmount.toFixed(2)}</span>
            </div>
            ` : ""}
            ${patti.otherExpenses > 0 ? `
            <div class="deduction-item">
              <span>Other Expenses:</span>
              <span>₹${patti.otherExpenses.toFixed(2)}</span>
            </div>
            ` : ""}
            <div class="deduction-item" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px; margin-top: 5px;">
              <span>Total Deductions:</span>
              <span>₹${patti.totalDeductions.toFixed(2)}</span>
            </div>
          </div>

          <div class="final-payable">
            <div class="final-payable-label">Final Payable Amount</div>
            <div class="final-payable-amount">₹${patti.finalPayableAmount.toFixed(2)}</div>
          </div>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString("en-IN")}</p>
          <p>This is a computer-generated bill.</p>
        </div>
      </body>
    </html>
  `;
}
