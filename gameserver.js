const net = require("net");
const fs = require("fs");
const tls = require("tls");

let game = null;
const options = {
  key: fs.readFileSync("server-key.pem", "utf8"),
  cert: fs.readFileSync("server-cert.pem"),
  passphrase: "naveen",
};

const server = tls
  .createServer(options, (socket) => {
    console.log(
      "Connection from",
      socket.remoteAddress,
      "port",
      socket.remotePort
    );
    if (game === null) {
      game = new Game();
      game.playerX = new Player(game, socket, "X");
    } else {
      game.playerO = new Player(game, socket, "O");
      game = null;
    }
    if (!socket.authorized) {
      socket.write("Unauthorized. Please connect using SSL/TLS.\n");
      socket.destroy();
    }
  })
  .listen(58901, () => {
    console.log("Tic Tac Toe Server is Running");
  });

class Game {
  constructor() {
    this.board = Array(9).fill(null);
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
      ([x, y, z]) => b[x] !== null && b[x] === b[y] && b[y] === b[z]
    );
  }

  boardFilledUp() {
    return this.board.every((square) => square !== null);
  }

  move(location, player) {
    if (player !== this.currentPlayer) {
      throw new Error("Not your turn");
    } else if (!player.opponent) {
      throw new Error("You don’t have an opponent yet");
    } else if (this.board[location] !== null) {
      throw new Error("Cell already occupied");
    }
    this.board[location] = this.currentPlayer;
    this.currentPlayer = this.currentPlayer.opponent;
  }
}

class Player {
  constructor(game, socket, mark) {
    Object.assign(this, { game, socket, mark });
    this.send(`WELCOME ${mark}`);
    if (mark === "X") {
      game.currentPlayer = this;
      this.send("MESSAGE Waiting for opponent to connect");
    } else {
      this.opponent = game.playerX;
      this.opponent.opponent = this;
      this.opponent.send("MESSAGE Your move");
    }

    socket.on("data", (buffer) => {
      const command = buffer.toString("utf-8").trim();
      if (command === "QUIT") {
        socket.destroy();
      } else if (/^MOVE \d+$/.test(command)) {
        const location = Number(command.substring(5));
        try {
          game.move(location, this);
          this.send("VALID_MOVE");
          this.opponent.send(`OPPONENT_MOVED ${location}`);
          if (this.game.hasWinner()) {
            this.send("VICTORY");
            this.opponent.send("DEFEAT");
          } else if (this.game.boardFilledUp()) {
            [this, this.opponent].forEach((p) => p.send("TIE"));
          }
        } catch (e) {
          this.send(`MESSAGE ${e.message}`);
        }
      }
    });

    socket.on("close", () => {
      try {
        this.opponent.send("OTHER_PLAYER_LEFT");
      } catch (e) {}
    });
  }

  send(message) {
    this.socket.write(`${message}\n`);
  }
}
