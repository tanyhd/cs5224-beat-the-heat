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

export async function extractOCBCCreditCard(pdfBuffer: ArrayBuffer): Promise<string[][]> {
  const buffer = Buffer.from(pdfBuffer);
  const rows: { [key: string]: { x: number; text: string }[] } = {};
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
        const rowKey = `${currentPage}-${item.y.toFixed(3)}`;
        rows[rowKey] = rows[rowKey] || [];
        rows[rowKey].push({ x: item.x, text: item.text });
      }
    });
  });

  const sortedRows = Object.entries(rows)
    .sort((a, b) => {
      const [pageA, yA] = a[0].split('-').map(Number);
      const [pageB, yB] = b[0].split('-').map(Number);
      return pageA !== pageB ? pageA - pageB : yA - yB;
    })
    .map(([_, items]) =>
      items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' ')
    );

  const regex = /^\s*\d{2} \/ \d{2}/;
  const filteredRows = sortedRows.filter((row) => regex.test(row));

  return parseTransactions(filteredRows)
}


function parseTransactions(lines: string[]): string[][] {
  return lines.map((line) => {
    const clean = line.trim().replace(/\s+/g, ' ');

    // Extract date (e.g., 05 / 03)
    const dateMatch = clean.match(/^\d{2} \/ \d{2}/);
    const rawDate = dateMatch?.[0] ?? '';
    const date = rawDate.replace(' / ', '/');

    // Remove date from line
    let rest = clean.replace(rawDate, '').trim();

    // Extract amount
    const bracketAmountMatch = rest.match(/\(\s*\d+\s*\.\s*\d+\s*\)/);
    const plainAmountMatch = rest.match(/\d+\s*\.\s*\d+$/);

    let amount = '';
    if (bracketAmountMatch) {
      amount = bracketAmountMatch[0].replace(/\s+/g, '');
      rest = rest.replace(bracketAmountMatch[0], '').trim();
    } else if (plainAmountMatch) {
      amount = plainAmountMatch[0].replace(/\s+/g, '');
      rest = rest.replace(plainAmountMatch[0], '').trim();
    }

    return [date, rest, amount];
  });
}