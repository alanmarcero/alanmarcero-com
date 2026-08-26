/* =======================================================================
   tmusMonthlySales.js — GENERATED DATA, do not hand-edit.

   Source: Nasdaq insider activity for TMUS (the feed behind
   https://www.nasdaq.com/market-activity/stocks/tmus/insider-activity),
   read 2026-08-26. The feed hands back 250 transactions and no more,
   which is what fixes this window at two years rather than five.

   Kept: transaction types "Sell" and "Automatic Sell" — an actual sale,
   open-market or under a 10b5-1 plan. Dispositions (shares withheld to
   cover tax on a vest), grants and option exercises are not sales.
   Dropped: DEUTSCHE TELEKOM AG, the majority owner, whose block trades
   are nothing like an executive's payday.

   Regenerate with pages/tmobile/scripts/fetch-nasdaq-insider-sales.py
   ======================================================================= */

export const NASDAQ_META = {"symbol": "TMUS", "source": "Nasdaq insider activity", "sourceUrl": "https://www.nasdaq.com/market-activity/stocks/tmus/insider-activity", "fetched": "2026-08-26", "feedRecords": 250, "feedCapped": true, "saleRows": 155, "excludedFiler": "DEUTSCHE TELEKOM AG", "excludedRows": 97, "excludedShares": 6417309, "txnCount": 58, "sellerCount": 13, "feedFirst": "2024-08-26", "feedLast": "2026-08-15", "firstSale": "2024-08-26", "lastSale": "2026-05-21", "monthCount": 25, "quietMonths": 10};

