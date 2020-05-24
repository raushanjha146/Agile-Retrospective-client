import React, { useState, useEffect } from "react";
import * as io from "socket.io-client";
import * as uuid from "uuid";
import { useOvermind } from "../../overmind";

import "./app.css";

import { Header } from "../Header/Header";
import { Main } from "../Main/Main";
import { AppMode } from "../../overmind/state";

const LOCAL_DEV_SERVER_PORT = "4000";
const SERVER_PORT = "8000";

export const App = () => {
  const { actions: { updateMode} } = useOvermind();
  let serverURL = window.location.origin;
  let initialBoardId = window.location.pathname.split("/").pop() || "";
  serverURL = "https://agile-retro-server.herokuapp.com/";
  
  if (window.location.port === LOCAL_DEV_SERVER_PORT) {
    console.log("client ==>>  raushan 1 ==> if LOCAL_DEV_SERVER_PORT");
    //serverURL = window.location.origin.replace(window.location.port, SERVER_PORT);
    serverURL = "https://agile-retro-server.herokuapp.com/";
    initialBoardId = "dev-board";
  } else if (!initialBoardId) {
    console.log("client ==>>  raushan 1 ==> else LOCAL_DEV_SERVER_PORT");
    serverURL = "https://agile-retro-server.herokuapp.com/";
    initialBoardId = uuid.v4();
    window.location.assign(`/board/${initialBoardId}`);
  }
  //initialBoardId = "dev-board";
  const socket = io.connect(serverURL);
  //const socket = io.connect("c");
  const [boardId] = useState(initialBoardId);
  const [maxStars, setMaxStars] = useState(null as unknown as number);
  const [showStarLimitAlert, updateShowStarLimitAlert] = useState(false);

  function setHideStarLimitAlertTimeout(timeoutMS = 3000) {
    setTimeout(function hideAlert() {
      updateShowStarLimitAlert(false);
    }, timeoutMS);
  }

  function displayStarLimitAlert(maxStars: number) {
    setMaxStars(maxStars);
    updateShowStarLimitAlert(true);
    setHideStarLimitAlertTimeout();
  }

  useEffect(function onMount() {
    const sessionId = sessionStorage.getItem("retroSessionId");
    socket.on(`board:loaded:${boardId}`, (
      data: { board: Board, sessionId: string, remainingStars: number, showResults: boolean },
    ) => {
      updateMode(data.showResults ? AppMode.review : AppMode.vote);
    });
    socket.on(`board:star-limit-reached:${boardId}`, (data: { maxStars: number }) => {
      displayStarLimitAlert(data.maxStars);
    });

    socket.on(`board:show-results:${boardId}`, (data: { showResults: boolean }) => {
      updateMode(data.showResults ? AppMode.review : AppMode.vote);
    });

    socket.emit("board:loaded", {
      boardId,
      sessionId,
    });

    return function cleanup() {
      socket.removeListener(`board:star-limit-reached:${boardId}`);
      socket.removeListener(`board:show-results:${boardId}`);
      socket.close();
    };
  }, []);

  return (
    <>
      <Header
        socket={socket}
        boardId={boardId}
      />
      <Main
        socket={socket}
        boardId={boardId}
      />
      <div className={`alert alert-star-limit ${showStarLimitAlert ? "alert--show" : ""}`}>
        Your voting limit of {maxStars} has been reached. Undo previous stars if you want some back.
      </div>
    </>
  );
}
