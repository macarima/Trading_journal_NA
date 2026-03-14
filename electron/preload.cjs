const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadTrades: () => ipcRenderer.invoke('load-trades'),
  saveTrades: (records) => ipcRenderer.invoke('save-trades', records),
  fetchMarketData: (date) => ipcRenderer.invoke('fetch-market-data', date),
  exportPDF: (html) => ipcRenderer.invoke('export-pdf', html),
  importTsv: () => ipcRenderer.invoke('import-tsv'),
});
