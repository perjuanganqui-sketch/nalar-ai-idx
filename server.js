
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "local-ai", "dist");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    timeout: 25_000,
    retryOptions: { attempts: 2, initialDelay: 1, maxDelay: 3 },
  },
});

const marketInstruments = [
  { ticker: "BBCA", providerSymbol: "BBCA.JK", name: "Bank Central Asia Tbk", sector: "Bank", color: "#198dcc" },
  { ticker: "BMRI", providerSymbol: "BMRI.JK", name: "Bank Mandiri (Persero) Tbk", sector: "Bank", color: "#e98e25" },
  { ticker: "BBNI", providerSymbol: "BBNI.JK", name: "Bank Negara Indonesia Tbk", sector: "Bank", color: "#1476cf" },
  { ticker: "BBRI", providerSymbol: "BBRI.JK", name: "Bank Rakyat Indonesia (Persero) Tbk", sector: "Bank", color: "#0d77b5" },
  { ticker: "BNGA", providerSymbol: "BNGA.JK", name: "Bank CIMB Niaga Tbk", sector: "Bank", color: "#db443f" },
  { ticker: "BRPT", providerSymbol: "BRPT.JK", name: "Barito Pacific Tbk", sector: "Energi", color: "#08a77e" },
  { ticker: "TPIA", providerSymbol: "TPIA.JK", name: "Chandra Asri Pacific Tbk", sector: "Bahan Baku", color: "#df5c57" },
  { ticker: "AMRT", providerSymbol: "AMRT.JK", name: "Sumber Alfaria Trijaya Tbk", sector: "Konsumen", color: "#df4b44" },
  { ticker: "DSSA", providerSymbol: "DSSA.JK", name: "Dian Swastatika Sentosa Tbk", sector: "Energi", color: "#20a68a" },
  { ticker: "KLBF", providerSymbol: "KLBF.JK", name: "Kalbe Farma Tbk", sector: "Kesehatan", color: "#ef9f27" },
  { ticker: "ARTO", providerSymbol: "ARTO.JK", name: "Bank Jago Tbk", sector: "Bank", color: "#e39f26" },
  { ticker: "CTRA", providerSymbol: "CTRA.JK", name: "Ciputra Development Tbk", sector: "Properti", color: "#188e87" },
  { ticker: "CUAN", providerSymbol: "CUAN.JK", name: "Petrindo Jaya Kreasi Tbk", sector: "Energi", color: "#1d9f89" },
  { ticker: "TLKM", providerSymbol: "TLKM.JK", name: "Telkom Indonesia Tbk", sector: "Telekomunikasi", color: "#dd4d47" },
  { ticker: "GOTO", providerSymbol: "GOTO.JK", name: "GoTo Gojek Tokopedia Tbk", sector: "Teknologi", color: "#e56748" },
  { ticker: "ASII", providerSymbol: "ASII.JK", name: "Astra International Tbk", sector: "Otomotif", color: "#e0a328" },
  { ticker: "ASGR", providerSymbol: "ASGR.JK", name: "Astra Graphia Tbk", sector: "Teknologi", color: "#e44f43" },
  { ticker: "AUTO", providerSymbol: "AUTO.JK", name: "Astra Otoparts Tbk", sector: "Otomotif", color: "#1685c3" },
  { ticker: "UNTR", providerSymbol: "UNTR.JK", name: "United Tractors Tbk", sector: "Alat Berat", color: "#f2a52a" },
  { ticker: "ISAT", providerSymbol: "ISAT.JK", name: "Indosat Tbk", sector: "Telekomunikasi", color: "#e5a82c" },
  { ticker: "EXCL", providerSymbol: "EXCL.JK", name: "XL Axiata Tbk", sector: "Telekomunikasi", color: "#7b4ca0" },
  { ticker: "TOWR", providerSymbol: "TOWR.JK", name: "Sarana Menara Nusantara Tbk", sector: "Infrastruktur", color: "#2267ad" },
  { ticker: "UNVR", providerSymbol: "UNVR.JK", name: "Unilever Indonesia Tbk", sector: "Konsumen", color: "#1d68b2" },
  { ticker: "ICBP", providerSymbol: "ICBP.JK", name: "Indofood CBP Sukses Makmur Tbk", sector: "Konsumen", color: "#d8493e" },
  { ticker: "INDF", providerSymbol: "INDF.JK", name: "Indofood Sukses Makmur Tbk", sector: "Konsumen", color: "#244b91" },
  { ticker: "MYOR", providerSymbol: "MYOR.JK", name: "Mayora Indah Tbk", sector: "Konsumen", color: "#287a48" },
  { ticker: "GGRM", providerSymbol: "GGRM.JK", name: "Gudang Garam Tbk", sector: "Konsumen", color: "#b3403a" },
  { ticker: "HMSP", providerSymbol: "HMSP.JK", name: "H.M. Sampoerna Tbk", sector: "Konsumen", color: "#c7303d" },
  { ticker: "CPIN", providerSymbol: "CPIN.JK", name: "Charoen Pokphand Indonesia Tbk", sector: "Konsumen", color: "#c63736" },
  { ticker: "JPFA", providerSymbol: "JPFA.JK", name: "Japfa Comfeed Indonesia Tbk", sector: "Konsumen", color: "#c83b37" },
  { ticker: "MAPI", providerSymbol: "MAPI.JK", name: "Mitra Adiperkasa Tbk", sector: "Ritel", color: "#242d51" },
  { ticker: "MAPA", providerSymbol: "MAPA.JK", name: "Map Aktif Adiperkasa Tbk", sector: "Ritel", color: "#2666ad" },
  { ticker: "ERAA", providerSymbol: "ERAA.JK", name: "Erajaya Swasembada Tbk", sector: "Ritel", color: "#e95048" },
  { ticker: "MIDI", providerSymbol: "MIDI.JK", name: "Midi Utama Indonesia Tbk", sector: "Ritel", color: "#ed8d31" },
  { ticker: "ANTM", providerSymbol: "ANTM.JK", name: "Aneka Tambang Tbk", sector: "Pertambangan", color: "#d4a52b" },
  { ticker: "INCO", providerSymbol: "INCO.JK", name: "Vale Indonesia Tbk", sector: "Pertambangan", color: "#2875aa" },
  { ticker: "MDKA", providerSymbol: "MDKA.JK", name: "Merdeka Copper Gold Tbk", sector: "Pertambangan", color: "#dfac36" },
  { ticker: "NCKL", providerSymbol: "NCKL.JK", name: "Trimegah Bangun Persada Tbk", sector: "Pertambangan", color: "#2c6692" },
  { ticker: "BRMS", providerSymbol: "BRMS.JK", name: "Bumi Resources Minerals Tbk", sector: "Pertambangan", color: "#33916e" },
  { ticker: "AMMN", providerSymbol: "AMMN.JK", name: "Amman Mineral Internasional Tbk", sector: "Pertambangan", color: "#2671a9" },
  { ticker: "BREN", providerSymbol: "BREN.JK", name: "Barito Renewables Energy Tbk", sector: "Energi", color: "#38966d" },
  { ticker: "ADRO", providerSymbol: "ADRO.JK", name: "Alamtri Resources Indonesia Tbk", sector: "Energi", color: "#e0a33a" },
  { ticker: "PTBA", providerSymbol: "PTBA.JK", name: "Bukit Asam Tbk", sector: "Energi", color: "#2071aa" },
  { ticker: "ITMG", providerSymbol: "ITMG.JK", name: "Indo Tambangraya Megah Tbk", sector: "Energi", color: "#d1a342" },
  { ticker: "MEDC", providerSymbol: "MEDC.JK", name: "Medco Energi Internasional Tbk", sector: "Energi", color: "#278a61" },
  { ticker: "PGAS", providerSymbol: "PGAS.JK", name: "Perusahaan Gas Negara Tbk", sector: "Energi", color: "#2678bb" },
  { ticker: "AKRA", providerSymbol: "AKRA.JK", name: "AKR Corporindo Tbk", sector: "Energi", color: "#e04e45" },
  { ticker: "ESSA", providerSymbol: "ESSA.JK", name: "ESSA Industries Indonesia Tbk", sector: "Energi", color: "#309876" },
  { ticker: "TAPG", providerSymbol: "TAPG.JK", name: "Triputra Agro Persada Tbk", sector: "Perkebunan", color: "#49864a" },
  { ticker: "AALI", providerSymbol: "AALI.JK", name: "Astra Agro Lestari Tbk", sector: "Perkebunan", color: "#36814d" },
  { ticker: "LSIP", providerSymbol: "LSIP.JK", name: "PP London Sumatra Indonesia Tbk", sector: "Perkebunan", color: "#49884a" },
  { ticker: "INKP", providerSymbol: "INKP.JK", name: "Indah Kiat Pulp & Paper Tbk", sector: "Bahan Baku", color: "#3979a6" },
  { ticker: "TKIM", providerSymbol: "TKIM.JK", name: "Pabrik Kertas Tjiwi Kimia Tbk", sector: "Bahan Baku", color: "#32816b" },
  { ticker: "SMGR", providerSymbol: "SMGR.JK", name: "Semen Indonesia (Persero) Tbk", sector: "Bahan Baku", color: "#2581aa" },
  { ticker: "INTP", providerSymbol: "INTP.JK", name: "Indocement Tunggal Prakarsa Tbk", sector: "Bahan Baku", color: "#2982a2" },
  { ticker: "BRIS", providerSymbol: "BRIS.JK", name: "Bank Syariah Indonesia Tbk", sector: "Bank", color: "#e7a42d" },
  { ticker: "BBTN", providerSymbol: "BBTN.JK", name: "Bank Tabungan Negara (Persero) Tbk", sector: "Bank", color: "#e47d34" },
  { ticker: "BNLI", providerSymbol: "BNLI.JK", name: "Bank Permata Tbk", sector: "Bank", color: "#16829c" },
  { ticker: "BDMN", providerSymbol: "BDMN.JK", name: "Bank Danamon Indonesia Tbk", sector: "Bank", color: "#2872a5" },
  { ticker: "NISP", providerSymbol: "NISP.JK", name: "Bank OCBC NISP Tbk", sector: "Bank", color: "#d8343b" },
  { ticker: "BTPN", providerSymbol: "BTPN.JK", name: "Bank SMBC Indonesia Tbk", sector: "Bank", color: "#e25143" },
  { ticker: "BSDE", providerSymbol: "BSDE.JK", name: "Bumi Serpong Damai Tbk", sector: "Properti", color: "#327d50" },
  { ticker: "PWON", providerSymbol: "PWON.JK", name: "Pakuwon Jati Tbk", sector: "Properti", color: "#9c3e52" },
  { ticker: "SMRA", providerSymbol: "SMRA.JK", name: "Summarecon Agung Tbk", sector: "Properti", color: "#397c9e" },
  { ticker: "PANI", providerSymbol: "PANI.JK", name: "Pantai Indah Kapuk Dua Tbk", sector: "Properti", color: "#377e9d" },
  { ticker: "JSMR", providerSymbol: "JSMR.JK", name: "Jasa Marga (Persero) Tbk", sector: "Infrastruktur", color: "#2876ad" },
  { ticker: "MIKA", providerSymbol: "MIKA.JK", name: "Mitra Keluarga Karyasehat Tbk", sector: "Kesehatan", color: "#328b8c" },
  { ticker: "SIDO", providerSymbol: "SIDO.JK", name: "Industri Jamu dan Farmasi Sido Muncul Tbk", sector: "Kesehatan", color: "#36835b" },
  { ticker: "EMTK", providerSymbol: "EMTK.JK", name: "Elang Mahkota Teknologi Tbk", sector: "Teknologi", color: "#c43c47" },
  { ticker: "SCMA", providerSymbol: "SCMA.JK", name: "Surya Citra Media Tbk", sector: "Media", color: "#d64a42" },
  { ticker: "BELI", providerSymbol: "BELI.JK", name: "Global Digital Niaga Tbk", sector: "Teknologi", color: "#328ac2" },
  { ticker: "WIFI", providerSymbol: "WIFI.JK", name: "Solusi Sinergi Digital Tbk", sector: "Telekomunikasi", color: "#3489b6" },
  { ticker: "GJTL", providerSymbol: "GJTL.JK", name: "Gajah Tunggal Tbk", sector: "Otomotif", color: "#c63736" },
  { ticker: "SRTG", providerSymbol: "SRTG.JK", name: "Saratoga Investama Sedaya Tbk", sector: "Investasi", color: "#357b55" },
];
const quotedInstruments = marketInstruments.slice(0, 15);
const indexInstrument = { ticker: "IHSG", providerSymbol: "^JKSE", name: "Indeks Harga Saham Gabungan", sector: "Index", color: "#dd594c" };
const chartRanges = {
  "1D": { range: "1d", interval: "1m" },
  "5D": { range: "5d", interval: "5m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
  All: { range: "max", interval: "1mo" },
};
const marketCache = new Map();
const marketRequests = new Map();
const signalCache = new Map();
const signalRequests = new Map();
const marketCacheTtl = 10_000;
const signalCacheTtl = 30_000;
let latestMarketData;

app.use(cors({
  origin: ["http://localhost:5173", "http://nalar.localhost:5173"],
}));
app.use(express.json());

function getGeminiErrorMessage(error) {
  const status = error.status;
  let providerMessage = error.message;

  try {
    providerMessage = JSON.parse(error.message).error?.message ?? error.message;
  } catch {
    providerMessage = error.message;
  }

  if (!process.env.GEMINI_API_KEY) {
    return "GEMINI_API_KEY belum diatur di file .env.";
  }
  if (status === 401 || status === 403) {
    return "Gemini menolak autentikasi. Periksa apakah GEMINI_API_KEY valid dan Gemini API aktif untuk project tersebut.";
  }
  if (status === 429) {
    return "Batas penggunaan atau kuota Gemini tercapai. Coba lagi nanti atau periksa kuota project Google AI.";
  }
  if (status === 503 && /high demand|unavailable|busy/i.test(providerMessage)) {
    return "Model AI sedang padat atau sementara tidak tersedia. Coba lagi beberapa saat.";
  }
  if (status === 504 || status === 408 || error.name === "TimeoutError") {
    return "Gemini terlalu lama merespons atau sedang sibuk. Coba kirim pertanyaan lagi beberapa saat.";
  }
  if (status >= 500) {
    return `Layanan Gemini sedang bermasalah (HTTP ${status}). Coba lagi beberapa saat.`;
  }
  if (error.cause?.code || providerMessage === "fetch failed") {
    return "Backend tidak dapat terhubung ke Gemini. Periksa koneksi internet, firewall, atau proxy komputer.";
  }
  if (status === 400 || status === 404) {
    return `Gemini menolak permintaan (${status}). Periksa model dan format permintaan: ${providerMessage}`;
  }
  return `Permintaan Gemini gagal${status ? ` (HTTP ${status})` : ""}: ${providerMessage}`;
}

async function fetchYahooChart(symbol, range, interval) {
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  url.searchParams.set("range", range);
  url.searchParams.set("interval", interval);
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 NalarIDX/1.0" },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Penyedia data menolak permintaan (${response.status}) untuk ${symbol}.`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  if (payload.chart?.error || !result?.meta) {
    throw new Error(`Data ${symbol} tidak tersedia dari penyedia.`);
  }
  return result;
}

