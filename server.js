
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
  { ticker: "HRUM", providerSymbol: "HRUM.JK", name: "Harum Energy Tbk", sector: "Energi", color: "#43875a" },
  { ticker: "INDY", providerSymbol: "INDY.JK", name: "Indika Energy Tbk", sector: "Energi", color: "#d5a236" },
  { ticker: "ADMR", providerSymbol: "ADMR.JK", name: "Adaro Minerals Indonesia Tbk", sector: "Pertambangan", color: "#2876a5" },
  { ticker: "DOID", providerSymbol: "DOID.JK", name: "Delta Dunia Makmur Tbk", sector: "Pertambangan", color: "#dc4e45" },
  { ticker: "PTRO", providerSymbol: "PTRO.JK", name: "Petrosea Tbk", sector: "Energi", color: "#378665" },
  { ticker: "PGEO", providerSymbol: "PGEO.JK", name: "Pertamina Geothermal Energy Tbk", sector: "Energi", color: "#36845d" },
  { ticker: "BUMI", providerSymbol: "BUMI.JK", name: "Bumi Resources Tbk", sector: "Pertambangan", color: "#d94e43" },
  { ticker: "MBMA", providerSymbol: "MBMA.JK", name: "Merdeka Battery Materials Tbk", sector: "Pertambangan", color: "#377aa0" },
  { ticker: "RAJA", providerSymbol: "RAJA.JK", name: "Rukun Raharja Tbk", sector: "Energi", color: "#2c7eaa" },
  { ticker: "MTEL", providerSymbol: "MTEL.JK", name: "Dayamitra Telekomunikasi Tbk", sector: "Infrastruktur", color: "#298b71" },
  { ticker: "TBIG", providerSymbol: "TBIG.JK", name: "Tower Bersama Infrastructure Tbk", sector: "Infrastruktur", color: "#2873a9" },
  { ticker: "BUKA", providerSymbol: "BUKA.JK", name: "Bukalapak.com Tbk", sector: "Teknologi", color: "#d44842" },
  { ticker: "MNCN", providerSymbol: "MNCN.JK", name: "Media Nusantara Citra Tbk", sector: "Media", color: "#3680ad" },
  { ticker: "FILM", providerSymbol: "FILM.JK", name: "MD Pictures Tbk", sector: "Media", color: "#9c4e73" },
  { ticker: "CLEO", providerSymbol: "CLEO.JK", name: "Sariguna Primatirta Tbk", sector: "Konsumen", color: "#2588bd" },
  { ticker: "ROTI", providerSymbol: "ROTI.JK", name: "Nippon Indosari Corpindo Tbk", sector: "Konsumen", color: "#d44a42" },
  { ticker: "HEAL", providerSymbol: "HEAL.JK", name: "Medikaloka Hermina Tbk", sector: "Kesehatan", color: "#d64e61" },
  { ticker: "SILO", providerSymbol: "SILO.JK", name: "Siloam International Hospitals Tbk", sector: "Kesehatan", color: "#e98235" },
  { ticker: "LPKR", providerSymbol: "LPKR.JK", name: "Lippo Karawaci Tbk", sector: "Properti", color: "#bd4246" },
  { ticker: "ASRI", providerSymbol: "ASRI.JK", name: "Alam Sutera Realty Tbk", sector: "Properti", color: "#48845c" },
  { ticker: "MKPI", providerSymbol: "MKPI.JK", name: "Metropolitan Kentjana Tbk", sector: "Properti", color: "#36749b" },
  { ticker: "MEGA", providerSymbol: "MEGA.JK", name: "Bank Mega Tbk", sector: "Bank", color: "#d74742" },
  { ticker: "ADMF", providerSymbol: "ADMF.JK", name: "Adira Dinamika Multi Finance Tbk", sector: "Keuangan", color: "#438453" },
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
const investorSignalCache = new Map();
const investorSignalRequests = new Map();
const newsCache = new Map();
const newsRequests = new Map();
const marketCacheTtl = 10_000;
const signalCacheTtl = 30_000;
const newsCacheTtl = 5 * 60_000;
const investorSignalCacheTtl = 15 * 60_000;
let latestMarketData;

