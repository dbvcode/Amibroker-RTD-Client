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
        this.options.onCommand(JSON.parse(message));
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
  onCommand: (command: any) => void;
}
