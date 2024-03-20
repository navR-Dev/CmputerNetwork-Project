const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");

const server = http.createServer({
  key: fs.readFileSync("server-key.pem"),
  cert: fs.readFileSync("server-cert.pem"),
});

const wss = new WebSocket.Server({ server });

let game = null;

class Game {
  constructor() {
    this.board = [
      ["0", "0", "0"],
      ["0", "0", "0"],
      ["0", "0", "0"],
    ];
    this.currentPlayer = null;
    this.playerX = null;
    this.playerO = null;
    this.gameOver = false;
  }

  move(location, player) {
    const row = Math.floor(location / 3);
    const col = location % 3;

    if (this.board[row][col] === "0") {
      this.board[row][col] = player.mark;
    } else {
      throw new Error("Invalid move. Cell already occupied.");
    }
  }

  hasWinner() {
    const b = this.board;
    const wins = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    return wins.some(
      ([x, y, z]) =>
        b[Math.floor(x / 3)][x % 3] !== "0" &&
        b[Math.floor(x / 3)][x % 3] === b[Math.floor(y / 3)][y % 3] &&
        b[Math.floor(y / 3)][y % 3] === b[Math.floor(z / 3)][z % 3]
    );
  }

  boardFilledUp() {
    return this.board.every((row) => row.every((cell) => cell !== "0"));
  }

  gameEnded() {
    this.gameOver = true;
    this.playerX = null;
    this.playerO = null;
    this.currentPlayer = null;
    this.board = [
      ["0", "0", "0"],
      ["0", "0", "0"],
      ["0", "0", "0"],
    ];
  }
}

class Player {
  constructor(game, ws, mark) {
    this.game = game;
    this.ws = ws;
    this.mark = mark;
    this.gameRef = game;
    this.isPlayer1 = mark === "X";

    this.send(`WELCOME ${mark}`);

    if (this.isPlayer1) {
      game.currentPlayer = this;
      this.send("MESSAGE Waiting for opponent to connect");
    } else {
      this.opponent = game.playerX;
      this.opponent.opponent = this;
      this.opponent.send("MESSAGE Your move");
    }

    ws.on("message", (message) => {
      const command = message.toString("utf-8").trim();
      if (game.gameOver) {
        return;
      }
      console.log(command);
      if (command === "QUIT") {
        ws.close();
      } else if (/^MOVE \d+$/.test(command)) {
        const location = Number(command.substring(5));
        try {
          game.move(location, this);
          this.send("VALID_MOVE");
          this.opponent.send(`OTHER_PLAYER_MOVED ${location}`);
          if (this.game.hasWinner()) {
            this.send("VICTORY");
            this.opponent.send("DEFEAT");
            setTimeout(() => {
              [this, this.opponent].forEach((player) => {
                player.send("GAME_ENDED");
                player.ws.close();
              });
            }, 2000);
            this.gameRef.gameEnded();
          } else if (this.game.boardFilledUp()) {
            [this, this.opponent].forEach((p) => p.send("TIE"));
            this.gameRef.gameEnded();
          } else {
            const updatedBoardState = this.getUpdatedBoardState();
            [this, this.opponent].forEach((player) => {
              player.send(updatedBoardState);
            });
          }
        } catch (e) {
          this.send(`MESSAGE ${e.message}`);
        }
      } else if (command.startsWith("BOARD_STATE")) {
        updateBoardState(command.substring(11));
      }
    });

    ws.on("close", () => {
      try {
        this.opponent.send("OTHER_PLAYER_LEFT");
        this.gameRef.gameEnded();
      } catch (e) {}
    });
  }

  send(message) {
    this.ws.send(message);
  }

  getUpdatedBoardState() {
    return (
      "BOARD_STATE\n" + this.game.board.map((row) => row.join(" ")).join("\n")
    );
  }

  sendBoardState() {
    const boardState = this.game.board
      .map((row) =>
        row.map((cell) => (cell[0] !== "0" ? cell[0] : " ")).join(" ")
      )
      .join("\n");
    this.send("BOARD_STATE\n" + boardState);
  }
}

let clients = [];

wss.on("connection", (ws) => {
  console.log("Client Connected!");

  clients.push(ws);
  //console.log(clients.length);

  if (clients.length === 1) {
    game = new Game();
    game.playerX = new Player(game, clients[0], "X");
  } else if (clients.length === 2) {
    game.playerO = new Player(game, clients[1], "O");
    game = null;
    clients = [];
  }
});

server.listen(58901, () => {
  console.log("Tic Tac Toe Server is Running");
});