const newsCategories = {
  market: "saham Indonesia OR IHSG OR BEI OR bursa saham Indonesia",
  economy: "ekonomi Indonesia OR Bank Indonesia OR rupiah OR inflasi Indonesia",
  business: "bisnis Indonesia OR perusahaan Indonesia OR investasi Indonesia",
  ticker: "saham Indonesia",
};

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (entity, code) => {
      if (code.toLowerCase() === "amp") return "&";
      if (code.toLowerCase() === "quot") return "\"";
      if (code.toLowerCase() === "apos") return "'";
      if (code.toLowerCase() === "lt") return "<";
      if (code.toLowerCase() === "gt") return ">";
      const numeric = code[1].toLowerCase() === "x"
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10);
      return Number.isInteger(numeric) && numeric >= 0 && numeric <= 0x10ffff
        && !(numeric >= 0xd800 && numeric <= 0xdfff)
        ? String.fromCodePoint(numeric)
        : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function readRssTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function parseNewsFeed(xml) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .map(([, item]) => {
      const title = readRssTag(item, "title");
      const link = readRssTag(item, "link");
      const publishedAt = Date.parse(readRssTag(item, "pubDate"));
      const source = readRssTag(item, "source");
      if (!title || !Number.isFinite(publishedAt)) return null;
      let articleUrl;
      try {
        articleUrl = new URL(link);
      } catch {
        return null;
      }
      if (!["http:", "https:"].includes(articleUrl.protocol)) return null;
      return {
        id: articleUrl.href,
        title,
        link: articleUrl.href,
        source: source || articleUrl.hostname.replace(/^www\./, ""),
        publishedAt,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.publishedAt - left.publishedAt)
    .slice(0, 30);
}

async function readNewsResponse(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Respons RSS tidak memiliki isi.");

  const decoder = new TextDecoder();
  let size = 0;
  let xml = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1_000_000) {
      await reader.cancel();
      throw new Error("RSS berita melebihi batas ukuran yang diizinkan.");
    }
    xml += decoder.decode(value, { stream: true });
  }
  return xml + decoder.decode();
}

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

