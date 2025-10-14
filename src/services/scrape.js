import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeOffersMilelion(month) {
    const url = 'https://milelion.com/2025/04/09/roundup-credit-card-sign-up-bonuses-april-2025/';
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract column values by row label
    function getColumnValues(table, label) {
        const row = table.find(`td:contains("${label}")`).closest('tr');
        const cells = row.find('td');
        const column1Val = cells.eq(1).text().trim();
        const column2Val = cells.eq(2).text().trim();
        return { column1Val, column2Val };
    }

    // Function to find the first row index where td count > 1
    function findStartRowIndex(table) {
        const rows = table.find('tr').toArray();
        for (let i = 0; i < rows.length; i++) {
            const tdCount = $(rows[i]).find('td').length;
            if (tdCount > 1) {
                return i;
            }
        }
        return 4; // Default, start row data from 4th row
    }

    const results = [];

    // For each <h2> with an ID, parse the table that follows (if it exists)
    $('h2[id]').each((_, headingEl) => {
        const $heading = $(headingEl);
        const headingId = $heading.attr('id'); // e.g. "kfcc", "ascend", etc.

        // Find the table immediately after this heading
        const table = $heading.next('table');
        if (!table.length) {
            // If there's no table right after this heading, skip
            return;
        }

        const cardTitle = $heading.text().trim();
        const firstRow = table.find('tr').eq(0);
        const imageUrl = firstRow.find('img').attr('src') || '';
        const cardLink = firstRow.find('a.thirstylink').attr('href') || '';

        const rawOfferEnds = firstRow.find('em').text().trim(); // e.g. "(Offer Ends: 31 Mar 25)"
        const offerEnds = rawOfferEnds
            .replace(/[()]/g, '')
            .replace('Offer Ends:', '')
            .trim();
        const convertedOfferends = new Date(Date.parse(offerEnds));

        // "Apply" and "Details" links (would need to adjust later)
        const applyUrl = table.find('tr').eq(1).find('a').attr('href') || '';
        const detailsUrl = table.find('tr').eq(2).find('a').attr('href') || '';

        // Extract values for each column (based on dynamic labels in the table)
        const { column1Val: annualFee1, column2Val: annualFee2 } =
            getColumnValues(table, 'Annual Fee');
        const { column1Val: spend1, column2Val: spend2 } =
            getColumnValues(table, 'Spend');
        const { column1Val: spendPeriod1, column2Val: spendPeriod2 } =
            getColumnValues(table, 'Spend Period');
        const { column1Val: baseMiles1, column2Val: baseMiles2 } =
            getColumnValues(table, 'Base Miles');
        const { column1Val: bonusMiles1, column2Val: bonusMiles2 } =
            getColumnValues(table, 'Bonus Miles');
        const { column1Val: totalMiles1, column2Val: totalMiles2 } =
            getColumnValues(table, 'Total Miles');

        const convertedAnnualFee1 = extractAmount(annualFee1)
        const convertedAnnualFee2 = extractAmount(annualFee2)
        const convertedSpend1 = extractAmount(spend1)
        const convertedSpend2 = extractAmount(spend2)

        // Extract column titles dynamically
        let column1Title = "";
        let column2Title = "";

        const startRowIndex = findStartRowIndex(table);
        const fourthRowCells = table.find('tr').eq(startRowIndex).find('td');
        const fifthRowCells = table.find('tr').eq(startRowIndex + 1).find('td');

        // Clean cells: exclude blank or &nbsp;
        const validCells = fourthRowCells.filter((_, td) => {
            const text = $(td).text().trim().replace(/\u00a0/g, ''); // remove &nbsp;
            return text !== "";
        });

        if (validCells.length === 2) {
            // Straight 2 column titles, e.g., "New" | "Existing"
            column1Title = $(validCells[0]).text().trim();
            column2Title = $(validCells[1]).text().trim();
        } else if (validCells.length === 1) {
            // Possible nested structure (like "New Only" on top of "Offer 1" and "Offer 2")
            const mainTitle = $(validCells[0]).text().trim();

            // Check if the 4th row has colspan=2
            const hasColspan = $(validCells[0]).attr('colspan') === '2';

            if (hasColspan && fifthRowCells.length === 2) {
                const offer1 = fifthRowCells.eq(0).text().trim();
                const offer2 = fifthRowCells.eq(1).text().trim();
                column1Title = `${mainTitle} ${offer1}`;
                column2Title = `${mainTitle} ${offer2}`;
            } else if (fourthRowCells.length === 2) {
                // Only 2 <td>, 1 is blank, 1 is title like "New Only"
                column1Title = mainTitle;
                column2Title = ""; // no second column
            } else {
                // Fallback to just one title
                column1Title = mainTitle;
                column2Title = "";
            }
        } else {
            // Default fallback
            column1Title = "Column 1";
            column2Title = "Column 2";
        }

        // Construct the final JSON object for this section
        const sectionData = {
            headingId,
            rewardsId: headingId,
            title: cardTitle,
            offerEnds: convertedOfferends,
            imageUrl,
            cardLink,
            applyUrl,
            detailsUrl,
            column1Title,
            column2Title,
            column1: {
                annualFee: convertedAnnualFee1.amount,
                annualFeeText: convertedAnnualFee1.text,
                spend: convertedSpend1.amount,
                spendPeriod: spendPeriod1,
                baseMiles: baseMiles1,
                bonusMiles: bonusMiles1,
                totalMiles: totalMiles1,
            },
            column2: {
                annualFee: convertedAnnualFee2.amount,
                annualFeeText: convertedAnnualFee2.text,
                spend: convertedSpend2.amount,
                spendPeriod: spendPeriod2,
                baseMiles: baseMiles2,
                bonusMiles: bonusMiles2,
                totalMiles: totalMiles2,
            },
        };
        results.push(sectionData);
    });

    return results;
}

function extractAmount(input) {
    // Extract numeric amount with decimals if present
    const amountMatch = input.match(/[\d,]+(?:\.\d{1,2})?/);
    const amount = amountMatch ? Math.round(parseFloat(amountMatch[0].replace(",", "")) * 100) / 100 : 0;

    // Extract text inside parentheses
    const textMatch = input.match(/\((.*?)\)/);
    const text = textMatch ? textMatch[1] : "";

    return { amount, text };
}