function toQuote(result, instrument) {
  const meta = result.meta;
  const price = meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose;

  if (!Number.isFinite(price) || !Number.isFinite(previousClose)) {
    throw new Error(`Harga terbaru ${instrument.ticker} tidak tersedia.`);
  }

  const quote = result.indicators?.quote?.[0] ?? {};
  return {
    ...instrument,
    price,
    previousClose,
    change: price - previousClose,
    changePercent: previousClose ? ((price - previousClose) / previousClose) * 100 : 0,
    volume: meta.regularMarketVolume ?? null,
    quoteTime: meta.regularMarketTime ? meta.regularMarketTime * 1000 : null,
    dayHigh: meta.regularMarketDayHigh ?? null,
    dayLow: meta.regularMarketDayLow ?? null,
    open: quote.open?.find(Number.isFinite) ?? null,
    sparkline: (quote.close ?? []).filter(Number.isFinite).slice(-32),
  };
}

async function loadMarketData(rangeKey) {
  const chartRange = chartRanges[rangeKey];
  const [indexChartResult, indexQuoteResult, ...stockResults] = await Promise.all([
    fetchYahooChart("^JKSE", chartRange.range, chartRange.interval),
    fetchYahooChart("^JKSE", "1d", "1m"),
    ...quotedInstruments.map(({ providerSymbol }) => fetchYahooChart(providerSymbol, "1d", "1m")),
  ]);

  const index = toQuote(indexQuoteResult, {
    ticker: "IHSG",
    name: "IDX Composite",
    color: "#8e7dfa",
  });
  const timestamps = indexChartResult.timestamp ?? [];
  const closes = indexChartResult.indicators?.quote?.[0]?.close ?? [];
  index.chart = timestamps.flatMap((timestamp, pointIndex) => (
    Number.isFinite(closes[pointIndex]) ? [{ time: timestamp * 1000, close: closes[pointIndex] }] : []
  ));
  index.dayHigh = indexQuoteResult.meta.regularMarketDayHigh ?? null;
  index.dayLow = indexQuoteResult.meta.regularMarketDayLow ?? null;

  return {
    range: rangeKey,
    provider: "Yahoo Finance",
    fetchedAt: Date.now(),
    index,
    stocks: stockResults.map((result, indexPosition) => toQuote(result, quotedInstruments[indexPosition])),
    instruments: marketInstruments.map(({ ticker, name, sector, color }) => ({ ticker, name, sector, color })),
  };
}

