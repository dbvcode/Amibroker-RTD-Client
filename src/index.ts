import { DateTime } from "luxon";
import { AmibrokerConnection, ICommand } from "./amibroker";
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

function handleCommand(command: ICommand) {
  switch (command.command) {
    case "add_watchlist":
      addSymbolToWatchlist(command.symbol);
      break;

    case "remove_watchlist":
      removeSymbolFromWatchlist(command.symbol);
      break;

    case "backfill_sym":
      console.log("Not implemented: ", command);
      break;

    case "backfill_from": {
      //generate historic data
      generateRandomHistoricData(command.symbol, command.start);
      //send the historic data
      ab.send(exportHistoricDataForSymbolAsBackfill(command.symbol));
      //add symbol to watchlist
      addSymbolToWatchlist(command.symbol);
      break;
    }

    case "backfill_full": {
      //full history
      const start = DateTime.now().minus({ days: 3 });
      generateRandomHistoricData(command.symbol, start.valueOf());
      ab.send(exportHistoricDataForSymbolAsBackfill(command.symbol));
      break;
    }

    case "backfill_all": {
      console.log("Not implemented: ", command);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
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
