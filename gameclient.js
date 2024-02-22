const fs = require("fs");
const tls = require("tls");

const options = {
  key: fs.readFileSync("client-key.pem"),
  cert: fs.readFileSync("client-cert.pem"),
  passphrase: "naveen",
  rejectUnauthorized: false,
};

const client = tls.connect(58901, "127.0.0.1", options, () => {
  console.log("Connected to Tic Tac Toe Server");

  client.on("data", (data) => {
    const message = data.toString("utf-8").trim();
    handleServerMessage(message);
  });

  client.on("close", () => {
    console.log("Connection closed");
  });

  makeMove(4);
});

function handleServerMessage(message) {
  const parts = message.split(" ");
  const command = parts[0];

  switch (command) {
    case "WELCOME":
      console.log(`You are player ${parts[1]}`);
      break;
    case "MESSAGE":
      console.log(`Server: ${message.substring(8)}`);
      break;
    case "VALID_MOVE":
      console.log("Valid move. Waiting for the opponent...");
      break;
    case "OTHER_PLAYER_MOVED":
      console.log(`Opponent moved to ${parts[1]}`);
      break;
    case "OTHER_PLAYER_LEFT":
      console.log("Your opponent has left the game.");
      client.end();
      break;
    case "VICTORY":
      console.log("Congratulations! You won!");
      client.end();
      break;
    case "DEFEAT":
      console.log("Sorry, you lost. Better luck next time.");
      client.end();
      break;
    case "TIE":
      console.log("It's a tie! The game is over.");
      client.end();
      break;
  }
}

function makeMove(location) {
  const moveCommand = `MOVE ${location}`;
  client.write(moveCommand);
}

process.stdin.on("data", (data) => {
  const userInput = data.toString().trim();
  if (userInput.toLowerCase() === "quit") {
    client.end();
  } else if (/^move \d+$/.test(userInput)) {
    const location = Number(userInput.split(" ")[1]);
    makeMove(location);
  } else {
    console.log(
      "Invalid command. Type 'QUIT' to exit or 'MOVE <n>' to make a move."
    );
  }
});