async function loadStockChart(ticker, rangeKey) {
  const instrument = ticker === indexInstrument.ticker
    ? indexInstrument
    : marketInstruments.find((stock) => stock.ticker === ticker);
  const chartRange = chartRanges[rangeKey];
  const [chartResult, quoteResult] = await Promise.all([
    fetchYahooChart(instrument.providerSymbol, chartRange.range, chartRange.interval),
    fetchYahooChart(instrument.providerSymbol, "1d", "1m"),
  ]);
  const timestamps = chartResult.timestamp ?? [];
  const quoteSeries = chartResult.indicators?.quote?.[0] ?? {};
  const chart = timestamps.flatMap((timestamp, pointIndex) => {
    const close = quoteSeries.close?.[pointIndex];
    if (!Number.isFinite(close)) return [];
    return [{
      time: timestamp * 1000,
      open: quoteSeries.open?.[pointIndex] ?? close,
      high: quoteSeries.high?.[pointIndex] ?? close,
      low: quoteSeries.low?.[pointIndex] ?? close,
      close,
      volume: quoteSeries.volume?.[pointIndex] ?? null,
    }];
  });
  const quoteInstrument = ticker === indexInstrument.ticker ? indexInstrument : instrument;

  return {
    ...toQuote(quoteResult, quoteInstrument),
    chart,
    range: rangeKey,
    provider: "Yahoo Finance",
    fetchedAt: Date.now(),
  };
}

