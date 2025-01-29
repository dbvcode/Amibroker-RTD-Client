import { DateTime } from "luxon";
import { AmibrokerConnection } from "./amibroker";
import {
  exportHistoricDataForSymbolAsBackfill,
  generateRandomHistoricData,
  generateRandomLiveCandle,
  getLastLiveCandle,
} from "./candles";

const TICK_INTERVAL = 900;
const MAX_TICKERS = 5;

let activeSymbols: string[] = [];

const ab = new AmibrokerConnection({
  onCommand: handleCommand,
});

setInterval(() => {
  // Send fake data for all active symbols
  for (const symbol of activeSymbols) {
    generateRandomLiveCandle(symbol);
    ab.send([getLastLiveCandle(symbol)]);
  }
}, TICK_INTERVAL);

function handleCommand(command: any) {
  console.log("handleCommand", command);
  switch (command.cmd) {
    case "addsym":
      addSymbolToWatchlist(command.arg);
      break;

    case "remsym":
      removeSymbolFromWatchlist(command.arg);
      break;

    case "bfsym":
      console.log("Not implemented: ", command);
      break;

    case "bfauto": {
      //Get data from one date to now
      const info = command.arg.split(" ");
      const symbol = info[0];
      const start = DateTime.fromFormat(
        info[1] + " " + info[2],
        "yyyyMMdd HHmmss"
      );
      //generate historic data
      generateRandomHistoricData(symbol, start);
      //send the historic data
      ab.send(exportHistoricDataForSymbolAsBackfill(symbol));
      //add symbol to watchlist
      addSymbolToWatchlist(symbol);
      break;
    }

    case "bffull": {
      //full history
      const symbol = command.arg;
      const start = DateTime.now().minus({ days: 3 });
      generateRandomHistoricData(symbol, start);
      ab.send(exportHistoricDataForSymbolAsBackfill(symbol));
      break;
    }

    case "bfall": {
      console.log("Not implemented: ", command);
      break;
    }

    default:
      console.error(`Unknown command: ${command.cmd}`);
  }
}

function addSymbolToWatchlist(symbol: string) {
  if (!activeSymbols.includes(symbol) && activeSymbols.length < MAX_TICKERS) {
    activeSymbols.push(symbol);
    console.log(`Added ${symbol} to watchlist`);
    ab.send({ cmd: "addsym", code: 200, arg: `${symbol} subscribe ok` });
  }
}

function removeSymbolFromWatchlist(symbol: string) {
  activeSymbols = activeSymbols.filter((sym) => sym !== symbol);
  console.log(`Removed ${symbol} from watchlist`);
}
