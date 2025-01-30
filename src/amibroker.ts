import WebSocket from "ws";

export class AmibrokerConnection {
  constructor(options: AmibrokerOptions) {
    this.ws = new WebSocket(options.relayServer ?? "ws://127.0.0.1:10101");
    this.options = options;
    this.initWS();
  }

  private ws: WebSocket;
  private options: AmibrokerOptions;

  private initWS() {
    this.ws.on("open", () => {
      console.log("Connected to the WebSocket server.");
      this.ws.send("rolesend");
      if (this.options?.onOpen) {
        this.options.onOpen();
      }
    });

    this.ws.on("message", (message: string) => {
      try {
        const command = JSON.parse(message);
        console.log("mmmmsg", command);

        switch (command.cmd) {
          case "addsym":
            this.options.onCommand({
              command: "add_watchlist",
              symbol: command.arg,
            });
            break;

          case "remsym":
            this.options.onCommand({
              command: "remove_watchlist",
              symbol: command.arg,
            });
            break;

          case "bfsym":
            console.log("Not implemented: ", command);
            break;

          case "bfauto": {
            //Get data from one date to now
            const [symbol, dt, tm] = command.arg.split(" ");

            const dtS = dt as string;
            const tmS = tm as string; //TODO find out if this is ISO time?

            const date =
              dtS.slice(0, 4) + "-" + dtS.slice(4, 6) + "-" + dtS.slice(6, 8);
            const time =
            tmS.slice(0, 2) + ":" + tmS.slice(2, 4) + ":" + tmS.slice(4, 6);


            this.options.onCommand({
              command: "backfill_from",
              symbol: symbol,
              start: new Date(date + " " + time).valueOf(), //is this my TZ date
            });
            break;
          }

          case "bffull": {
            this.options.onCommand({
              command: "backfill_full",
              symbol: command.arg,
            });
            break;
          }

          case "bfall": {
            this.options.onCommand({
              command: "backfill_all",
            });
            break;
          }

          default:
            console.error(`Unknown command: ${command.cmd}`);
        }
      } catch (error) {
        console.error("Error parsing message: ", error);
      }
    });

    this.ws.on("error", (error: Error) => {
      console.error(error);
    });

    this.ws.on("close", () => {
      console.log("Disconnected from the WebSocket server.");
    });
  }

  send(data: any) {
    this.ws.send(JSON.stringify(data));
  }
}

interface AmibrokerOptions {
  relayServer?: string;
  onOpen?: () => void;
  onCommand: (command: ICommand) => void;
}

interface ICommandAddToWatchlist {
  command: "add_watchlist";
  symbol: string;
}

interface ICommandRemoveFromWatchlist {
  command: "remove_watchlist";
  symbol: string;
}

interface ICommandBackfillFull {
  command: "backfill_full";
  symbol: string;
}

interface ICommandBackfillFrom {
  command: "backfill_from";
  symbol: string;
  start: number;
}

/**
 * This will delete all AB data and will put fresh data there
 */
interface ICommandBackfillSym {
  command: "backfill_sym";
  symbol: string;
  days: number;
}

/**
 * Backfill all symbol historuy
 */
interface ICommandBackfillAll {
  command: "backfill_all";
}

export type ICommand =
  | ICommandAddToWatchlist
  | ICommandRemoveFromWatchlist
  | ICommandBackfillFull
  | ICommandBackfillFrom
  | ICommandBackfillSym
  | ICommandBackfillAll;
