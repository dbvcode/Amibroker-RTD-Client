import { DateTime } from "luxon";

const tempData: { [key: string]: { [key: string]: Candle } } = {};

function oneRandomCandle(): Candle {
  const open = getRandomFloat(100, 200);
  const high = getRandomFloat(open, open + 10);
  const low = getRandomFloat(open - 10, open);
  const close = getRandomFloat(low, high);
  const volume = randomInt(1000, 10000);
  return {
    o: open,
    c: close,
    h: high,
    l: low,
    v: volume,
  };
}

function getRandomFloat(
  min: number,
  max: number,
  decimals: number = 2
): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error("Min should be less than or equal to Max");
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function exportHistoricDataForSymbol(symbol: string): Data[] {
  const temp = tempData[symbol];
  return Object.keys(temp).reduce((acc: Data[], k) => {
    const el = temp[k];
    acc.push({
      n: symbol,
      d: Number(DateTime.fromMillis(Number(k)).toFormat("yyyyMMdd")),
      t: Number(DateTime.fromMillis(Number(k)).toFormat("HHmmss")),
      c: el.c,
      h: el.h,
      l: el.l,
      o: el.o,
      v: el.v,
    });
    return acc;
  }, []);
}

export function exportHistoricDataForSymbolAsBackfill(symbol: string) {
  const temp = tempData[symbol];
  const bars = Object.keys(temp).reduce((acc: number[][], k) => {
    const el = temp[k];
    acc.push([
      Number(DateTime.fromMillis(Number(k)).toFormat("yyyyMMdd")),
      Number(DateTime.fromMillis(Number(k)).toFormat("HHmmss")),
      el.o,
      el.h,
      el.l,
      el.c,
      el.v,
    ]);
    return acc;
  }, []);

  return {
    hist: symbol,
    format: "dtohlcv",
    bars,
  };
}

export function getLastLiveCandle(symbol: string) {
  return exportHistoricDataForSymbol(symbol).at(-1);
}

export function generateRandomHistoricData(
  symbol: string,
  startDate: DateTime
) {
  const now = DateTime.now();
  const diff = now.diff(startDate).as("minutes");

  for (let i = 0; i < diff; i++) {
    const date = startDate.plus({ minutes: i });
    if (!tempData[symbol]) {
      tempData[symbol] = {};
    }
    tempData[symbol][date.toMillis().toString()] = oneRandomCandle();
  }
}

export function generateRandomLiveCandle(symbol: string) {
  if (tempData[symbol]) {
    //don't push if I don't have bunch of candles already
    tempData[symbol][DateTime.now().toMillis().toString()] = oneRandomCandle();
  } else {
    //no symbol wanted historic data so I push it now
    generateRandomHistoricData(symbol, DateTime.now().minus({ hours: 2 }));
  }
}

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface Data extends Candle {
  n: string;
  d: number;
  t: number;
}