app.get("/api/market", async (req, res) => {
  const rangeKey = String(req.query.range ?? "1M");
  if (!Object.hasOwn(chartRanges, rangeKey)) {
    return res.status(400).json({ error: "Periode grafik tidak valid." });
  }

  const cached = marketCache.get(rangeKey);
  if (cached && Date.now() - cached.fetchedAt < marketCacheTtl) {
    return res.json(cached);
  }

  let marketRequest = marketRequests.get(rangeKey);
  if (!marketRequest) {
    marketRequest = loadMarketData(rangeKey).then((marketData) => {
      marketCache.set(rangeKey, marketData);
      latestMarketData = marketData;
      return marketData;
    });
    marketRequests.set(rangeKey, marketRequest);
  }

  try {
    const marketData = await marketRequest;
    return res.json(marketData);
  } catch (error) {
    console.error("Market data error:", error.message);
    if (cached) {
      return res.json({
        ...cached,
        stale: true,
        warning: "Penyedia data gagal diperbarui; yang ditampilkan adalah data tersimpan.",
      });
    }
    return res.status(502).json({
      error: "Data pasar tidak dapat dimuat dari penyedia. Coba lagi beberapa saat.",
    });
  } finally {
    if (marketRequests.get(rangeKey) === marketRequest) {
      marketRequests.delete(rangeKey);
    }
  }
});

