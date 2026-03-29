const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

function getTsvPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'data', 'trades.tsv');
  }
  const userDir = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
  const dest = path.join(userDir, 'trades.tsv');
  if (!fs.existsSync(dest)) {
    const seed = path.join(process.resourcesPath, 'data', 'trades.tsv');
    if (fs.existsSync(seed)) {
      fs.copyFileSync(seed, dest);
    } else {
      fs.writeFileSync(dest, 'date\tfutures\tstock\tnote\trate\tnasdaq\tsp500\n', 'utf-8');
    }
  }
  return dest;
}

// ── Load TSV (backward compatible) ──
ipcMain.handle('load-trades', () => {
  const filePath = getTsvPath();
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  if (lines.length <= 1) return [];

  const headers = lines[0].split('\t').map(h => h.trim());

  return lines.slice(1).map(line => {
    const cols = line.split('\t');
    const get = (name) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? cols[idx] : undefined;
    };
    return {
      date: get('date') || '',
      futures: parseFloat(get('futures')) || 0,
      stock: parseFloat(get('stock')) || 0,
      note: get('note') || '',
      rate: parseFloat(get('rate')) || 0,
      nasdaq: parseFloat(get('nasdaq')) || 0,
      sp500: parseFloat(get('sp500')) || 0,
    };
  });
});

// ── Save TSV ──
ipcMain.handle('save-trades', (_event, records) => {
  const filePath = getTsvPath();
  const header = 'date\tfutures\tstock\tnote\trate\tnasdaq\tsp500';
  const rows = records
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => `${r.date}\t${r.futures}\t${r.stock}\t${r.note || ''}\t${r.rate}\t${r.nasdaq || 0}\t${r.sp500 || 0}`);
  fs.writeFileSync(filePath, [header, ...rows].join('\n') + '\n', 'utf-8');
  return true;
});

// ── Import TSV from external file ──
ipcMain.handle('import-tsv', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'TSV 파일 불러오기',
    filters: [
      { name: 'TSV / CSV', extensions: ['tsv', 'csv', 'txt'] },
      { name: '모든 파일', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (!filePaths || !filePaths.length) return null;

  const raw = fs.readFileSync(filePaths[0], 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  if (lines.length <= 1) return [];

  const headers = lines[0].split('\t').map(h => h.trim());

  const records = lines.slice(1).map(line => {
    const cols = line.split('\t');
    const get = (name) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? cols[idx] : undefined;
    };
    return {
      date: get('date') || '',
      futures: parseFloat(get('futures')) || 0,
      stock: parseFloat(get('stock')) || 0,
      note: get('note') || '',
      rate: parseFloat(get('rate')) || 0,
      nasdaq: parseFloat(get('nasdaq')) || 0,
      sp500: parseFloat(get('sp500')) || 0,
    };
  }).filter(r => r.date);

  // Save imported data to the app's TSV as well
  const filePath = getTsvPath();
  const header = 'date\tfutures\tstock\tnote\trate\tnasdaq\tsp500';
  const rows = records
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => `${r.date}\t${r.futures}\t${r.stock}\t${r.note || ''}\t${r.rate}\t${r.nasdaq || 0}\t${r.sp500 || 0}`);
  fs.writeFileSync(filePath, [header, ...rows].join('\n') + '\n', 'utf-8');

  return records;
});

// ── Fetch market data for a given date ──
ipcMain.handle('fetch-market-data', async (_event, dateStr) => {
  const result = { rate: null, nasdaq: null, sp500: null };

  // 1) Exchange rate USD/KRW
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/v1/currencies/usd.json`);
    if (res.ok) {
      const data = await res.json();
      if (data.usd && data.usd.krw) result.rate = Math.round(data.usd.krw * 100) / 100;
    }
  } catch {}

  // If first API failed, try fallback
  if (!result.rate) {
    try {
      const res = await fetch(`https://latest.currency-api.pages.dev/v1/currencies/usd.json`);
      if (res.ok) {
        const data = await res.json();
        if (data.usd && data.usd.krw) result.rate = Math.round(data.usd.krw * 100) / 100;
      }
    } catch {}
  }

  // 2) NASDAQ 100
  try {
    result.nasdaq = await fetchIndexChange('%5ENDX', dateStr);
  } catch {}

  // 3) S&P 500
  try {
    result.sp500 = await fetchIndexChange('%5EGSPC', dateStr);
  } catch {}

  return result;
});

