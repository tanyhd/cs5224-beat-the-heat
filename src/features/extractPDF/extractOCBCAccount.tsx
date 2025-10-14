import { PdfReader } from 'pdfreader';

type TextItem = {
  text: string;
  x: number;
  y: number;
};

function isTextItem(item: any): item is TextItem {
  return (
    item &&
    typeof item.text === 'string' &&
    typeof item.x === 'number' &&
    typeof item.y === 'number'
  );
}

// Given existing row keys, find one that is close in y coordinate for the same page.
function findClosestRowKey(existingKeys: string[], y: number, page: number, tolerance = 0.5) {
  for (const key of existingKeys) {
    const [pStr, yStr] = key.split('-');
    if (Number(pStr) === page && Math.abs(Number(yStr) - y) < tolerance) {
      return key;
    }
  }
  return `${page}-${y.toFixed(3)}`;
}

export async function extractOCBCAccount(pdfBuffer: ArrayBuffer): Promise<string[][]> {
  const buffer = Buffer.from(pdfBuffer);
  const rows: { [key: string]: TextItem[] } = {};
  let currentPage = 0;

  await new Promise<void>((resolve, reject) => {
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err);
      } else if (!item) {
        resolve();
      } else if (item.page) {
        currentPage = item.page;
      } else if (isTextItem(item)) {
        const rowKey = findClosestRowKey(Object.keys(rows), item.y, currentPage);
        if (!rows[rowKey]) {
          rows[rowKey] = [];
        }
        rows[rowKey].push(item);
      }
    });
  });

  // Sort rows first by page then by y coordinate; then sort each row's items by x coordinate (left-to-right)
  const sortedRows: TextItem[][] = Object.entries(rows)
    .sort((a, b) => {
      const [pageA, yA] = a[0].split('-').map(Number);
      const [pageB, yB] = b[0].split('-').map(Number);
      return pageA !== pageB ? pageA - pageB : yA - yB;
    })
    .map(([_, items]) => items.sort((a, b) => a.x - b.x));

  // Each header mapping will include a unique key (for example, the first "Date" is "Date",
  // a second occurrence would be "Date2", etc.).
  let headerFound = false;
  let headerMap: { key: string; x: number }[] = [];

  // Regular expression for a valid date in the primary date column (e.g., "04 MAR").
  const dateRegex = /^\d{1,2}\s?[A-Z]{3}$/;
  // Substring to check for stop row (ignoring case).
  const stopPhrase = "total withdrawals/deposits";

  type TransactionRecord = { [key: string]: string };
  let outputColumns: string[] = [];

  const transactions: TransactionRecord[] = [];

  for (const row of sortedRows) {
    const rowText = row.map(item => item.text).join(' ').trim();

    // Stop processing if the row's text (ignoring case) contains the stop phrase.
    if (rowText.toLowerCase().includes(stopPhrase)) {
      break;
    }

    // Look for the header row if not already found.
    if (!headerFound) {
      // Look for a row that includes the necessary keywords.
      if (rowText.includes('Date') && rowText.includes('Description') && rowText.includes('Withdrawal')) {
        // Build the header mapping with unique keys.
        const headerCount: { [base: string]: number } = {};
        headerMap = row.map(item => {
          const headerText = item.text.trim();
          const lower = headerText.toLowerCase();
          let baseKey = "";
          if (lower.includes('date')) {
            baseKey = "Date";
          } else if (lower.includes('description')) {
            baseKey = "Description";
          } else if (lower.includes('cheque')) {
            baseKey = "Cheque";
          } else if (lower.includes('withdrawal')) {
            baseKey = "Withdrawal";
          } else if (lower.includes('deposit')) {
            baseKey = "Deposit";
          } else if (lower.includes('balance')) {
            baseKey = "Balance";
          } else {
            baseKey = headerText;
          }
          headerCount[baseKey] = (headerCount[baseKey] || 0) + 1;
          const key = headerCount[baseKey] > 1 ? baseKey + headerCount[baseKey] : baseKey;
          return { key, x: item.x };
        });
        // Sort header mapping by x coordinate to maintain left-to-right order.
        headerMap.sort((a, b) => a.x - b.x);
        // Build outputColumns based on header mapping order.
        outputColumns = headerMap.map(h => h.key);

        headerFound = true;
        continue; // Skip processing the header row itself.
      } else {
        continue; // Skip rows until header is found.
      }
    }

    // For each subsequent row, map each text item to a column based on the closest header x coordinate.
    const rowData: { [key: string]: string } = {};
    outputColumns.forEach(col => { rowData[col] = ''; });

    for (const item of row) {
      // Find the header with the closest x coordinate.
      let closest = headerMap[0];
      let minDiff = Math.abs(item.x - closest.x);
      for (const h of headerMap) {
        const diff = Math.abs(item.x - h.x);
        if (diff < minDiff) {
          closest = h;
          minDiff = diff;
        }
      }
      // Append the text to the appropriate column.
      rowData[closest.key] = rowData[closest.key]
        ? rowData[closest.key] + " " + item.text.trim()
        : item.text.trim();
    }

    // If there is no content at all in the row, stop processing.
    const hasContent = Object.values(rowData).some(val => val.trim() !== '');
    if (!hasContent) {
      break;
    }

    // Decide whether this row begins a new transaction.
    // Use the primary date column (assume is "Date") to determine this.
    if (dateRegex.test(rowData["Date"])) {
      // A valid primary date means a new transaction starts.
      transactions.push({ ...rowData });
    } else {
      // Otherwise, if the row is a continuation row, merge its content into the previous transaction.
      if (transactions.length > 0) {
        // For multi-line descriptions, append the content to the previous transaction's Description.
        if (rowData["Description"].trim() !== '') {
          transactions[transactions.length - 1]["Description"] += " " + rowData["Description"].trim();
        }
        // For any other columns (including additional Date columns), append numeric data if available.
        outputColumns.forEach(col => {
          if (col !== "Description" && col !== "Date") {
            if (rowData[col] && /\d/.test(rowData[col])) {
              transactions[transactions.length - 1][col] = transactions[transactions.length - 1][col]
                ? transactions[transactions.length - 1][col] + " " + rowData[col].trim()
                : rowData[col].trim();
            }
          }
        });
      }
    }
  }

  // Convert each transaction record into the final output format using the header order.
  const result: string[][] = transactions.map((t) =>
    outputColumns.map(col => (t[col] || '').trim())
  );

  return result;
}