app.get("/api/market/stocks/:ticker", async (req, res) => {
  const ticker = String(req.params.ticker).toUpperCase();
  const rangeKey = String(req.query.range ?? "1M");
  if (ticker !== indexInstrument.ticker && !marketInstruments.some((stock) => stock.ticker === ticker)) {
    return res.status(404).json({ error: "Ticker tidak tersedia di watchlist." });
  }
  if (!Object.hasOwn(chartRanges, rangeKey)) {
    return res.status(400).json({ error: "Periode grafik tidak valid." });
  }

  const cacheKey = `stock:${ticker}:${rangeKey}`;
  const cached = marketCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < marketCacheTtl) {
    return res.json(cached);
  }

  let stockRequest = marketRequests.get(cacheKey);
  if (!stockRequest) {
    stockRequest = loadStockChart(ticker, rangeKey).then((stockData) => {
      marketCache.set(cacheKey, stockData);
      return stockData;
    });
    marketRequests.set(cacheKey, stockRequest);
  }

  try {
    return res.json(await stockRequest);
  } catch (error) {
    console.error(`Stock chart error (${ticker}):`, error.message);
    if (cached) {
      return res.json({
        ...cached,
        stale: true,
        warning: "Penyedia data gagal diperbarui; yang ditampilkan adalah data tersimpan.",
      });
    }
    return res.status(502).json({
      error: `Grafik ${ticker} tidak dapat dimuat dari penyedia data. Coba lagi beberapa saat.`,
    });
  } finally {
    if (marketRequests.get(cacheKey) === stockRequest) {
      marketRequests.delete(cacheKey);
    }
  }
});