async function loadAnnualFundamentals(instrument) {
  const symbol = instrument.providerSymbol;
  const fundamentalsUrl = new URL(`https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(symbol)}`);
  const now = Math.floor(Date.now() / 1000);
  fundamentalsUrl.search = new URLSearchParams({
    symbol,
    type: "annualTotalRevenue,annualNetIncome,annualDilutedEPS,annualTotalDebt,annualStockholdersEquity",
    period1: String(now - 5 * 365 * 24 * 60 * 60),
    period2: String(now + 31 * 24 * 60 * 60),
  });
  const response = await fetch(fundamentalsUrl, {
    headers: { "User-Agent": "Mozilla/5.0 NalarIDX/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Yahoo Finance Fundamentals merespons HTTP ${response.status}.`);
  const payload = await response.json();
  const results = payload.timeseries?.result;
  if (!Array.isArray(results)) throw new Error("Data laporan fundamental tidak tersedia.");

  const series = new Map(results.map((item) => [
    item.meta?.type?.[0],
    (item[item.meta?.type?.[0]] ?? [])
      .map((entry) => ({
        date: entry.asOfDate,
        value: entry.reportedValue?.raw,
      }))
      .filter((entry) => Number.isFinite(entry.value) && entry.date)
      .sort((left, right) => right.date.localeCompare(left.date)),
  ]));
  const latest = (name) => series.get(`annual${name}`)?.[0] ?? null;
  const previous = (name) => series.get(`annual${name}`)?.[1] ?? null;
  const growth = (name) => {
    const currentValue = latest(name)?.value;
    const previousValue = previous(name)?.value;
    return Number.isFinite(currentValue) && Number.isFinite(previousValue) && previousValue !== 0
      ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100
      : null;
  };
  const income = latest("NetIncome")?.value;
  const revenue = latest("TotalRevenue")?.value;
  const eps = latest("DilutedEPS")?.value;
  const debt = latest("TotalDebt")?.value;
  const equity = latest("StockholdersEquity")?.value;
  const coverage = [income, revenue, eps].filter(Number.isFinite).length;
  const fundamentals = {
    status: coverage === 3 ? "available" : coverage ? "partial" : "unavailable",
    coverage,
    latestFiscalYear: latest("NetIncome")?.date?.slice(0, 4) ?? latest("TotalRevenue")?.date?.slice(0, 4) ?? null,
    previousFiscalYear: previous("NetIncome")?.date?.slice(0, 4) ?? previous("TotalRevenue")?.date?.slice(0, 4) ?? null,
    revenueGrowthPercent: growth("TotalRevenue"),
    netIncomeGrowthPercent: growth("NetIncome"),
    epsGrowthPercent: growth("DilutedEPS"),
    netIncome: Number.isFinite(income) ? income : null,
    eps: Number.isFinite(eps) ? eps : null,
    debtToEquity: Number.isFinite(debt) && Number.isFinite(equity) && equity > 0 ? debt / equity : null,
    sector: instrument.sector,
  };
  fundamentals.score = scoreFundamentals(fundamentals);
  return fundamentals;
}

function scoreFundamentals(fundamentals) {
  if (fundamentals.coverage < 2) return null;
  const checks = [];
  if (Number.isFinite(fundamentals.netIncome)) {
    checks.push(fundamentals.netIncome > 0 ? 1 : -1);
  }
  if (Number.isFinite(fundamentals.netIncomeGrowthPercent)) {
    checks.push(fundamentals.netIncomeGrowthPercent > 5 ? 1 : fundamentals.netIncomeGrowthPercent < -5 ? -1 : 0);
  }
  if (Number.isFinite(fundamentals.revenueGrowthPercent)) {
    checks.push(fundamentals.revenueGrowthPercent > 5 ? 0.5 : fundamentals.revenueGrowthPercent < -5 ? -0.5 : 0);
  }
  if (Number.isFinite(fundamentals.epsGrowthPercent)) {
    checks.push(fundamentals.epsGrowthPercent > 5 ? 0.5 : fundamentals.epsGrowthPercent < -5 ? -0.5 : 0);
  }
  if (fundamentals.sector !== "Bank" && Number.isFinite(fundamentals.debtToEquity) && fundamentals.debtToEquity > 2) {
    checks.push(-0.75);
  }
  if (fundamentals.status === "unavailable" || checks.length < 2) return null;
  return Math.max(-1, Math.min(1, checks.reduce((total, value) => total + value, 0) / 2.5));
}

function classifyNewsTitle(title) {
  const normalized = title.toLocaleLowerCase("id-ID");
  const positiveWords = ["laba", "untung", "tumbuh", "meningkat", "menguat", "naik", "dividen", "rekor", "ekspansi", "kontrak baru", "buyback", "pulih"];
  const negativeWords = ["rugi", "merugi", "anjlok", "merosot", "melemah", "turun", "utang", "gagal", "sanksi", "denda", "default", "phk", "korupsi", "terjerat", "penurunan"];
  const positiveHits = positiveWords.filter((word) => normalized.includes(word)).length;
  const negativeHits = negativeWords.filter((word) => normalized.includes(word)).length;
  if (positiveHits > negativeHits) return "positive";
  if (negativeHits > positiveHits) return "negative";
  return "neutral";
}

function evaluateInvestorTrend(candles, horizon) {
  const closes = candles.map((candle) => candle.close).filter(Number.isFinite);
  const required = Math.max(horizon.fastPeriod, horizon.slowPeriod, horizon.shortMomentum, horizon.longMomentum + 1);
  if (closes.length < required) {
    return { status: "unavailable", score: null, evidence: [`Data historis belum cukup (${closes.length}/${required} candle).`] };
  }
  const average = (period) => closes.slice(-period).reduce((total, close) => total + close, 0) / period;
  const latest = closes.at(-1);
  const fastAverage = average(horizon.fastPeriod);
  const slowAverage = average(horizon.slowPeriod);
  const shortReturn = ((latest - closes.at(-(horizon.shortMomentum + 1))) / closes.at(-(horizon.shortMomentum + 1))) * 100;
  const longReturn = ((latest - closes.at(-(horizon.longMomentum + 1))) / closes.at(-(horizon.longMomentum + 1))) * 100;
  const observations = [
    { positive: latest > fastAverage, negative: latest < fastAverage, up: `Harga di atas rata-rata ${horizon.fastPeriod} candle`, down: `Harga di bawah rata-rata ${horizon.fastPeriod} candle` },
    { positive: fastAverage > slowAverage, negative: fastAverage < slowAverage, up: `Rata-rata ${horizon.fastPeriod} di atas ${horizon.slowPeriod}`, down: `Rata-rata ${horizon.fastPeriod} di bawah ${horizon.slowPeriod}` },
    { positive: shortReturn > 1, negative: shortReturn < -1, up: `Momentum ${horizon.shortMomentum} candle +${shortReturn.toFixed(1)}%`, down: `Momentum ${horizon.shortMomentum} candle ${shortReturn.toFixed(1)}%` },
    { positive: longReturn > 1, negative: longReturn < -1, up: `Momentum ${horizon.longMomentum} candle +${longReturn.toFixed(1)}%`, down: `Momentum ${horizon.longMomentum} candle ${longReturn.toFixed(1)}%` },
  ];
  const score = observations.reduce((total, item) => total + (item.positive ? 1 : item.negative ? -1 : 0), 0) / observations.length;
  const volumeCandles = candles.slice(-25);
  const recentVolume = volumeCandles.slice(-5).map(({ volume }) => volume).filter((volume) => Number.isFinite(volume) && volume > 0);
  const baselineVolume = volumeCandles.slice(0, 20).map(({ volume }) => volume).filter((volume) => Number.isFinite(volume) && volume > 0);
  const volumeRatio = recentVolume.length && baselineVolume.length
    ? (recentVolume.reduce((total, volume) => total + volume, 0) / recentVolume.length)
      / (baselineVolume.reduce((total, volume) => total + volume, 0) / baselineVolume.length || 1)
    : null;
  const evidence = observations.map((item) => item.positive ? item.up : item.negative ? item.down : "Momentum harga belum menunjukkan arah kuat");
  if (Number.isFinite(volumeRatio)) evidence.push(`Volume terkini ${volumeRatio.toFixed(1)}× rata-rata 20 candle sebelumnya`);
  return { status: "available", score, evidence, candlesAnalyzed: closes.length, volumeRatio };
}

function combineInvestorSignal(horizon, technical, fundamentals, newsScore, newsStatus) {
  if (technical.status !== "available") {
    return { signal: "WAIT", score: null, rationale: technical.evidence[0] };
  }
  if (!Number.isFinite(fundamentals.score)) {
    return { signal: "WAIT", score: null, rationale: "Data fundamental tahunan belum cukup; sinyal investor ditahan agar tidak mengandalkan teknikal saja." };
  }
  if (!Number.isFinite(newsScore) || newsStatus !== "available") {
    return { signal: "WAIT", score: null, rationale: "Berita emiten terbaru belum cukup untuk membaca sentimen; tunggu berita relevan sebelum memakai sinyal gabungan." };
  }
  const weights = horizon.weights;
  const totalWeight = weights.technical + weights.fundamental + weights.news;
  const score = (
    technical.score * weights.technical
    + fundamentals.score * weights.fundamental
    + newsScore * weights.news
  ) / totalWeight;
  let signal = score >= 0.2 ? "BUY" : score <= -0.2 ? "SELL" : "WAIT";
  let rationale;
  if (signal === "BUY" && technical.score <= -0.5) {
    signal = "WAIT";
    rationale = "Fundamental atau berita positif belum dikonfirmasi tren harga; tunggu stabilisasi sebelum sinyal investor.";
  } else if (signal === "SELL" && technical.score >= 0.5) {
    signal = "WAIT";
    rationale = "Tren harga masih kuat naik meski fundamental atau berita melemah; tunggu konfirmasi sebelum sinyal investor.";
  } else {
    rationale = `Tren ${technical.score > 0.2 ? "naik" : technical.score < -0.2 ? "turun" : "campuran"}; fundamental ${fundamentals.score > 0.2 ? "membaik" : fundamentals.score < -0.2 ? "melemah" : "campuran"}; sentimen headline ${newsScore > 0.2 ? "positif" : newsScore < -0.2 ? "negatif" : "campuran/netral"}.`;
  }
  return {
    signal,
    score: Number(score.toFixed(2)),
    rationale,
  };
}

async function loadInvestorNews(instrument) {
  const cacheKey = `investor:${instrument.ticker}`;
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < newsCacheTtl) return cached;
  let request = newsRequests.get(cacheKey);
  if (!request) {
    const shortName = instrument.name.replace(/\s*\([^)]*\)/g, "").replace(/\bTbk\b/gi, "").trim();
    const companyTerms = shortName.toLocaleLowerCase("id-ID")
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !["bank", "group", "energy", "holding", "indonesia", "international", "persero", "resources", "company", "corporation", "development"].includes(word));
    const tickerPattern = new RegExp(`\\b${instrument.ticker}\\b`, "i");
    const queries = instrument.ticker === indexInstrument.ticker
      ? ["IHSG Indonesia saham bursa"]
      : [`"${instrument.ticker}" "${shortName}" saham Indonesia`, `"${instrument.ticker}" saham Indonesia`];
    request = (async () => {
      let articles = [];
      let lastError;
      for (const query of queries) {
        const feedUrl = new URL("https://news.google.com/rss/search");
        feedUrl.search = new URLSearchParams({ q: query, hl: "id", gl: "ID", ceid: "ID:id" });
        const response = await fetch(feedUrl, {
          headers: { "User-Agent": "NalarMarketNews/1.0 (+https://nalar-ai-idx.vercel.app)" },
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) {
          lastError = new Error(`Google News RSS merespons HTTP ${response.status}.`);
          if (response.status === 404) continue;
          throw lastError;
        }
        lastError = null;
        articles = parseNewsFeed(await readNewsResponse(response))
          .filter((article) => tickerPattern.test(article.title)
            || companyTerms.filter((term) => article.title.toLocaleLowerCase("id-ID").includes(term)).length >= Math.min(2, companyTerms.length || 1))
          .filter((article) => Date.now() - article.publishedAt <= 30 * 24 * 60 * 60_000);
        if (articles.length) break;
      }
      if (lastError && !articles.length) throw lastError;
      const result = { articles, fetchedAt: Date.now(), provider: "Google News RSS" };
      newsCache.set(cacheKey, result);
      return result;
    })();
    newsRequests.set(cacheKey, request);
  }
  try {
    return await request;
  } catch (error) {
    if (cached) return { ...cached, stale: true };
    throw error;
  } finally {
    if (newsRequests.get(cacheKey) === request) newsRequests.delete(cacheKey);
  }
}

async function loadInvestorSignals(ticker) {
  const instrument = marketInstruments.find((stock) => stock.ticker === ticker);
  const horizonConfigs = [
    { id: "swing", label: "Swing · 1–4 minggu", range: "1M", fastPeriod: 5, slowPeriod: 20, shortMomentum: 5, longMomentum: 20, weights: { technical: 0.55, fundamental: 0.2, news: 0.25 } },
    { id: "medium", label: "Menengah · 3–12 bulan", range: "1Y", fastPeriod: 50, slowPeriod: 200, shortMomentum: 63, longMomentum: 126, weights: { technical: 0.4, fundamental: 0.4, news: 0.2 } },
    { id: "long", label: "Panjang · >1 tahun", range: "5Y", fastPeriod: 26, slowPeriod: 52, shortMomentum: 52, longMomentum: 104, weights: { technical: 0.25, fundamental: 0.6, news: 0.15 } },
  ];
  const settled = await Promise.allSettled([
    ...horizonConfigs.map(({ range }) => loadStockChart(ticker, range)),
    loadAnnualFundamentals(instrument),
    loadInvestorNews(instrument),
  ]);
  const charts = settled.slice(0, horizonConfigs.length);
  const fundamentalsResult = settled[horizonConfigs.length];
  const newsResult = settled[horizonConfigs.length + 1];
  const fundamentals = fundamentalsResult.status === "fulfilled"
    ? fundamentalsResult.value
    : {
      status: "unavailable",
      score: null,
      sector: instrument.sector,
      error: fundamentalsResult.reason?.message ?? "Data fundamental tidak tersedia.",
    };
  const latestPrice = charts.find((result) => result.status === "fulfilled")?.value.price;
  fundamentals.priceToEarnings = Number.isFinite(latestPrice) && Number.isFinite(fundamentals.eps) && fundamentals.eps > 0
    ? latestPrice / fundamentals.eps
    : null;
  const newsFeed = newsResult.status === "fulfilled" ? newsResult.value : null;
  if (fundamentalsResult.status === "rejected") {
    console.error(`Investor fundamentals error (${ticker}):`, fundamentals.error);
  }
  if (newsResult.status === "rejected") {
    console.error(`Investor news error (${ticker}):`, newsResult.reason?.message);
  }
  const recentArticles = (newsFeed?.articles ?? [])
    .filter((article) => Date.now() - article.publishedAt <= 14 * 24 * 60 * 60_000)
    .slice(0, 12)
    .map((article) => ({ ...article, tone: classifyNewsTitle(article.title) }));
  const classifiedArticles = recentArticles.filter((article) => article.tone !== "neutral");
  const newsScore = classifiedArticles.length
    ? classifiedArticles.reduce((total, article) => total + (article.tone === "positive" ? 1 : -1), 0) / classifiedArticles.length
    : null;
  const newsSentiment = {
    status: newsResult.status === "fulfilled" ? recentArticles.length ? "available" : "no-recent-news" : "unavailable",
    tone: Number.isFinite(newsScore) ? newsScore > 0.2 ? "positive" : newsScore < -0.2 ? "negative" : "mixed" : "neutral",
    score: newsScore,
    articles: recentArticles.slice(0, 5),
    provider: "Google News RSS",
    error: newsResult.status === "rejected" ? newsResult.reason?.message ?? "Feed berita belum tersedia." : null,
  };
  const horizons = horizonConfigs.map((horizon, index) => {
    const chartResult = charts[index];
    if (chartResult.status === "rejected") {
      console.error(`Investor trend error (${ticker}, ${horizon.id}):`, chartResult.reason?.message);
    }
    const technical = chartResult.status === "fulfilled"
      ? evaluateInvestorTrend(chartResult.value.chart, horizon)
      : { status: "unavailable", score: null, evidence: [chartResult.reason?.message ?? "Data historis jangka ini gagal dimuat."] };
    const combined = combineInvestorSignal(horizon, technical, fundamentals, newsScore, newsSentiment.status);
    return {
      id: horizon.id,
      label: horizon.label,
      signal: combined.signal,
      score: combined.score,
      rationale: combined.rationale,
      technical,
      weights: horizon.weights,
    };
  });
  return {
    ticker,
    generatedAt: Date.now(),
    provider: { market: "Yahoo Finance", fundamentals: "Yahoo Finance annual financials", news: newsSentiment.provider },
    fundamentals,
    news: newsSentiment,
    horizons,
  };
}

app.get("/api/news", async (req, res) => {
  const category = String(req.query.category ?? "market");
  const ticker = String(req.query.ticker ?? "").toUpperCase();
  const search = String(req.query.q ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 80);
  if (!Object.hasOwn(newsCategories, category)) {
    return res.status(400).json({ error: "Kategori berita tidak valid." });
  }
  if (ticker && ticker !== indexInstrument.ticker && !marketInstruments.some((instrument) => instrument.ticker === ticker)) {
    return res.status(400).json({ error: "Ticker berita tidak tersedia." });
  }

  const terms = category === "ticker" && ticker
    ? `"${ticker}" saham Indonesia`
    : newsCategories[category];
  const query = [terms, ticker && category !== "ticker" ? ticker : "", search]
    .filter(Boolean)
    .join(" ");
  const cacheKey = `${category}:${ticker}:${search.toLowerCase()}`;
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < newsCacheTtl) {
    return res.json(cached);
  }

  let newsRequest = newsRequests.get(cacheKey);
  if (!newsRequest) {
    newsRequest = (async () => {
      const feedUrl = new URL("https://news.google.com/rss/search");
      feedUrl.search = new URLSearchParams({ q: query, hl: "id", gl: "ID", ceid: "ID:id" });
      const response = await fetch(feedUrl, {
        headers: { "User-Agent": "NalarMarketNews/1.0 (+https://nalar-ai-idx.vercel.app)" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Google News RSS merespons HTTP ${response.status}.`);
      const xml = await readNewsResponse(response);
      const articles = parseNewsFeed(xml);
      if (!articles.length) throw new Error("RSS tidak berisi berita valid.");
      const result = {
        articles,
        category,
        ticker: ticker || null,
        provider: "Google News RSS",
        fetchedAt: Date.now(),
      };
      newsCache.set(cacheKey, result);
      if (newsCache.size > 100) newsCache.delete(newsCache.keys().next().value);
      return result;
    })();
    newsRequests.set(cacheKey, newsRequest);
  }

  try {
    return res.json(await newsRequest);
  } catch (error) {
    console.error("Market news error:", error.message);
    if (cached) {
      return res.json({ ...cached, stale: true, warning: "Berita belum berhasil diperbarui; menampilkan hasil tersimpan." });
    }
    return res.status(502).json({ error: "Berita belum dapat dimuat. Coba perbarui beberapa saat lagi." });
  } finally {
    if (newsRequests.get(cacheKey) === newsRequest) newsRequests.delete(cacheKey);
  }
});

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

app.get("/api/market/investor-signals/:ticker", async (req, res) => {
  const ticker = String(req.params.ticker).toUpperCase();
  if (!marketInstruments.some((instrument) => instrument.ticker === ticker)) {
    return res.status(400).json({ error: "Sinyal investor hanya tersedia untuk emiten, bukan indeks atau ticker yang tidak terdaftar." });
  }

  const cached = investorSignalCache.get(ticker);
  if (cached && Date.now() - cached.generatedAt < investorSignalCacheTtl) {
    return res.json(cached);
  }
  let request = investorSignalRequests.get(ticker);
  if (!request) {
    request = loadInvestorSignals(ticker).then((signals) => {
      investorSignalCache.set(ticker, signals);
      if (investorSignalCache.size > 100) investorSignalCache.delete(investorSignalCache.keys().next().value);
      return signals;
    });
    investorSignalRequests.set(ticker, request);
  }
  try {
    return res.json(await request);
  } catch (error) {
    console.error(`Investor signal error (${ticker}):`, error.message);
    return res.status(502).json({ error: "Sinyal investor belum dapat dihitung. Periksa koneksi data dan coba lagi." });
  } finally {
    if (investorSignalRequests.get(ticker) === request) investorSignalRequests.delete(ticker);
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
