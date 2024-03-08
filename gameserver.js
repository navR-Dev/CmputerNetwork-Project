const fs = require("fs");
const tls = require("tls");

let game = null;

const options = {
  key: fs.readFileSync("server-key.pem", "utf8"),
  cert: fs.readFileSync("server-cert.pem"),
  passphrase: "naveen",
};

const server = tls.createServer(options, (socket) => {
  if (!socket.encrypted) {
    console.log("Connection is not secure. Destroying the connection.");
    socket.destroy();
    return;
  }

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
});

server.listen(58901, "192.168.1.40", () => {
  console.log("Tic Tac Toe Server is Running");
});

class Game {
  constructor() {
    this.board = [
      [
        ["0", "o"],
        ["0", "o"],
        ["0", "o"],
      ],
      [
        ["0", "o"],
        ["0", "o"],
        ["0", "o"],
      ],
      [
        ["0", "o"],
        ["0", "o"],
        ["0", "o"],
      ],
    ];
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
        b[Math.floor(x / 3)][x % 3][0] !== "0" &&
        b[Math.floor(x / 3)][x % 3][0] === b[Math.floor(y / 3)][y % 3][0] &&
        b[Math.floor(y / 3)][y % 3][0] === b[Math.floor(z / 3)][z % 3][0]
    );
  }

  boardFilledUp() {
    return this.board.every((row) => row.every(([filled]) => filled !== "0"));
  }

  move(location, player) {
    if (player !== this.currentPlayer) {
      throw new Error("Not your turn");
    } else if (!player.opponent) {
      throw new Error("You don’t have an opponent yet");
    } else if (this.board[Math.floor(location / 3)][location % 3][0] !== "0") {
      throw new Error("Cell already occupied");
    }
    this.board[Math.floor(location / 3)][location % 3] = [player.mark, "o"];
    this.currentPlayer = this.currentPlayer.opponent;
  }

  // Function to display the board
  displayBoard() {
    console.log("Current Board:");
    for (let row of this.board) {
      let rowString = "";
      for (let cell of row) {
        rowString += cell[0] !== "0" ? cell[0] : " ";
        rowString += " ";
      }
      console.log(rowString);
    }
    console.log("\n");
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
          this.opponent.send(`OTHER_PLAYER_MOVED ${location}`);
          if (this.game.hasWinner()) {
            this.send("VICTORY");
            this.opponent.send("DEFEAT");
          } else if (this.game.boardFilledUp()) {
            [this, this.opponent].forEach((p) => p.send("TIE"));
          }
          this.game.displayBoard();
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