async function fetchIndexChange(symbol, dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const period2 = Math.floor(d.getTime() / 1000) + 86400 * 2;
  const period1 = period2 - 86400 * 10;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  });
  if (!res.ok) return null;

  const data = await res.json();
  const chart = data.chart?.result?.[0];
  if (!chart || !chart.timestamp) return null;

  const timestamps = chart.timestamp;
  const closes = chart.indicators?.quote?.[0]?.close || [];
  const targetTs = d.getTime() / 1000;

  let bestIdx = -1, bestDiff = Infinity;
  for (let i = 0; i < timestamps.length; i++) {
    const diff = Math.abs(timestamps[i] - targetTs);
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
  }

  if (bestIdx < 1 || bestDiff > 86400 * 2) return null;
  const prev = closes[bestIdx - 1];
  const curr = closes[bestIdx];
  if (!prev || !curr) return null;

  return parseFloat(((curr - prev) / prev * 100).toFixed(2));
}

// ── Fetch monthly index change (prev month last close → target month last close) ──
async function fetchMonthlyIndexChange(symbol, year, month) {
  // Get data spanning from prev month to end of target month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const p1 = Math.floor(new Date(`${prevYear}-${String(prevMonth).padStart(2,'0')}-15`).getTime() / 1000);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const p2 = Math.floor(new Date(`${nextYear}-${String(nextMonth).padStart(2,'0')}-05`).getTime() / 1000);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${p1}&period2=${p2}&interval=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  });
  if (!res.ok) return null;

  const data = await res.json();
  const chart = data.chart?.result?.[0];
  if (!chart || !chart.timestamp) return null;

  const timestamps = chart.timestamp;
  const closes = chart.indicators?.quote?.[0]?.close || [];

  // Find last close of prev month and last close of target month
  let prevClose = null, targetClose = null;
  for (let i = 0; i < timestamps.length; i++) {
    const d = new Date(timestamps[i] * 1000);
    const m = d.getUTCMonth() + 1;
    const y = d.getUTCFullYear();
    if (closes[i] == null) continue;
    if (y === prevYear && m === prevMonth) prevClose = closes[i];
    if (y < year || (y === year && m < month)) prevClose = closes[i]; // catch edge cases
    if (y === year && m === month) targetClose = closes[i];
  }

  if (!prevClose || !targetClose) return null;
  return parseFloat(((targetClose - prevClose) / prevClose * 100).toFixed(2));
}

ipcMain.handle('fetch-monthly-index', async (_event, year, month) => {
  const result = { nasdaq: null, sp500: null };
  try { result.nasdaq = await fetchMonthlyIndexChange('%5ENDX', year, month); } catch {}
  try { result.sp500 = await fetchMonthlyIndexChange('%5EGSPC', year, month); } catch {}
  return result;
});

// ── PDF Export ──
ipcMain.handle('export-pdf', async (_event, htmlContent) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: `trading-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (!filePath) return false;

  const pdfWin = new BrowserWindow({
    show: false,
    width: 794,
    height: 1123,
    webPreferences: { offscreen: true },
  });

  await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  await new Promise(r => setTimeout(r, 800));

  const pdfBuffer = await pdfWin.webContents.printToPDF({
    pageSize: 'A4',
    printBackground: true,
    margins: { marginType: 'custom', top: 0.4, bottom: 0.4, left: 0.5, right: 0.5 },
  });

  fs.writeFileSync(filePath, pdfBuffer);
  pdfWin.close();
  shell.openPath(filePath);
  return true;
});

// ── Window ──
function createWindow() {
  const isMac = process.platform === 'darwin';

  const winOptions = {
    width: 1120,
    height: 780,
    minWidth: 840,
    minHeight: 600,
    title: 'Trading Journal',
    backgroundColor: '#0a0e17',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  };

  if (isMac) {
    winOptions.titleBarStyle = 'hiddenInset';
    winOptions.trafficLightPosition = { x: 16, y: 16 };
  }

  const win = new BrowserWindow(winOptions);

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
