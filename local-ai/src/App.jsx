import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const periods = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "All"];
const marketPollInterval = 10_000;
const emptyArray = [];
const popularQuestions = [
  "Ringkas kondisi saham ini",
  "Apa risiko yang perlu diperhatikan?",
  "Jelaskan indikator teknikal di chart",
];

async function readApiResponse(response) {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`Server mengirim respons kosong (HTTP ${response.status}). Pastikan backend aktif.`);
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`Server mengirim respons yang bukan JSON (HTTP ${response.status}). Pastikan backend aktif.`);
  }
}

function formatPrice(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

function formatVolume(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function formatChange(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2).replace(".", ",")}%`;
}

function formatTime(timestamp) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatQuoteAge(timestamp) {
  if (!Number.isFinite(timestamp)) return "waktu data tidak tersedia";
  const ageSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (ageSeconds < 60) return "kuotasi baru saja";
  if (ageSeconds < 3600) return `data ${Math.floor(ageSeconds / 60)} menit tertinggal`;
  return `data ${Math.floor(ageSeconds / 3600)} jam tertinggal`;
}

function formatChartDate(timestamp, period) {
  if (!timestamp) return "—";
  if (period === "1D") return formatTime(timestamp);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(timestamp);
}

function getTechnicalSnapshot(candles) {
  if (!candles.length) return null;
  const latest = candles.at(-1);
  const recent = candles.slice(-20);
  const recentCandles = candles.slice(-15);
  const changes = recentCandles.slice(1).map((candle, index) => candle.close - recentCandles[index].close);
  const gains = changes.reduce((total, change) => total + Math.max(change, 0), 0);
  const losses = changes.reduce((total, change) => total + Math.max(-change, 0), 0);
  const rsi = losses === 0 ? (gains === 0 ? 50 : 100) : 100 - 100 / (1 + gains / losses);
  const trueRanges = recentCandles.slice(1).map((candle, index) => {
    const previousClose = recentCandles[index].close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previousClose), Math.abs(candle.low - previousClose));
  });
  const atr = trueRanges.length ? trueRanges.reduce((total, range) => total + range, 0) / trueRanges.length : null;
  const recentVolumes = candles.slice(-3).map((candle) => candle.volume).filter(Number.isFinite);
  const baselineVolumes = candles.slice(-15, -3).map((candle) => candle.volume).filter(Number.isFinite);
  const volumeRatio = recentVolumes.length && baselineVolumes.length
    ? (recentVolumes.reduce((total, volume) => total + volume, 0) / recentVolumes.length)
      / (baselineVolumes.reduce((total, volume) => total + volume, 0) / baselineVolumes.length || 1)
    : null;
  const ema9 = candles.slice(0, 9).reduce((average, candle) => average + candle.close, 0) / Math.min(candles.length, 9);
  const emaMultiplier = 2 / 10;
  const ema = candles.slice(9).reduce((average, candle) => ((candle.close - average) * emaMultiplier) + average, ema9);
  return {
    rsi,
    atr,
    volumeRatio,
    support: Math.min(...recent.map((candle) => candle.low)),
    resistance: Math.max(...recent.map((candle) => candle.high)),
    ema9: ema,
    lastMove: latest.close - latest.open,
  };
}

function pathFor(values, width, height, padding = 0) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.max(Math.abs(max) * 0.01, 1);
  return values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${index ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function averageLine(points, period, xFor, yFor) {
  const values = [];
  for (let index = period - 1; index < points.length; index += 1) {
    const average = points.slice(index - period + 1, index + 1)
      .reduce((total, point) => total + point.close, 0) / period;
    values.push(`${values.length ? "L" : "M"} ${xFor(index).toFixed(2)} ${yFor(average).toFixed(2)}`);
  }
  return values.join(" ");
}

function Icon({ name, size = 16 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  const paths = {
    chart: <><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 6-7" /></>,
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><rect x="13.5" y="13.5" width="7" height="7" rx="1" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4h8v3M3 12h18m-11 0v2h4v-2" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" /></>,
    send: <><path d="m21 3-7.5 18-3.8-7.7L2 9.5z" /><path d="M21 3 9.7 13.3" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4.9 9a7.5 7.5 0 0 1 12.4-2L20 12M4 17v-5h5" /><path d="M19.1 15a7.5 7.5 0 0 1-12.4 2L4 12" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    candles: <><path d="M6 3v18m-3-9h6m6-9v18m-3-13h6" /><rect x="4" y="8" width="4" height="8" /><rect x="13" y="6" width="4" height="5" /></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
}

function SymbolLogo({ ticker, color }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallback = ticker === "IHSG" ? "▤" : ticker.slice(0, 2);

  return (
    <span className={`symbol-logo ${ticker !== "IHSG" && imageFailed ? "ticker-monogram" : ""}`} style={{ "--symbol-color": color }} aria-hidden="true">
      <span className="symbol-logo-fallback">{fallback}</span>
      {ticker !== "IHSG" && !imageFailed && (
        <img
          className="issuer-logo-image"
          src={`/issuer-logos/${ticker}.png`}
          alt=""
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  );
}

function Sparkline({ values, positive }) {
  const path = pathFor(values ?? emptyArray, 76, 24, 2);
  return <svg className={`watch-spark ${positive ? "up" : "down"}`} viewBox="0 0 76 24" aria-hidden="true"><path d={path} /></svg>;
}

function CandleChart({ candles, period, visibleCount, showAverages, showVolume, showRsi, drawings, activeTool, pendingPoint, aiSignal, onChartClick, onZoom }) {
  const chartRef = useRef(null);
  const visible = candles.slice(-visibleCount);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return undefined;
    const handleWheel = (event) => {
      event.preventDefault();
      onZoom(event.deltaY < 0 ? "in" : "out");
    };
    chart.addEventListener("wheel", handleWheel, { passive: false });
    return () => chart.removeEventListener("wheel", handleWheel);
  });

  if (!visible.length) return <div className="chart-placeholder">Menunggu data grafik...</div>;

  const chartWidth = 1000;
  const left = 62;
  const right = 82;
  const plotWidth = chartWidth - left - right;
  const plotTop = 30;
  const plotBottom = 354;
  const volumeTop = 374;
  const volumeBottom = showRsi ? 452 : 522;
  const rsiTop = 475;
  const rsiBottom = 546;
  const highs = visible.map((point) => point.high);
  const lows = visible.map((point) => point.low);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const pad = (max - min || Math.abs(max) * 0.015) * 0.08;
  const chartMin = min - pad;
  const chartMax = max + pad;
  const range = chartMax - chartMin || 1;
  const step = plotWidth / visible.length;
  const candleWidth = Math.max(2, Math.min(11, step * 0.68));
  const xFor = (index) => left + step * (index + 0.5);
  const yFor = (value) => plotBottom - ((value - chartMin) / range) * (plotBottom - plotTop);
  const volumes = visible.map((point) => point.volume ?? 0);
  const maxVolume = Math.max(...volumes, 1);
  const ma20 = showAverages && visible.length >= 20 ? averageLine(visible, 20, xFor, yFor) : "";
  const ma50 = showAverages && visible.length >= 50 ? averageLine(visible, 50, xFor, yFor) : "";
  const rsiValues = visible.map((point, index) => {
    if (index < 14) return 50;
    let gains = 0;
    let losses = 0;
    for (let cursor = index - 13; cursor <= index; cursor += 1) {
      const delta = visible[cursor].close - visible[cursor - 1].close;
      if (delta > 0) gains += delta;
      else losses -= delta;
    }
    if (losses === 0) return 100;
    const relativeStrength = gains / losses;
    return 100 - 100 / (1 + relativeStrength);
  });
  const rsiPath = pathFor(rsiValues.map((value) => rsiTop + ((100 - value) / 100) * (rsiBottom - rsiTop)), chartWidth - left - right, 1);
  const dateLabels = Array.from({ length: 6 }, (_, index) => {
    const point = visible[Math.round((index / 5) * (visible.length - 1))];
    return point ? { x: xFor(Math.round((index / 5) * (visible.length - 1))), label: formatChartDate(point.time, period) } : null;
  }).filter((item, index, labels) => item && labels.findIndex((label) => label?.label === item.label) === index);

  return (
    <svg ref={chartRef} className={`candle-svg ${activeTool !== "select" ? "drawing-active" : ""}`} viewBox={`0 0 ${chartWidth} ${showRsi ? 575 : 540}`} preserveAspectRatio="none" role="img" aria-label={`Grafik candlestick periode ${period}`} onClick={(event) => onChartClick(event, { chartWidth, chartHeight: showRsi ? 575 : 540, left, right, plotTop, plotBottom })}>
      {[0, 1, 2, 3, 4].map((index) => {
        const y = plotTop + (index / 4) * (plotBottom - plotTop);
        const value = chartMax - (index / 4) * range;
        return <g key={`grid-${index}`}><line x1={left} x2={chartWidth - right} y1={y} y2={y} className="terminal-grid" /><text x={chartWidth - right + 8} y={y + 3} className="axis-label">{formatPrice(value)}</text></g>;
      })}
      {visible.map((point, index) => {
        const x = xFor(index);
        const rising = point.close >= point.open;
        const color = rising ? "#00b87a" : "#ed4c5c";
        const top = yFor(Math.max(point.open, point.close));
        const bottom = yFor(Math.min(point.open, point.close));
        const height = Math.max(1.5, bottom - top);
        const volumeHeight = (volumes[index] / maxVolume) * (volumeBottom - volumeTop);
        return <g key={`${point.time}-${index}`}>
          <line x1={x} x2={x} y1={yFor(point.high)} y2={yFor(point.low)} stroke={color} strokeWidth="1" />
          <rect x={x - candleWidth / 2} y={top} width={candleWidth} height={height} fill={color} />
          {showVolume && <rect x={x - candleWidth / 2} y={volumeBottom - volumeHeight} width={candleWidth} height={Math.max(volumeHeight, 1)} fill={color} opacity=".65" />}
        </g>;
      })}
      {ma20 && <path d={ma20} className="ma-line ma-20" />}
      {ma50 && <path d={ma50} className="ma-line ma-50" />}
      <line x1={left} x2={chartWidth - right} y1={yFor(visible.at(-1).close)} y2={yFor(visible.at(-1).close)} className="price-guide" />
      {aiSignal && ["BUY", "SELL"].includes(aiSignal.signal) && (() => {
        const isBuy = aiSignal.signal === "BUY";
        const point = visible.at(-1);
        const markerY = Math.max(plotTop + 14, Math.min(plotBottom - 14, isBuy ? yFor(point.low) + 20 : yFor(point.high) - 20));
        const arrowPath = isBuy
          ? "M 0 -12 L 10 -2 L 5 -2 L 5 10 L -5 10 L -5 -2 L -10 -2 Z"
          : "M 0 12 L 10 2 L 5 2 L 5 -10 L -5 -10 L -5 2 L -10 2 Z";
        return <g className={`trade-marker ai-trade-marker ${isBuy ? "buy-marker" : "sell-marker"}`} transform={`translate(${xFor(visible.length - 1)} ${markerY})`} aria-label={`Sinyal AI ${aiSignal.signal}`}>
          <path d={arrowPath} />
          <text x="13" y="4">AI {aiSignal.signal}</text>
        </g>;
      })()}
      {drawings.map((drawing) => {
        if (drawing.type === "horizontal") {
          return <g key={drawing.id}><line x1={left} x2={chartWidth - right} y1={drawing.y} y2={drawing.y} className="chart-drawing horizontal-drawing" /><text x={chartWidth - right + 8} y={drawing.y - 4} className="drawing-label">{formatPrice(chartMax - ((drawing.y - plotTop) / (plotBottom - plotTop)) * range)}</text></g>;
        }
        return <line key={drawing.id} x1={drawing.x1} y1={drawing.y1} x2={drawing.x2} y2={drawing.y2} className="chart-drawing trend-drawing" />;
      })}
      {pendingPoint?.ticker && <circle cx={pendingPoint.x} cy={pendingPoint.y} r="4" className="drawing-anchor" />}
      <rect x={chartWidth - right + 3} y={yFor(visible.at(-1).close) - 9} width={right - 8} height="18" rx="2" className="price-tag" />
      <text x={chartWidth - right + 8} y={yFor(visible.at(-1).close) + 3} className="price-tag-label">{formatPrice(visible.at(-1).close)}</text>
      {showVolume && <><line x1={left} x2={chartWidth - right} y1={volumeTop} y2={volumeTop} className="indicator-separator" /><text x={left + 4} y={volumeTop + 13} className="indicator-label">VOLUME</text></>}
      {showRsi && <><line x1={left} x2={chartWidth - right} y1={rsiTop} y2={rsiTop} className="indicator-separator" /><line x1={left} x2={chartWidth - right} y1={rsiTop + (rsiBottom - rsiTop) * .3} y2={rsiTop + (rsiBottom - rsiTop) * .3} className="indicator-guide" /><line x1={left} x2={chartWidth - right} y1={rsiTop + (rsiBottom - rsiTop) * .7} y2={rsiTop + (rsiBottom - rsiTop) * .7} className="indicator-guide" /><text x={left + 4} y={rsiTop + 13} className="indicator-label">RSI 14</text><path d={rsiPath ? rsiValues.map((value, index) => `${index ? "L" : "M"} ${xFor(index).toFixed(2)} ${(rsiTop + ((100 - value) / 100) * (rsiBottom - rsiTop)).toFixed(2)}`).join(" ") : ""} className="rsi-line" /></>}
      {dateLabels.map((item, index) => item && <text key={`date-${index}`} x={item.x} y={showRsi ? 568 : 532} textAnchor="middle" className="axis-label">{item.label}</text>)}
    </svg>
  );
}

export default function App() {
  const [period, setPeriod] = useState("1D");
  const [selectedTicker, setSelectedTicker] = useState("BBRI");
  const [query, setQuery] = useState("");
  const [marketData, setMarketData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [marketError, setMarketError] = useState("");
  const [stockError, setStockError] = useState("");
  const [stockErrorTicker, setStockErrorTicker] = useState("");
  const [aiSignal, setAiSignal] = useState(null);
  const [aiSignalError, setAiSignalError] = useState("");
  const [aiSignalErrorTicker, setAiSignalErrorTicker] = useState("");
  const [aiSignalLoadingTicker, setAiSignalLoadingTicker] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [favoriteTickers, setFavoriteTickers] = useState([]);
  const [removedTickers, setRemovedTickers] = useState([]);
  const [addedTickers, setAddedTickers] = useState([]);
  const [priceMoves, setPriceMoves] = useState({});
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeNavigation, setActiveNavigation] = useState("Watchlist");
  const [showAverages, setShowAverages] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showRsi, setShowRsi] = useState(true);
  const [capital, setCapital] = useState("10000000");
  const [riskPercent, setRiskPercent] = useState("1");
  const [stopPercent, setStopPercent] = useState("1");
  const [rewardRisk, setRewardRisk] = useState("2");
  const [paperJournal, setPaperJournal] = useState([]);
  const [watchlistSort, setWatchlistSort] = useState("change");
  const [chartCandleCount, setChartCandleCount] = useState(110);
  const [activeTool, setActiveTool] = useState("select");
  const [drawingsByTicker, setDrawingsByTicker] = useState({});
  const [pendingPoint, setPendingPoint] = useState(null);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const previousPrices = useRef(new Map());
  const priceFlashTimers = useRef(new Map());
  const aiSignalRequestId = useRef(0);
  const quotes = useMemo(() => {
    const stockQuotes = new Map((marketData?.stocks ?? []).map((quote) => [quote.ticker, quote]));
    if (stockData) stockQuotes.set(stockData.ticker, stockData);
    const watchlistTickers = new Set([
      ...marketData?.stocks.map(({ ticker }) => ticker) ?? [],
      ...addedTickers,
    ]);
    const instruments = marketData?.instruments ?? marketData?.stocks ?? [];
    const stocks = instruments
      .filter(({ ticker }) => watchlistTickers.has(ticker))
      .map((instrument) => stockQuotes.get(instrument.ticker) ?? instrument);
    return [marketData?.index, ...stocks].filter(Boolean);
  }, [marketData, stockData, addedTickers]);
  const visibleQuotes = quotes.filter((quote) => (
    !removedTickers.includes(quote.ticker)
    && (!showFavorites || favoriteTickers.includes(quote.ticker))
    && `${quote.ticker} ${quote.name}`.toLowerCase().includes(query.toLowerCase())
  )).sort((left, right) => watchlistSort === "volume"
    ? (right.volume ?? 0) - (left.volume ?? 0)
    : (right.changePercent ?? -Infinity) - (left.changePercent ?? -Infinity));
  const searchResults = query.trim()
    ? (marketData?.instruments ?? [])
      .filter((instrument) => (
        !quotes.some((quote) => quote.ticker === instrument.ticker)
        && `${instrument.ticker} ${instrument.name} ${instrument.sector}`.toLowerCase().includes(query.trim().toLowerCase())
      ))
      .slice(0, 12)
    : emptyArray;
  const selectedStockData = stockData?.ticker === selectedTicker ? stockData : null;
  const selectedQuote = quotes.find((quote) => quote.ticker === selectedTicker) ?? selectedStockData;
  const candles = selectedStockData?.range === period ? selectedStockData.chart : emptyArray;
  const selectedAiSignal = aiSignal?.ticker === selectedTicker ? aiSignal : null;
  const visibleAiSignalError = aiSignalErrorTicker === selectedTicker ? aiSignalError : "";
  const visibleStockError = stockErrorTicker === selectedTicker ? stockError : "";
  const latestCandle = candles.at(-1);
  const technicalSnapshot = useMemo(() => getTechnicalSnapshot(candles), [candles]);
  const entryPrice = selectedStockData?.price ?? selectedQuote?.price;
  const capitalValue = Number(capital);
  const riskValue = Number(riskPercent);
  const stopValue = Number(stopPercent);
  const rewardRiskValue = Number(rewardRisk);
  const riskAmount = capitalValue > 0 && riskValue > 0 && riskValue <= 100 ? capitalValue * riskValue / 100 : 0;
  const stopDistance = Number.isFinite(entryPrice) && stopValue > 0 ? entryPrice * stopValue / 100 : 0;
  const lotSize = stopDistance > 0 ? Math.max(0, Math.floor(riskAmount / (stopDistance * 100))) : 0;
  const targetPrice = Number.isFinite(entryPrice) && stopDistance > 0 && rewardRiskValue > 0
    ? entryPrice + stopDistance * rewardRiskValue
    : NaN;
  const currentDrawings = drawingsByTicker[selectedTicker] ?? emptyArray;
  const isFavorite = favoriteTickers.includes(selectedTicker);
  const isInWatchlist = !removedTickers.includes(selectedTicker);
  const watchlistCount = quotes.filter((quote) => !removedTickers.includes(quote.ticker)).length;
  const priceMoveClass = (ticker) => {
    const direction = priceMoves[ticker];
    return direction ? `price-flash-${direction}` : "";
  };

  useEffect(() => {
    const trackedQuotes = new Map(quotes.map((quote) => [quote.ticker, quote]));
    if (stockData) trackedQuotes.set(stockData.ticker, stockData);

    for (const quote of trackedQuotes.values()) {
      if (!Number.isFinite(quote.price)) continue;

      const previous = previousPrices.current.get(quote.ticker);
      if (previous && Number.isFinite(quote.quoteTime) && Number.isFinite(previous.quoteTime) && quote.quoteTime < previous.quoteTime) {
        continue;
      }

      previousPrices.current.set(quote.ticker, { price: quote.price, quoteTime: quote.quoteTime });
      if (!previous || quote.price === previous.price) continue;

      const direction = quote.price > previous.price ? "up" : "down";
      setPriceMoves((current) => ({ ...current, [quote.ticker]: direction }));
      const existingTimer = priceFlashTimers.current.get(quote.ticker);
      if (existingTimer) window.clearTimeout(existingTimer);
      const timer = window.setTimeout(() => {
        setPriceMoves((current) => {
          const next = { ...current };
          delete next[quote.ticker];
          return next;
        });
        priceFlashTimers.current.delete(quote.ticker);
      }, 1_200);
      priceFlashTimers.current.set(quote.ticker, timer);
    }
  }, [quotes, stockData]);

  useEffect(() => () => {
    for (const timer of priceFlashTimers.current.values()) window.clearTimeout(timer);
  }, []);

  function changeChartZoom(direction) {
    setChartCandleCount((current) => {
      const maximum = Math.max(20, candles.length);
      const next = direction === "in"
        ? Math.floor(current / 1.25)
        : Math.ceil(current * 1.25);
      return Math.max(20, Math.min(maximum, next));
    });
  }

  function selectStock(ticker) {
    setSelectedTicker(ticker);
    setChartCandleCount(110);
  }

  function refreshData() {
    setRefreshVersion((version) => version + 1);
  }

  function focusAnalysis() {
    setActiveNavigation("Analisis");
    document.querySelector("#ai-composer")?.focus();
  }

  function toggleFavorite(ticker) {
    setFavoriteTickers((current) => (
      current.includes(ticker)
        ? current.filter((item) => item !== ticker)
        : [...current, ticker]
    ));
  }

  async function requestAiSignal(ticker) {
    const requestId = aiSignalRequestId.current + 1;
    aiSignalRequestId.current = requestId;
    setAiSignalLoadingTicker(ticker);
    setAiSignalError("");
    setAiSignalErrorTicker("");
    try {
      const response = await fetch(`/api/market/signals/${ticker}`, { cache: "no-store" });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || `Analisis AI gagal (HTTP ${response.status}).`);
      if (
        data.ticker !== ticker
        || !["BUY", "SELL", "WAIT"].includes(data.signal)
        || typeof data.rationale !== "string"
        || !Number.isFinite(data.confidence)
      ) {
        throw new Error("Respons sinyal AI tidak lengkap.");
      }
      if (requestId === aiSignalRequestId.current) {
        setAiSignal(data);
        setAiSignalError("");
        setAiSignalErrorTicker("");
      }
    } catch {
      if (requestId === aiSignalRequestId.current) {
        setAiSignalError("Analisis belum tersedia. Coba lagi beberapa saat.");
        setAiSignalErrorTicker(ticker);
      }
    } finally {
      if (requestId === aiSignalRequestId.current) setAiSignalLoadingTicker("");
    }
  }

  function recordPaperPlan() {
    if (!Number.isFinite(entryPrice) || lotSize <= 0 || !Number.isFinite(targetPrice)) return;
    setPaperJournal((current) => [{
      id: `${Date.now()}-${selectedTicker}`,
      ticker: selectedTicker,
      time: Date.now(),
      entry: entryPrice,
      stop: entryPrice - stopDistance,
      target: targetPrice,
      lots: lotSize,
    }, ...current].slice(0, 20));
  }

  function handleChartClick(event, chartBounds) {
    if (activeTool === "select" || !candles.length) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * chartBounds.chartWidth;
    const y = ((event.clientY - bounds.top) / bounds.height) * chartBounds.chartHeight;
    if (x < chartBounds.left || x > chartBounds.chartWidth - chartBounds.right || y < chartBounds.plotTop || y > chartBounds.plotBottom) return;

    if (activeTool === "horizontal") {
      setDrawingsByTicker((current) => ({
        ...current,
        [selectedTicker]: [...(current[selectedTicker] ?? []), { id: `${Date.now()}-${(current[selectedTicker] ?? []).length}`, type: "horizontal", y }],
      }));
      return;
    }

    if (pendingPoint?.ticker === selectedTicker) {
      setDrawingsByTicker((current) => ({
        ...current,
        [selectedTicker]: [...(current[selectedTicker] ?? []), { id: `${Date.now()}-${(current[selectedTicker] ?? []).length}`, type: "trend", x1: pendingPoint.x, y1: pendingPoint.y, x2: x, y2: y }],
      }));
      setPendingPoint(null);
    } else {
      setPendingPoint({ ticker: selectedTicker, x, y });
    }
  }

  function selectChartTool(tool) {
    setActiveTool(tool);
    setPendingPoint(null);
  }

  useEffect(() => {
    let active = true;
    let pending = false;
    async function refreshMarket() {
      if (pending) return;
      pending = true;
      setRefreshing(true);
      try {
        const response = await fetch(`/api/market?range=${period}`, { cache: "no-store" });
        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.error || `Gagal memuat pasar (HTTP ${response.status}).`);
        if (active) {
          setMarketData(data);
          setMarketError(data.warning || "");
        }
      } catch (error) {
        if (active) setMarketError(error.message);
      } finally {
        pending = false;
        if (active) setRefreshing(false);
      }
    }
    refreshMarket();
    const timer = window.setInterval(refreshMarket, marketPollInterval);
    return () => { active = false; window.clearInterval(timer); };
  }, [period, refreshVersion]);

  useEffect(() => {
    let active = true;
    let pending = false;
    async function refreshStock() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(`/api/market/stocks/${selectedTicker}?range=${period}`, { cache: "no-store" });
        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.error || `Grafik tidak tersedia (HTTP ${response.status}).`);
        if (!Array.isArray(data.chart) || !Number.isFinite(data.price)) throw new Error("Data chart belum lengkap.");
        if (active) {
          setStockData(data);
          setStockError(data.warning || "");
          setStockErrorTicker(selectedTicker);
        }
      } catch (error) {
        if (active) {
          setStockError(error.message);
          setStockErrorTicker(selectedTicker);
        }
      } finally {
        pending = false;
      }
    }
    refreshStock();
    const timer = window.setInterval(refreshStock, marketPollInterval);
    return () => { active = false; window.clearInterval(timer); };
  }, [selectedTicker, period, refreshVersion]);

  async function sendMessage(event, suggestedText) {
    event?.preventDefault();
    const text = (suggestedText ?? prompt).trim();
    if (!text || loading) return;
    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setPrompt("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, selectedTicker }),
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || `AI gagal menjawab (HTTP ${response.status}).`);
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("AI mengirim jawaban kosong.");
      setMessages([...history, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages([...history, { role: "assistant", content: `AI tidak tersedia: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="trading-terminal">
      <header className="terminal-topbar">
        <a className="terminal-logo" href="#" aria-label="Nalar analisis"><span><Icon name="chart" size={17} /></span></a>
        <div className="active-symbol"><SymbolLogo key={selectedTicker} ticker={selectedTicker} color={selectedQuote?.color ?? "#168bcc"} /><strong>{selectedTicker}</strong><span>{selectedQuote?.name ?? "Memuat saham..."}</span><b className="leverage-tag">IDX</b><span className={`quote-change ${selectedQuote?.changePercent >= 0 ? "positive" : "negative"} ${priceMoveClass(selectedTicker)}`}>{selectedQuote ? `${formatPrice(selectedQuote.price)}  ${formatChange(selectedQuote.changePercent)}` : ""}</span></div>
        <div className="topbar-actions">
          <span className="connection-indicator"><i /> {refreshing ? "Memperbarui" : "Data pasar"}</span>
          <button className="top-icon-button" title="Perbarui data" aria-label="Perbarui data" onClick={refreshData}><Icon name="refresh" size={15} /></button>
          <button className="top-icon-button ai-shortcut" title="Tanya Nalar AI" aria-label="Tanya Nalar AI" onClick={focusAnalysis}><Icon name="spark" size={15} /></button>
        </div>
      </header>

      <div className="terminal-layout">
        <nav className="terminal-rail" aria-label="Menu">
          {[["Watchlist", "grid"], ["Chart", "chart"], ["Analisis", "spark"]].map(([label, icon]) => <button className={`rail-button ${activeNavigation === label ? "selected" : ""}`} aria-pressed={activeNavigation === label} key={label} title={label} onClick={() => { if (label === "Analisis") focusAnalysis(); else { setActiveNavigation(label); document.querySelector(label === "Chart" ? ".chart-workspace" : ".watchlist-panel")?.scrollIntoView({ behavior: "smooth" }); } }}><Icon name={icon} size={17} /><span>{label}</span></button>)}
          <div className="rail-spacer" />
          <span className="rail-caption">Data dapat tertunda · Bukan rekomendasi investasi</span>
        </nav>

        <aside className="watchlist-panel">
          <div className="watchlist-title"><h1>Watchlist</h1></div>
          <div className="watchlist-controls">
            <button className="watchlist-filter" aria-pressed={showFavorites} onClick={() => setShowFavorites((value) => !value)}>{showFavorites ? "Favorit" : "Semua saham"} <span>⌄</span></button>
            <select className="watchlist-sort" aria-label="Urutkan saham" value={watchlistSort} onChange={(event) => setWatchlistSort(event.target.value)}>
              <option value="change">% naik</option>
              <option value="volume">Volume</option>
            </select>
            <button className="refresh-watchlist" title="Perbarui data" aria-label="Perbarui data" onClick={refreshData}><Icon name="refresh" size={13} /></button>
            <button className="watchlist-add" title={isInWatchlist ? `Hapus ${selectedTicker} dari watchlist` : `Tambahkan ${selectedTicker} ke watchlist`} aria-label={isInWatchlist ? `Hapus ${selectedTicker} dari watchlist` : `Tambahkan ${selectedTicker} ke watchlist`} onClick={() => setRemovedTickers((current) => (isInWatchlist ? [...current, selectedTicker] : current.filter((ticker) => ticker !== selectedTicker)))}>{isInWatchlist ? "−" : "＋"}</button>
          </div>
          <label className="watchlist-search"><Icon name="search" size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari ticker..." /></label>
          <div className="watchlist-columns"><span>INSTRUMEN</span><span>HARGA / PERUBAHAN</span></div>
          <div className="watchlist-scroll">
            {visibleQuotes.map((quote) => <button key={quote.ticker} className={`watch-row ${selectedTicker === quote.ticker ? "active" : ""}`} title={`Pilih ${quote.ticker} dan minta analisis sinyal AI`} onClick={() => { selectStock(quote.ticker); requestAiSignal(quote.ticker); }}>
              <SymbolLogo ticker={quote.ticker} color={quote.color} />
              <span className="watch-name"><strong>{quote.ticker}</strong><small>{quote.name}</small></span>
              {quote.sparkline?.length > 1 && <Sparkline values={quote.sparkline} positive={quote.changePercent >= 0} />}
              <span className="watch-quote"><strong className={priceMoveClass(quote.ticker)}>{formatPrice(quote.price)}</strong><small className={Number.isFinite(quote.changePercent) ? quote.changePercent >= 0 ? "positive" : "negative" : ""}>{Number.isFinite(quote.changePercent) ? `${quote.change >= 0 ? "↗" : "↘"} ${formatChange(quote.changePercent)}` : quote.sector}</small></span>
            </button>)}
            {searchResults.length > 0 && <div className="watchlist-search-heading">EMITEN LAINNYA · KLIK UNTUK MENAMBAHKAN</div>}
            {searchResults.map((instrument) => <button key={instrument.ticker} className="watch-row watch-row-search-result" onClick={() => {
              setAddedTickers((current) => current.includes(instrument.ticker) ? current : [...current, instrument.ticker]);
              setRemovedTickers((current) => current.filter((ticker) => ticker !== instrument.ticker));
              selectStock(instrument.ticker);
              requestAiSignal(instrument.ticker);
              setQuery("");
            }}>
              <SymbolLogo ticker={instrument.ticker} color={instrument.color} />
              <span className="watch-name"><strong>{instrument.ticker}</strong><small>{instrument.name}</small></span>
              <span className="watch-quote"><strong>＋ Tambah</strong><small>{instrument.sector}</small></span>
            </button>)}
            {!visibleQuotes.length && !searchResults.length && <div className="watchlist-empty">{marketError || (showFavorites ? "Belum ada saham favorit." : "Saham tidak ditemukan.")}</div>}
          </div>
          <div className="watchlist-foot"><span><i /> {watchlistCount} instrumen</span><span>Yahoo Finance · delay mungkin terjadi</span></div>
        </aside>

        <section className="chart-workspace">
          <div className="chart-tabs">
            <button className="active">Chart</button><button onClick={focusAnalysis}>AI Analysis <span className="ai-tab-dot" /></button>
            <span className="chart-tab-spacer" />
            <span className="selected-company">{selectedQuote?.name ?? selectedTicker}</span>
          </div>
          <div className="chart-toolbar">
            <div className="period-controls">{periods.map((item) => <button key={item} className={period === item ? "active" : ""} onClick={() => { setPeriod(item); setChartCandleCount(110); }}>{item}</button>)}</div>
            <span className="toolbar-divider" />
            <span className="toolbar-action is-active" title="Tampilan candlestick"><Icon name="candles" size={15} /><span>Candles</span></span>
            <button className={`toolbar-action ${showAverages ? "is-active" : ""}`} onClick={() => setShowAverages((value) => !value)}><span className="indicator-glyph">ƒx</span><span>MA</span></button>
            <button className={`toolbar-action ${showVolume ? "is-active" : ""}`} onClick={() => setShowVolume((value) => !value)}><span className="volume-glyph">▥</span><span>Volume</span></button>
            <button className={`toolbar-action ${showRsi ? "is-active" : ""}`} onClick={() => setShowRsi((value) => !value)}><span className="rsi-glyph">RSI</span></button>
            <span className="toolbar-divider" />
            <button className="chart-zoom-button" type="button" title="Perbesar chart (scroll ke atas)" aria-label="Perbesar chart" disabled={chartCandleCount <= 20} onClick={() => changeChartZoom("in")}>+</button>
            <span className="chart-zoom-level" aria-live="polite">{Math.min(chartCandleCount, candles.length)} bar</span>
            <button className="chart-zoom-button" type="button" title="Perkecil chart (scroll ke bawah)" aria-label="Perkecil chart" disabled={chartCandleCount >= candles.length} onClick={() => changeChartZoom("out")}>−</button>
            <button className="chart-zoom-reset" type="button" title="Kembalikan zoom chart" onClick={() => setChartCandleCount(110)}>Reset</button>
            <span className="toolbar-divider" />
            <button className={`toolbar-action ${activeTool === "select" ? "is-active" : ""}`} aria-pressed={activeTool === "select"} title="Mode pilih, nonaktifkan alat gambar" onClick={() => selectChartTool("select")}>Pilih</button>
            <button className={`toolbar-action ${activeTool === "trend" ? "is-active" : ""}`} aria-pressed={activeTool === "trend"} title="Gambar trendline: pilih dua titik di chart" onClick={() => selectChartTool(activeTool === "trend" ? "select" : "trend")}><span className="drawing-glyph">／</span><span>Trendline</span></button>
            <button className={`toolbar-action ${activeTool === "horizontal" ? "is-active" : ""}`} aria-pressed={activeTool === "horizontal"} title="Gambar garis harga: pilih satu titik di chart" onClick={() => selectChartTool(activeTool === "horizontal" ? "select" : "horizontal")}><span className="drawing-glyph">—</span><span>Garis harga</span></button>
            <button className="toolbar-action" title="Hapus gambar terakhir" disabled={!currentDrawings.length} onClick={() => setDrawingsByTicker((current) => ({ ...current, [selectedTicker]: currentDrawings.slice(0, -1) }))}>Undo</button>
            <button className="toolbar-action" title="Hapus semua gambar pada saham ini" disabled={!currentDrawings.length} onClick={() => { setDrawingsByTicker((current) => ({ ...current, [selectedTicker]: [] })); setPendingPoint(null); }}>Hapus gambar</button>
            <span className="toolbar-spacer" />
            <button className="chart-tab-icon" title="Perbarui data" aria-label="Perbarui data" onClick={refreshData}><Icon name="refresh" size={14} /></button>
            <span className="quote-time">{selectedStockData ? `${formatTime(selectedStockData.quoteTime)} WIB` : "Mengambil data..."}</span>
          </div>

          {marketError && <div className="inline-error" role="status">{marketError}</div>}
          {visibleStockError && !selectedStockData && <div className="inline-error" role="alert">{visibleStockError}</div>}
          <div className={`ai-signal-banner ${selectedAiSignal ? `signal-${selectedAiSignal.signal.toLowerCase()}` : ""}`} role="status">
            <strong>{selectedAiSignal ? `AI ${selectedAiSignal.signal}` : aiSignalLoadingTicker === selectedTicker ? "AI sedang menganalisis..." : visibleAiSignalError ? "Analisis tertunda" : "Sinyal AI"}</strong>
            <span>{selectedAiSignal ? `${selectedAiSignal.rationale} · keyakinan ${selectedAiSignal.confidence}%` : aiSignalLoadingTicker === selectedTicker ? `Menganalisis ${selectedTicker} berdasarkan data teknikal.` : visibleAiSignalError || `Klik emiten di watchlist untuk meminta analisis ${selectedTicker}.`}</span>
            <small>{selectedAiSignal ? `Sumber ${selectedAiSignal.provider}, data ${formatTime(selectedAiSignal.quoteTime)} WIB · dapat tertunda · bukan rekomendasi personal` : "Data sumber mungkin tertunda; sinyal bukan rekomendasi personal."}</small>
          </div>

          <div className="chart-heading">
            <div className="chart-instrument-title"><SymbolLogo key={selectedTicker} ticker={selectedTicker} color={selectedQuote?.color ?? "#168bcc"} /><strong>{selectedTicker}</strong><span>{selectedQuote?.name}</span><b className="instrument-pill">IDX</b></div>
            <div className="chart-ohlc">
              <span>O <b>{formatPrice(selectedStockData?.open ?? latestCandle?.open)}</b></span>
              <span>H <b className="positive">{formatPrice(selectedStockData?.dayHigh ?? latestCandle?.high)}</b></span>
              <span>L <b className="negative">{formatPrice(selectedStockData?.dayLow ?? latestCandle?.low)}</b></span>
              <span>C <b className={priceMoveClass(selectedTicker)}>{formatPrice(selectedStockData?.price ?? latestCandle?.close)}</b></span>
              <span className={selectedStockData?.changePercent >= 0 ? "positive" : "negative"}>{formatChange(selectedStockData?.changePercent)}</span>
            </div>
          </div>

          <div className="legend-row"><span className="legend-name">{selectedTicker} · {period} · Yahoo Finance</span>{showAverages && <span className="legend-ma"><i /> MA 20 <i className="ma-gold" /> MA 50</span>}<span className="legend-price">Harga {formatPrice(selectedStockData?.price)}</span></div>
          <div className="candles-container">
            {candles.length ? <CandleChart candles={candles} period={period} visibleCount={Math.min(chartCandleCount, candles.length)} showAverages={showAverages} showVolume={showVolume} showRsi={showRsi} drawings={currentDrawings} activeTool={activeTool} pendingPoint={pendingPoint?.ticker === selectedTicker ? pendingPoint : null} aiSignal={selectedAiSignal} onChartClick={handleChartClick} onZoom={changeChartZoom} /> : <div className="chart-placeholder">{visibleStockError || "Mengambil chart saham..."}</div>}
          </div>
          <div className="drawing-status" aria-live="polite">{activeTool === "trend" ? pendingPoint?.ticker === selectedTicker ? "Pilih titik akhir trendline" : "Pilih titik awal trendline" : activeTool === "horizontal" ? "Klik chart untuk menambahkan garis harga" : `${currentDrawings.length} anotasi chart · Mode pilih`}</div>
          <div className="chart-bottom"><span>{candles.length ? `${formatChartDate(candles[Math.max(0, candles.length - Math.min(chartCandleCount, candles.length))]?.time, period)} – ${formatChartDate(candles.at(-1)?.time, period)} · Yahoo Finance` : "Data Yahoo Finance dapat tertunda · bukan feed real-time resmi"}</span><span>{selectedStockData ? `${formatQuoteAge(selectedStockData.quoteTime)} · dicek tiap 10 dtk` : "Menunggu data"}</span></div>
        </section>

        <aside className="market-sidepanel">
          <section className="quote-card">
            <div className="quote-card-title"><SymbolLogo key={selectedTicker} ticker={selectedTicker} color={selectedQuote?.color ?? "#168bcc"} /><strong>{selectedTicker}</strong><b className="instrument-pill">IDX</b><span className="quote-card-spacer" /><button title={isFavorite ? "Hapus dari favorit" : "Tambahkan ke favorit"} aria-label={isFavorite ? "Hapus dari favorit" : "Tambahkan ke favorit"} aria-pressed={isFavorite} onClick={() => toggleFavorite(selectedTicker)}>{isFavorite ? "★" : "☆"}</button></div>
            <div className="quote-big-price"><span className={priceMoveClass(selectedTicker)}>{formatPrice(selectedStockData?.price ?? selectedQuote?.price)}</span><span className={selectedStockData?.changePercent >= 0 ? "positive" : "negative"}>{selectedStockData ? formatChange(selectedStockData.changePercent) : formatChange(selectedQuote?.changePercent)}</span></div>
            <div className="quote-grid">
              <span>Open <b>{formatPrice(selectedStockData?.open ?? selectedQuote?.open)}</b></span><span>Prev <b>{formatPrice(selectedStockData?.previousClose ?? selectedQuote?.previousClose)}</b></span>
              <span>High <b className="positive">{formatPrice(selectedStockData?.dayHigh ?? selectedQuote?.dayHigh)}</b></span><span>Volume <b>{formatVolume(selectedStockData?.volume ?? selectedQuote?.volume)}</b></span>
              <span>Low <b className="negative">{formatPrice(selectedStockData?.dayLow ?? selectedQuote?.dayLow)}</b></span><span>Avg <b>—</b></span>
            </div>
            <div className="market-source-line"><i /> Yahoo Finance · {formatQuoteAge(selectedStockData?.quoteTime ?? selectedQuote?.quoteTime)} · {formatTime(selectedStockData?.quoteTime ?? selectedQuote?.quoteTime)} WIB</div>
          </section>

          <section className="scalping-panel" aria-label="Meja scalping dan analisis teknikal">
            <div className="scalp-heading"><div><strong>Scalping desk</strong><small>Analisis teknikal & simulasi risiko</small></div><span>SIMULASI</span></div>
            <div className="scalp-snapshot">
              <div><span>RSI 14</span><strong className={technicalSnapshot?.rsi >= 70 ? "negative" : technicalSnapshot?.rsi <= 30 ? "positive" : ""}>{technicalSnapshot ? technicalSnapshot.rsi.toFixed(1) : "—"}</strong><small>{technicalSnapshot ? technicalSnapshot.rsi >= 70 ? "Jenuh beli" : technicalSnapshot.rsi <= 30 ? "Jenuh jual" : "Netral" : "Data belum cukup"}</small></div>
              <div><span>ATR 14</span><strong>{formatPrice(technicalSnapshot?.atr)}</strong><small>Rentang rata-rata</small></div>
              <div><span>Volume relatif</span><strong>{Number.isFinite(technicalSnapshot?.volumeRatio) ? `${technicalSnapshot.volumeRatio.toFixed(2)}×` : "—"}</strong><small>3 candle vs 12 sebelumnya</small></div>
              <div><span>EMA 9</span><strong>{formatPrice(technicalSnapshot?.ema9)}</strong><small>{Number.isFinite(entryPrice) && technicalSnapshot ? entryPrice >= technicalSnapshot.ema9 ? "Harga di atas EMA" : "Harga di bawah EMA" : "Menunggu data"}</small></div>
            </div>
            <div className="scalp-levels">
              <span>Support 20 bar <b>{formatPrice(technicalSnapshot?.support)}</b></span>
              <span>Resistance 20 bar <b>{formatPrice(technicalSnapshot?.resistance)}</b></span>
            </div>
            <p className="scalp-note">{candles.length ? `${candles.length} candle · ${period} · level dan indikator dihitung dari data chart.` : "Menunggu data chart untuk menghitung indikator."}</p>

            <div className="risk-heading"><strong>Kalkulator posisi</strong><small>Ukuran lot dibulatkan ke bawah (1 lot = 100 saham)</small></div>
            <div className="risk-input-grid">
              <label>Modal (Rp)<input type="number" min="0" step="100000" value={capital} onChange={(event) => setCapital(event.target.value)} /></label>
              <label>Risiko maks. (%)<input type="number" min="0" max="100" step="0.1" value={riskPercent} onChange={(event) => setRiskPercent(event.target.value)} /></label>
              <label>Jarak stop (%)<input type="number" min="0.1" step="0.1" value={stopPercent} onChange={(event) => setStopPercent(event.target.value)} /></label>
              <label>Target R:R<input type="number" min="0.1" step="0.1" value={rewardRisk} onChange={(event) => setRewardRisk(event.target.value)} /></label>
            </div>
            <div className="risk-result-grid">
              <span>Risiko anggaran <b>{formatPrice(riskAmount)}</b></span>
              <span>Ukuran posisi <b>{lotSize.toLocaleString("id-ID")} lot</b></span>
              <span>Stop simulasi <b>{formatPrice(Number(entryPrice) - stopDistance)}</b></span>
              <span>Target simulasi <b>{formatPrice(targetPrice)}</b></span>
            </div>
            <button className="paper-plan-button" type="button" onClick={recordPaperPlan} disabled={lotSize <= 0 || !Number.isFinite(entryPrice) || !Number.isFinite(targetPrice)}>Catat rencana simulasi</button>
            <p className="scalp-disclaimer">Perkiraan edukasi, belum termasuk fee, slippage, fraksi harga, likuiditas, dan risiko gap. Bukan instruksi transaksi.</p>

            <div className="paper-journal-heading"><strong>Jurnal simulasi</strong><span>{paperJournal.length} catatan</span></div>
            {paperJournal.length ? <div className="paper-journal-list">{paperJournal.slice(0, 4).map((item) => <div className="paper-journal-row" key={item.id}><span><b>{item.ticker}</b><small>{new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(item.time)} · {item.lots} lot</small></span><span>Entry {formatPrice(item.entry)}<small>SL {formatPrice(item.stop)} · TP {formatPrice(item.target)}</small></span></div>)}</div> : <p className="journal-empty">Rencana yang dicatat akan muncul di sini selama sesi ini.</p>}
          </section>

          <section className="terminal-ai">
            <div className="ai-panel-heading"><span className="ai-avatar"><Icon name="spark" size={15} /></span><div><strong>Nalar AI</strong><small>Analisis {selectedTicker} · edukasi, bukan rekomendasi</small></div><span className="ai-ready"><i /> AI</span></div>
            {!messages.length && <div className="ai-welcome"><strong>Analisis bareng AI</strong><span>Tanyakan chart, risiko, atau konsep pasar untuk {selectedTicker}.</span></div>}
            {messages.length > 0 && <div className="terminal-chat" aria-live="polite">{messages.slice(-8).map((message, index) => <div key={`${message.role}-${index}`} className={`terminal-message ${message.role}`}><b>{message.role === "user" ? "Kamu" : "Nalar AI"}</b><p>{message.content}</p></div>)}{loading && <div className="ai-thinking">Nalar sedang menganalisis…</div>}</div>}
            <div className="ai-prompts">{popularQuestions.map((question) => <button key={question} onClick={() => sendMessage(null, `${question} untuk ${selectedTicker}`)} disabled={loading}>{question}<Icon name="chevron" size={12} /></button>)}</div>
            <form className="terminal-chat-form" onSubmit={sendMessage}>
              <textarea id="ai-composer" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={`Tanya tentang ${selectedTicker}...`} rows="2" />
              <div className="composer-footer"><span>AI bisa keliru · verifikasi data</span><button type="submit" disabled={!prompt.trim() || loading} aria-label="Kirim pertanyaan"><Icon name="send" size={14} /></button></div>
            </form>
          </section>
        </aside>
      </div>
    </main>
  );
}
