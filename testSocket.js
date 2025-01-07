// testSubmitImage.js
const io = require("socket.io-client");
const fs = require("fs");

// 서버 URL을 지정합니다. 로컬 서버라면 'http://localhost:4000'와 같이 지정합니다.
const socket = io("http://localhost:4000");

// base64로 인코딩된 이미지 파일을 읽습니다.
const base64Image = fs.readFileSync("다운로드.jpeg", {
  encoding: "base64",
});

// 서버에 연결되었을 때
socket.on("connect", () => {
  console.log("Connected to server");

  // submitImage 이벤트 전송
  socket.emit("submitImage", {
    base64Image: base64Image,
  });

  // 서버로부터 제출 결과 수신
  socket.on("submissionResult", (result) => {
    console.log("Submission result:", result);
  });

  // 서버로부터 에러 수신
  socket.on("error", (errorMessage) => {
    console.error("Error:", errorMessage);
  });
});

// 서버와의 연결이 끊어졌을 때
socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
