require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors"); // CORS 패키지 추가
const { getRandomWord } = require("./quizWords");
const OpenAI = require("openai");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// CORS 미들웨어 추가
app.use(cors());

let participants = []; // 연결된 참가자들을 저장할 배열
const emojis = [
  "🐰",
  "🐶",
  "🐱",
  "🦉",
  "🦝",
  "🦄",
  "🐑",
  "🐿️",
  "🐼",
  "👽",
  "🐽",
  "🐸",
  "🦊",
  "🐯",
  "🐔",
  "🐌",
  "🪼",
  "🐋",
  "🪰",
  "🐙",
  "🦢",
  "🦉",
  "🐤",
];
let currentEmojiIndex = 0; // 이모지를 순서대로 할당하기 위해 이모지 인덱스 변수 선언
let gameEnded = true; // 게임 종료 상태
let gameStarted = false; // 게임 시작 상태;

const PORT = process.env.PORT || 4000;
let hostId = null; // 방장 ID 저장
let isHost = false; // 방장 여부 저장

// OpenAI 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 게임 상태 변수 추가
let currentWord = null;
let roundTime = 60; // 라운드 시간 (초)
let submissions = new Map(); // 제출된 이미지 저장

// 클라이언트가 소켓에 연결되었을 때
io.on("connection", (socket) => {
  // 현재 접속자 수를 클라이언트에게 전송
  socket.emit("currentclientCount", participants.length);
  // 현재 접속자들의 이름을 클라이언트에게 전송 (중복 네임 체크)

  socket.on("reqCurrentClientNames", () => {
    socket.emit("sendCurrentClientNames", participants);
  });

  // 게임 시작 상태를 체크
  socket.on("checkGameStatus", () => {
    if (gameStarted) {
      socket.emit("gameAlreadyStarted");
    } else {
      socket.emit("gameNotStarted");
    }
  });

  // 새로운 참가자가 접속했을 때
  socket.on("newParticipant", (data) => {
    // 방장이 없으면 현재 참가자를 방장으로 설정
    if (hostId == null) {
      hostId = socket.id;
      isHost = true;
    } else {
      isHost = false;
    }
    // new 참가자에게 이모지 할당
    data.emoji = emojis[currentEmojiIndex];
    currentEmojiIndex = (currentEmojiIndex + 1) % emojis.length;

    // 새로운 참가자 정보 생성
    const newParticipant = {
      id: socket.id,
      emoji: data.emoji,
      x: Math.random() * data.gameAreaSize.right,
      y: Math.random() * data.gameAreaSize.top,
      bubbleCount: 0,
      isHost: isHost,
      rank: 0,
      nickname: data.nickname,
    };
    // 참가자를 배열에 추가
    participants.push(newParticipant);

    console.log(
      `${participants.length}번째 참가자 ${socket.id}가 입장하였습니다.`
    );
    console.log("======================================================");
    console.log("접속 참가자 명단 :", participants);
    io.emit("updateParticipants", participants);
    console.log("모두에게 participants 정보를 전달", participants);
  });

  // 참가자와의 연결이 끊어졌을 때
  socket.on("disconnect", () => {
    if (socket.id === hostId) {
      hostId = null; // 방장이 나가면 방장 ID 초기화
      isHost = false;
    }
    participants = participants.filter((p) => p.id !== socket.id);
    console.log(`참가자 ${socket.id} 와의 연결이 끊어졌습니다.`);
    console.log("현재 참가자는 " + participants.length + "명입니다.");
    console.log("======================================================");
    io.emit("updateParticipants", participants);
  });

  // 방장의 start game 신호
  socket.on("startGame", () => {
    if (socket.id === hostId) {
      gameStarted = true;
      gameEnded = false;
      currentWord = getRandomWord(); // 랜덤 단어 선택

      const gameInstructions = [
        "제시어와 관련된 사진을 갤러리에서 찾아주세요!",
        "준비하시고~",
        3,
        2,
        1,
        "start!",
        currentWord,
      ];

      function sendInstruction(index) {
        if (index < gameInstructions.length) {
          io.emit("gameInstructions", gameInstructions[index]);
          setTimeout(() => sendInstruction(index + 1), 1600);
        } else {
          io.emit("gameInstructions", "");
          startRoundTimer(); // 라운드 타이머 시작
        }
      }
      sendInstruction(0);
    }
  });

  // 참가자가 이미지 제출
  socket.on("submitImage", async (data) => {
    console.log("제출된 이미지 : ", data);
    // try {
    //   const response = await openai.chat.completions.create({
    //     model: "gpt-4o-mini",
    //     messages: [
    //       {
    //         role: "user",
    //         content: [
    //           {
    //             type: "text",
    //             text: `이 이미지에 "${currentWord}"가 포함되어 있나요? 간단히 예/아니오로 대답해주세요.`,
    //           },
    //           {
    //             type: "image_url",
    //             url: `data:image/jpeg;base64,${data.base64Image}`, // base64 이미지 직접 전달
    //           },
    //         ],
    //       },
    //     ],
    //   });
    //   const isValid = response.choices[0].message.content
    //     .toLowerCase()
    //     .includes("예");
    //   // 결과 저장 및 점수 업데이트
    //   submissions.set(socket.id, {
    //     imageUrl: data.imageUrl,
    //     isValid: isValid,
    //     submitTime: Date.now(),
    //   });
    //   // 개별 참가자에게 결과 전송
    //   socket.emit("submissionResult", { isValid });
    //   // 전체 참가자에게 현재 제출 현황 업데이트
    //   updateGameStatus();
    // } catch (error) {
    //   console.error(error);
    //   socket.emit("error", "이미지 검증 중 오류가 발생했습니다.");
    // }
  });
});

function startRoundTimer() {
  gameStarted = true;
  submissions.clear();

  const endTime = Date.now() + roundTime * 1000;

  const timer = setInterval(() => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000);

    if (remaining <= 0) {
      clearInterval(timer);
      endRound();
    } else {
      io.emit("timeRemaining", remaining);
    }
  }, 1000);
}

function endRound() {
  gameStarted = false;

  // 결과 집계
  const results = Array.from(submissions.entries()).map(([playerId, data]) => {
    const participant = participants.find((p) => p.id === playerId);
    return {
      nickname: participant.nickname,
      isValid: data.isValid,
      submitTime: data.submitTime,
    };
  });

  io.emit("roundEnd", results);
}

function updateGameStatus() {
  const status = Array.from(submissions.entries()).map(([playerId, data]) => {
    const participant = participants.find((p) => p.id === playerId);
    return {
      nickname: participant.nickname,
      hasSubmitted: true,
      isValid: data.isValid,
    };
  });

  io.emit("gameStatus", status);
}

// 정적 파일 serve
app.use(express.static(path.join(__dirname, "../dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