app.get("/api/market/signals/:ticker", async (req, res) => {
  const ticker = String(req.params.ticker).toUpperCase();
  if (ticker !== indexInstrument.ticker && !marketInstruments.some((stock) => stock.ticker === ticker)) {
    return res.status(404).json({ error: "Ticker tidak tersedia untuk analisis AI." });
  }

  const cached = signalCache.get(ticker);
  if (cached && Date.now() - cached.fetchedAt < signalCacheTtl) {
    return res.json(cached);
  }

  let signalRequest = signalRequests.get(ticker);
  if (!signalRequest) {
    signalRequest = (async () => {
      const stockData = await loadStockChart(ticker, "5D");
      const candles = stockData.chart;
      if (candles.length < 15) {
        throw new Error(`Data intraday beberapa hari untuk ${ticker} belum cukup untuk analisis teknikal.`);
      }

      const closes = candles.map((candle) => candle.close);
      const average = (period) => closes.length < period
        ? null
        : closes.slice(-period).reduce((total, close) => total + close, 0) / period;
      const exponentialAverage = (period) => {
        if (closes.length < period) return null;
        const multiplier = 2 / (period + 1);
        return closes.slice(1).reduce(
          (ema, close) => ((close - ema) * multiplier) + ema,
          closes[0],
        );
      };
      const recentCloses = closes.slice(-15);
      const changes = recentCloses.slice(1).map((close, index) => close - recentCloses[index]);
      const gains = changes.reduce((total, change) => total + Math.max(change, 0), 0);
      const losses = changes.reduce((total, change) => total + Math.max(-change, 0), 0);
      const rsi = losses === 0 ? 100 : 100 - (100 / (1 + gains / losses));
      const recentVolumes = candles.slice(-3).map((candle) => candle.volume).filter(Number.isFinite);
      const priorVolumes = candles.slice(-15, -3).map((candle) => candle.volume).filter(Number.isFinite);
      const volumeRatio = recentVolumes.length && priorVolumes.length
        ? recentVolumes.reduce((total, volume) => total + volume, 0) / recentVolumes.length
          / (priorVolumes.reduce((total, volume) => total + volume, 0) / priorVolumes.length || 1)
        : null;
      const changeOver = (period) => closes.length > period
        ? ((closes.at(-1) - closes.at(-(period + 1))) / closes.at(-(period + 1))) * 100
        : null;
      const input = {
        ticker,
        provider: stockData.provider,
        quoteTime: stockData.quoteTime ? new Date(stockData.quoteTime).toISOString() : null,
        latestPrice: stockData.price,
        changePercent: stockData.changePercent,
        candleInterval: "5 menit",
        candlesAnalyzed: candles.length,
        sma20: average(20),
        ema9: exponentialAverage(9),
        ema20: exponentialAverage(20),
        ema50: exponentialAverage(50),
        rsi14: Number(rsi.toFixed(2)),
        changeLast15CandlesPercent: changeOver(15),
        changeLast60CandlesPercent: changeOver(60),
        recentVolumeVsPrevious12Candles: volumeRatio === null ? null : Number(volumeRatio.toFixed(2)),
        recentCandles: candles.slice(-30).map(({ time, open, high, low, close, volume }) => ({
          time: new Date(time).toISOString(),
          open,
          high,
          low,
          close,
          volume,
        })),
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: JSON.stringify(input),
        config: {
          maxOutputTokens: 256,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          systemInstruction: `Kamu menganalisis bias teknikal jangka sangat pendek untuk tujuan edukasi, bukan memberi rekomendasi investasi personal atau instruksi transaksi. Gunakan hanya data JSON yang diberikan dari ${stockData.provider}; data mungkin tertunda dan bukan jaminan real-time. Analisis gabungan EMA/SMA, RSI, perubahan harga lintas candle, volume, dan rangkaian candle. Jangan mensyaratkan semua indikator searah: pilih BUY atau SELL jika bukti mayoritas mendukung arah tersebut dan tidak ada bukti lawan yang kuat. RSI tinggi/rendah saja bukan alasan untuk sinyal lawan arah. Pilih WAIT hanya jika data tidak cukup, indikator utama berimbang, atau sinyal saling bertentangan. Confidence harus mencerminkan kekuatan bukti, bukan kepastian hasil. Balas JSON valid saja dengan bentuk {"signal":"BUY|SELL|WAIT","rationale":"alasan teknikal singkat dalam bahasa Indonesia","confidence":0-100}. Jangan menjanjikan keuntungan.`,
        },
      });

      let analysis;
      try {
        analysis = JSON.parse(response.text ?? "");
      } catch {
        throw new Error("Respons analisis AI tidak berformat JSON yang valid.");
      }
      if (
        !["BUY", "SELL", "WAIT"].includes(analysis.signal)
        || typeof analysis.rationale !== "string"
        || !analysis.rationale.trim()
        || !Number.isFinite(analysis.confidence)
      ) {
        throw new Error("Respons analisis AI tidak memiliki format sinyal yang valid.");
      }

      const result = {
        ticker,
        signal: analysis.signal,
        rationale: analysis.rationale.trim(),
        confidence: Math.max(0, Math.min(100, analysis.confidence)),
        quoteTime: stockData.quoteTime,
        provider: stockData.provider,
        fetchedAt: Date.now(),
      };
      signalCache.set(ticker, result);
      return result;
    })();
    signalRequests.set(ticker, signalRequest);
  }

  try {
    return res.json(await signalRequest);
  } catch (error) {
    console.error(`AI signal error (${ticker}):`, {
      status: error.status,
      causeCode: error.cause?.code,
      message: error.message,
    });
    const status = error.status === 429 || error.status === 503 || error.status === 504 ? error.status : 502;
    return res.status(status).json({ error: getGeminiErrorMessage(error) });
  } finally {
    if (signalRequests.get(ticker) === signalRequest) {
      signalRequests.delete(ticker);
    }
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const selectedTicker = String(req.body.selectedTicker ?? "").toUpperCase();

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Pesan tidak boleh kosong",
      });
    }

    const contents = messages.slice(-10).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "") }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents,
      config: {
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `Kamu adalah Nalar, asisten edukasi pasar modal Indonesia. Jawab dalam bahasa Indonesia yang jelas, seimbang, dan mudah dipahami. Bantu pengguna memahami konsep saham IDX/IHSG, analisis fundamental dan teknikal, serta risiko. Jangan memberi kepastian keuntungan atau menyuruh pengguna membeli/menjual saham. Jangan mengarang harga, berita, data keuangan, atau kondisi pasar terkini; jika pengguna tidak menyediakan data dan kamu tidak punya akses ke data live, jelaskan keterbatasan itu dan minta data atau tanggal yang relevan. Bedakan fakta, asumsi, dan opini. Sertakan risiko dan sarankan verifikasi pada sumber resmi seperti BEI, OJK, dan laporan emiten. Informasi bersifat edukasi, bukan rekomendasi investasi personal.${latestMarketData ? ` Data pasar terakhir dari Yahoo Finance (dapat tertunda, bukan feed resmi BEI): kuotasi IHSG ${latestMarketData.index.price} dengan perubahan ${latestMarketData.index.changePercent.toFixed(2)}%, waktu kuotasi ${new Date(latestMarketData.index.quoteTime).toISOString()}, data diterima backend ${new Date(latestMarketData.fetchedAt).toISOString()}; saham: ${latestMarketData.stocks.map((stock) => `${stock.ticker} ${stock.price} (${stock.changePercent.toFixed(2)}%)`).join(", ")}. Jangan menyebut waktu penerimaan backend sebagai waktu kuotasi. Sebutkan sumber dan keterlambatan bila memakai angka tersebut.` : ""}${selectedTicker ? ` Pengguna sedang melihat ${selectedTicker}${latestMarketData?.stocks.find((stock) => stock.ticker === selectedTicker) ? `, harga terakhir ${latestMarketData.stocks.find((stock) => stock.ticker === selectedTicker).price}, perubahan ${latestMarketData.stocks.find((stock) => stock.ticker === selectedTicker).changePercent.toFixed(2)}%` : ""}.` : ""}`,
      },
    });

    if (!response.text?.trim()) {
      throw new Error("Gemini mengirim jawaban kosong.");
    }

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini error:", {
      status: error.status,
      causeCode: error.cause?.code,
      message: error.message,
    });
    const status = error.status === 429 || error.status === 503 || error.status === 504 ? error.status : 502;
    res.status(status).json({
      error: getGeminiErrorMessage(error),
    });
  }
});

app.use(express.static(frontendDirectory));
app.get(/.*/, (req, res, next) => {
  if (req.method !== "GET") return next();
  return res.sendFile(resolve(frontendDirectory, "index.html"));
});

app.listen(port, () => {
  console.log(`Nalar aktif pada port ${port}`);
});
