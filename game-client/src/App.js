// App.js

import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState(null);
  const [playerMark, setPlayerMark] = useState(null);

  const handleServerMessage = (message) => {
    const parts = message.split(" ");
    const command = parts[0];
    console.log(command);
    switch (command) {
      case "WELCOME":
        setPlayerMark(parts[1]);
        setMessage(`Server: You are player ${parts[1]}`);
        break;
      case "MESSAGE":
        setMessage(`Server: ${message.substring(8)}`);
        break;
      case "VALID_MOVE":
        setMessage("Server: Valid move. Waiting for the opponent...");
        break;
      case "OTHER_PLAYER_MOVED":
        handleOpponentMove(parseInt(parts[1]), parts[2]);
        break;
      case "OTHER_PLAYER_LEFT":
        setMessage("Server: Your opponent has left the game.");
        if (ws) {
          ws.close();
        }
        break;
      case "VICTORY":
        setMessage("Server: Congratulations! You won!");
        if (ws) {
          ws.close();
        }
        break;
      case "DEFEAT":
        setMessage("Server: Sorry, you lost. Better luck next time.");
        if (ws) {
          ws.close();
        }
        break;
      case "TIE":
        setMessage("Server: It's a tie! The game is over.");
        if (ws) {
          ws.close();
        }
        break;
      case "GAME_ENDED":
        setMessage("Server: The game has ended.");
        if (ws) {
          ws.close();
        }
        break;
      case "VICTORY_MESSAGE":
        setMessage("Server: Congratulations! You won!");
        if (ws) {
          ws.close();
        }
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    const newWs = new WebSocket("ws://192.168.1.40:58901");
    //console.log("Connecting");

    newWs.onopen = () => {
      console.log("Connected to Tic Tac Toe Server");
    };

    newWs.onmessage = (event) => {
      const message = event.data;
      handleServerMessage(message);
    };

    newWs.onclose = () => {
      console.log("Connection closed");
    };

    setWs(newWs);

    return () => {
      //console.log("Closing");
      newWs.close();
    };
  }, []);

  const makeMove = (location) => {
    //console.log(location);
    const moveCommand = `MOVE ${location} ${playerMark}`;
    //console.log(moveCommand);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(moveCommand);
      console.log(playerMark);
      setBoard((prevBoard) => {
        const newBoard = [...prevBoard];
        newBoard[location] = playerMark === "X" ? "X" : "O";
        return newBoard;
      });
    }
  };

  const handleSquareClick = (index) => {
    console.log(ws.readyState);
    console.log(message);
    if (board[index] === null && message === "Server: Your move") {
      //console.log("sending move");
      makeMove(index);
    }
  };

  const handleOpponentMove = (index, pm) => {
    console.log(pm);
    setBoard((prevBoard) => {
      const newBoard = [...prevBoard];
      newBoard[index] = pm;
      return newBoard;
    });
    setMessage("Server: Opponent moved");
    setTimeout(() => setMessage("Server: Your move"), 2000);
  };

  /*const updateBoardState = (payload) => {
    const newBoard = payload
      .split("\n")
      .map((row) => row.split(" ").map((cell) => (cell === "0" ? null : cell))); // Convert "0" to null
    setBoard(newBoard);

    // Send updated board state to both players
    [game.playerX, game.playerO].forEach((player) => {
      player.send("BOARD_STATE\n" + payload);
    });
  };*/
  const renderSquare = (index) => {
    return (
      <div className="square" onClick={() => handleSquareClick(index)}>
        {board[index]}
      </div>
    );
  };

  return (
    <div>
      <h1>Tic Tac Toe Client</h1>
      <div className="board">
        {board.map((square, index) => renderSquare(index))}
      </div>
      <div>{message}</div>
    </div>
  );
};

export default App;