/** One record per calendar month in the window, months with no sale included. */
export const MONTHLY_SALES = [
  {"month": "2024-08", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 2706, "value": 541498, "txns": 1, "people": [{"name": "Raul Marcelo Claure", "shares": 2706, "value": 541498}]}},
  {"month": "2024-09", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 275000, "value": 54072702, "txns": 3, "people": [{"name": "Raul Marcelo Claure", "shares": 275000, "value": 54072702}]}},
  {"month": "2024-10", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 65769, "value": 14536124, "txns": 3, "people": [{"name": "Mark Wolfe Nelson", "shares": 42769, "value": 9249224}, {"name": "Peter Osvaldik", "shares": 20000, "value": 4671000}, {"name": "Michael J. Katz", "shares": 3000, "value": 615900}]}},
  {"month": "2024-11", "sievert": {"shares": 80000, "value": 19079800, "txns": 3, "people": [{"name": "Mike Sievert", "shares": 80000, "value": 19079800}]}, "others": {"shares": 127100, "value": 28714009, "txns": 6, "people": [{"name": "Raul Marcelo Claure", "shares": 110000, "value": 24673000}, {"name": "Nestor Cano", "shares": 11100, "value": 2560659}, {"name": "Srikant M. Datar", "shares": 6000, "value": 1480350}]}},
  {"month": "2024-12", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 1100, "value": 254188, "txns": 1, "people": [{"name": "Letitia A Long", "shares": 1100, "value": 254188}]}},
  {"month": "2025-01", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
  {"month": "2025-02", "sievert": {"shares": 45000, "value": 12007125, "txns": 2, "people": [{"name": "Mike Sievert", "shares": 45000, "value": 12007125}]}, "others": {"shares": 135695, "value": 35780453, "txns": 14, "people": [{"name": "Mark Wolfe Nelson", "shares": 40333, "value": 10668823}, {"name": "Peter Osvaldik", "shares": 25000, "value": 6580750}, {"name": "Callie R Field", "shares": 19566, "value": 5207258}, {"name": "Ulf Ewaldsson", "shares": 19407, "value": 5155081}, {"name": "Nestor Cano", "shares": 15000, "value": 4036650}, {"name": "Teresa Taylor", "shares": 8000, "value": 1885200}, {"name": "Dara Bazzano", "shares": 5889, "value": 1571691}, {"name": "Michael J. Katz", "shares": 2500, "value": 675000}]}},
  {"month": "2025-03", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 730, "value": 191990, "txns": 1, "people": [{"name": "Srikant M. Datar", "shares": 730, "value": 191990}]}},
  {"month": "2025-04", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
  {"month": "2025-05", "sievert": {"shares": 45000, "value": 10921275, "txns": 2, "people": [{"name": "Mike Sievert", "shares": 45000, "value": 10921275}]}, "others": {"shares": 2500, "value": 592800, "txns": 1, "people": [{"name": "Michael J. Katz", "shares": 2500, "value": 592800}]}},
  {"month": "2025-06", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
  {"month": "2025-07", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 19300, "value": 4711840, "txns": 2, "people": [{"name": "Callie R Field", "shares": 12300, "value": 2961840}, {"name": "Jon Freier", "shares": 7000, "value": 1750000}]}},
  {"month": "2025-08", "sievert": {"shares": 45000, "value": 11536875, "txns": 2, "people": [{"name": "Mike Sievert", "shares": 45000, "value": 11536875}]}, "others": {"shares": 2500, "value": 627800, "txns": 1, "people": [{"name": "Michael J. Katz", "shares": 2500, "value": 627800}]}},
  {"month": "2025-09", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
  {"month": "2025-10", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
  {"month": "2025-11", "sievert": {"shares": 45000, "value": 9702450, "txns": 2, "people": [{"name": "Mike Sievert", "shares": 45000, "value": 9702450}]}, "others": {"shares": 2500, "value": 539775, "txns": 1, "people": [{"name": "Michael J. Katz", "shares": 2500, "value": 539775}]}},
  {"month": "2025-12", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 1457, "value": 306436, "txns": 1, "people": [{"name": "Letitia A Long", "shares": 1457, "value": 306436}]}},
  {"month": "2026-01", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
  {"month": "2026-02", "sievert": {"shares": 95000, "value": 20498189, "txns": 3, "people": [{"name": "Mike Sievert", "shares": 95000, "value": 20498189}]}, "others": {"shares": 595843, "value": 129621970, "txns": 5, "people": [{"name": "Raul Marcelo Claure", "shares": 550000, "value": 119663500}, {"name": "Peter Osvaldik", "shares": 27000, "value": 5801220}, {"name": "Mark Wolfe Nelson", "shares": 18843, "value": 4157250}]}},
  {"month": "2026-03", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 4291, "value": 945890, "txns": 2, "people": [{"name": "Srikant M. Datar", "shares": 4291, "value": 945890}]}},
  {"month": "2026-04", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
  {"month": "2026-05", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 9799, "value": 1890860, "txns": 2, "people": [{"name": "Michael J. Katz", "shares": 5000, "value": 979050}, {"name": "Jon Freier", "shares": 4799, "value": 911810}]}},
  {"month": "2026-06", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
  {"month": "2026-07", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
  {"month": "2026-08", "sievert": {"shares": 0, "value": 0, "txns": 0, "people": []}, "others": {"shares": 0, "value": 0, "txns": 0, "people": []}},
];

/** Every kept sale transaction, oldest first — the table view reads this. */
export const SALE_TXNS = [
  {"date": "2024-08-26", "name": "Raul Marcelo Claure", "filer": "CLAURE RAUL MARCELO", "relation": "Director", "kind": "market", "own": "indirect", "shares": 2706, "price": 200.11, "value": 541498},
  {"date": "2024-09-09", "name": "Raul Marcelo Claure", "filer": "CLAURE RAUL MARCELO", "relation": "Director", "kind": "market", "own": "indirect", "shares": 1572, "price": 196.0, "value": 308112},
  {"date": "2024-09-10", "name": "Raul Marcelo Claure", "filer": "CLAURE RAUL MARCELO", "relation": "Director", "kind": "market", "own": "indirect", "shares": 141119, "price": 196.53, "value": 27734117},
  {"date": "2024-09-11", "name": "Raul Marcelo Claure", "filer": "CLAURE RAUL MARCELO", "relation": "Director", "kind": "market", "own": "indirect", "shares": 132309, "price": 196.74, "value": 26030473},
  {"date": "2024-10-01", "name": "Michael J. Katz", "filer": "KATZ MICHAEL J.", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 3000, "price": 205.3, "value": 615900},
  {"date": "2024-10-16", "name": "Mark Wolfe Nelson", "filer": "NELSON MARK WOLFE", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 42769, "price": 216.26, "value": 9249224},
  {"date": "2024-10-25", "name": "Peter Osvaldik", "filer": "OSVALDIK PETER", "relation": "Officer", "kind": "market", "own": "direct", "shares": 20000, "price": 233.55, "value": 4671000},
  {"date": "2024-11-04", "name": "Raul Marcelo Claure", "filer": "CLAURE RAUL MARCELO", "relation": "Director", "kind": "market", "own": "indirect", "shares": 110000, "price": 224.3, "value": 24673000},
  {"date": "2024-11-07", "name": "Nestor Cano", "filer": "CANO NESTOR", "relation": "Officer", "kind": "market", "own": "indirect", "shares": 11100, "price": 230.69, "value": 2560659},
  {"date": "2024-11-11", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 20000, "price": 237.73, "value": 4754600},
  {"date": "2024-11-12", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 20000, "price": 237.82, "value": 4756400},
  {"date": "2024-11-14", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Officer", "kind": "market", "own": "direct", "shares": 40000, "price": 239.22, "value": 9568800},
  {"date": "2024-11-27", "name": "Srikant M. Datar", "filer": "DATAR SRIKANT M.", "relation": "Director", "kind": "market", "own": "direct", "shares": 1000, "price": 247.19, "value": 247190},
  {"date": "2024-11-27", "name": "Srikant M. Datar", "filer": "DATAR SRIKANT M.", "relation": "Director", "kind": "market", "own": "indirect", "shares": 2000, "price": 247.08, "value": 494160},
  {"date": "2024-11-29", "name": "Srikant M. Datar", "filer": "DATAR SRIKANT M.", "relation": "Director", "kind": "market", "own": "direct", "shares": 1000, "price": 246.0, "value": 246000},
  {"date": "2024-11-29", "name": "Srikant M. Datar", "filer": "DATAR SRIKANT M.", "relation": "Director", "kind": "market", "own": "indirect", "shares": 2000, "price": 246.5, "value": 493000},
  {"date": "2024-12-13", "name": "Letitia A Long", "filer": "LONG LETITIA A", "relation": "Director", "kind": "market", "own": "direct", "shares": 1100, "price": 231.08, "value": 254188},
  {"date": "2025-02-03", "name": "Teresa Taylor", "filer": "TAYLOR TERESA", "relation": "Director", "kind": "market", "own": "direct", "shares": 8000, "price": 235.65, "value": 1885200},
  {"date": "2025-02-14", "name": "Nestor Cano", "filer": "CANO NESTOR", "relation": "Officer", "kind": "market", "own": "direct", "shares": 3294, "price": 269.11, "value": 886448},
  {"date": "2025-02-14", "name": "Nestor Cano", "filer": "CANO NESTOR", "relation": "Officer", "kind": "market", "own": "indirect", "shares": 11706, "price": 269.11, "value": 3150202},
  {"date": "2025-02-15", "name": "Dara Bazzano", "filer": "BAZZANO DARA", "relation": "Officer", "kind": "market", "own": "direct", "shares": 1881, "price": 270.82, "value": 509412},
  {"date": "2025-02-18", "name": "Callie R Field", "filer": "FIELD CALLIE R", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 9215, "price": 270.0, "value": 2488050},
  {"date": "2025-02-18", "name": "Dara Bazzano", "filer": "BAZZANO DARA", "relation": "Officer", "kind": "market", "own": "direct", "shares": 2008, "price": 267.37, "value": 536879},
  {"date": "2025-02-18", "name": "Mark Wolfe Nelson", "filer": "NELSON MARK WOLFE", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 10232, "price": 270.0, "value": 2762640},
  {"date": "2025-02-18", "name": "Michael J. Katz", "filer": "KATZ MICHAEL J.", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 2500, "price": 270.0, "value": 675000},
  {"date": "2025-02-19", "name": "Callie R Field", "filer": "FIELD CALLIE R", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 10351, "price": 262.7, "value": 2719208},
  {"date": "2025-02-19", "name": "Dara Bazzano", "filer": "BAZZANO DARA", "relation": "Officer", "kind": "market", "own": "direct", "shares": 2000, "price": 262.7, "value": 525400},
  {"date": "2025-02-19", "name": "Mark Wolfe Nelson", "filer": "NELSON MARK WOLFE", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 15101, "price": 262.7, "value": 3967033},
  {"date": "2025-02-20", "name": "Mark Wolfe Nelson", "filer": "NELSON MARK WOLFE", "relation": "Officer", "kind": "market", "own": "direct", "shares": 15000, "price": 262.61, "value": 3939150},
  {"date": "2025-02-21", "name": "Ulf Ewaldsson", "filer": "EWALDSSON ULF", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 19407, "price": 265.63, "value": 5155081},
  {"date": "2025-02-25", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 22500, "price": 269.67, "value": 6067575},
  {"date": "2025-02-26", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 22500, "price": 263.98, "value": 5939550},
  {"date": "2025-02-27", "name": "Peter Osvaldik", "filer": "OSVALDIK PETER", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 25000, "price": 263.23, "value": 6580750},
  {"date": "2025-03-05", "name": "Srikant M. Datar", "filer": "DATAR SRIKANT M.", "relation": "Director", "kind": "market", "own": "direct", "shares": 730, "price": 263.0, "value": 191990},
  {"date": "2025-05-15", "name": "Michael J. Katz", "filer": "KATZ MICHAEL J.", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 2500, "price": 237.12, "value": 592800},
  {"date": "2025-05-19", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 22500, "price": 244.4, "value": 5499000},
  {"date": "2025-05-20", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 22500, "price": 240.99, "value": 5422275},
  {"date": "2025-07-24", "name": "Jon Freier", "filer": "FREIER JON", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 7000, "price": 250.0, "value": 1750000},
  {"date": "2025-07-29", "name": "Callie R Field", "filer": "FIELD CALLIE R", "relation": "Officer", "kind": "market", "own": "direct", "shares": 12300, "price": 240.8, "value": 2961840},
  {"date": "2025-08-15", "name": "Michael J. Katz", "filer": "KATZ MICHAEL J.", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 2500, "price": 251.12, "value": 627800},
  {"date": "2025-08-18", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 22500, "price": 255.58, "value": 5750550},
  {"date": "2025-08-19", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 22500, "price": 257.17, "value": 5786325},
  {"date": "2025-11-17", "name": "Michael J. Katz", "filer": "KATZ MICHAEL J.", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 2500, "price": 215.91, "value": 539775},
  {"date": "2025-11-17", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Director", "kind": "plan", "own": "direct", "shares": 22500, "price": 216.97, "value": 4881825},
  {"date": "2025-11-18", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Director", "kind": "plan", "own": "direct", "shares": 22500, "price": 214.25, "value": 4820625},
  {"date": "2025-12-05", "name": "Letitia A Long", "filer": "LONG LETITIA A", "relation": "Director", "kind": "market", "own": "direct", "shares": 1457, "price": 210.32, "value": 306436},
  {"date": "2026-02-12", "name": "Raul Marcelo Claure", "filer": "CLAURE RAUL MARCELO", "relation": "Director", "kind": "market", "own": "indirect", "shares": 550000, "price": 217.57, "value": 119663500},
  {"date": "2026-02-17", "name": "Mark Wolfe Nelson", "filer": "NELSON MARK WOLFE", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 10240, "price": 220.8, "value": 2260992},
  {"date": "2026-02-18", "name": "Mark Wolfe Nelson", "filer": "NELSON MARK WOLFE", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 6274, "price": 219.69, "value": 1378335},
  {"date": "2026-02-18", "name": "Peter Osvaldik", "filer": "OSVALDIK PETER", "relation": "Officer", "kind": "market", "own": "direct", "shares": 27000, "price": 214.86, "value": 5801220},
  {"date": "2026-02-19", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Director", "kind": "market", "own": "direct", "shares": 80000, "price": 214.94, "value": 17195200},
  {"date": "2026-02-23", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Director", "kind": "market", "own": "direct", "shares": 13911, "price": 220.07, "value": 3061394},
  {"date": "2026-02-24", "name": "Mark Wolfe Nelson", "filer": "NELSON MARK WOLFE", "relation": "Officer", "kind": "market", "own": "direct", "shares": 2329, "price": 222.38, "value": 517923},
  {"date": "2026-02-24", "name": "Mike Sievert", "filer": "SIEVERT G MICHAEL", "relation": "Director", "kind": "market", "own": "direct", "shares": 1089, "price": 221.85, "value": 241595},
  {"date": "2026-03-04", "name": "Srikant M. Datar", "filer": "DATAR SRIKANT M.", "relation": "Director", "kind": "market", "own": "direct", "shares": 3291, "price": 221.1, "value": 727640},
  {"date": "2026-03-10", "name": "Srikant M. Datar", "filer": "DATAR SRIKANT M.", "relation": "Director", "kind": "market", "own": "indirect", "shares": 1000, "price": 218.25, "value": 218250},
  {"date": "2026-05-01", "name": "Michael J. Katz", "filer": "KATZ MICHAEL J.", "relation": "Officer", "kind": "market", "own": "direct", "shares": 5000, "price": 195.81, "value": 979050},
  {"date": "2026-05-21", "name": "Jon Freier", "filer": "FREIER JON", "relation": "Officer", "kind": "plan", "own": "direct", "shares": 4799, "price": 190.0, "value": 911810},
];
