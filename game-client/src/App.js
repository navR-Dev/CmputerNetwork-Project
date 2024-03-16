// App.js

import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const newWs = new WebSocket("wss://192.168.1.40:58901"); // Replace with your WebSocket server URL

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
      newWs.close();
    };
  }, []);

  const handleServerMessage = (message) => {
    const parts = message.split(" ");
    const command = parts[0];

    switch (command) {
      case "WELCOME":
        setMessage(`You are player ${parts[1]}`);
        break;
      case "MESSAGE":
        setMessage(`Server: ${message.substring(8)}`);
        break;
      case "VALID_MOVE":
        setMessage("Valid move. Waiting for the opponent...");
        break;
      case "OTHER_PLAYER_MOVED":
        handleOpponentMove(parseInt(parts[1]));
        break;
      case "OTHER_PLAYER_LEFT":
        setMessage("Your opponent has left the game.");
        ws.close();
        break;
      case "VICTORY":
        setMessage("Congratulations! You won!");
        ws.close();
        break;
      case "DEFEAT":
        setMessage("Sorry, you lost. Better luck next time.");
        ws.close();
        break;
      case "TIE":
        setMessage("It's a tie! The game is over.");
        ws.close();
        break;
      case "BOARD_STATE":
        updateBoardState(message.substring(11));
        break;
      case "GAME_ENDED":
        setMessage("The game has ended.");
        ws.close();
        break;
      case "VICTORY_MESSAGE":
        setMessage("Congratulations! You won!");
        ws.close();
        break;
      default:
        break;
    }
  };

  const makeMove = (location) => {
    const moveCommand = `MOVE ${location}`;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(moveCommand);
    }
  };

  const handleSquareClick = (index) => {
    if (!board[index]) {
      makeMove(index);
    }
  };

  const handleOpponentMove = (index) => {
    const newBoard = [...board];
    newBoard[index] = "O"; // Assuming player is always X
    setBoard(newBoard);
    setMessage("Opponent moved");
  };

  const updateBoardState = (payload) => {
    const newBoard = payload.split("\n").map((row) => row.split(" "));
    setBoard(newBoard);
  };

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
