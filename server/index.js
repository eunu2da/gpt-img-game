const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors"); // CORS 패키지 추가

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
let gameStarted = false; // 게임 시작 상태

const PORT = process.env.PORT || 4000;
let hostId = null; // 방장 ID 저장
let isHost = false; // 방장 여부 저장
let bubbles = [];

// 버블 생성 함수
function startBubbleGeneration() {
  setInterval(() => {
    if (bubbles.length >= 20) {
      bubbles.shift(); // 오래된 버블 제거
    }
    const bubble = {
      id: Date.now() + Math.random(),
      x: Math.random() * 0.9, // 비율로 전송
      y: Math.random() * 0.7, // 비율로 전송
      delay: Math.random() * 2,
    };
    bubbles.push(bubble);
    io.emit("newBubble", bubble); // 모든 클라이언트에게 전송
  }, 1000); // 1초마다 버블 생성
}

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

  // 참가자의 위치가 업데이트 되었을 때
  socket.on("updateParticipantPosition", (updatedParticipant) => {
    const participant = participants.find(
      (p) => p.id === updatedParticipant.id
    );

    if (participant) {
      participant.x = updatedParticipant.x;
      participant.y = updatedParticipant.y;
      io.emit("positionUpdate", participant);
    }
  });

  // 참가자가 버블을 터뜨렸을 때
  socket.on("bubbleBuster", (data) => {
    const currentUserIndex = participants.findIndex((p) => p.id === data.id);
    if (currentUserIndex !== -1) {
      participants[currentUserIndex].bCount = data.bCount;
    } else {
      participants.push({
        id: data.id,
        emoji: data.emoji,
        bCount: data.bCount,
      });
    }
    const newSortedParticipants = [...participants].sort(
      (a, b) => b.bCount - a.bCount
    );
    console.log("버블갯수로 sort된 참가자들 !!!!!!", newSortedParticipants);

    let currentRank = 1;

    newSortedParticipants.forEach((participant, index) => {
      if (
        index > 0 &&
        newSortedParticipants[index].bCount ===
          newSortedParticipants[index - 1].bCount
      ) {
        io.to(participant.id).emit("rankUpdate", {
          rank: currentRank,
          bCount: participant.bCount,
          firstPlace: newSortedParticipants[0],
          allParticipants: newSortedParticipants,
        });
      } else {
        currentRank = index + 1;
        io.to(participant.id).emit("rankUpdate", {
          rank: currentRank,
          bCount: participant.bCount,
          firstPlace: newSortedParticipants[0],
          allParticipants: newSortedParticipants,
        });
      }
    });
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
    gameStarted = true;
    gameEnded = false; // 게임 시작 시 게임 종료 상태를 초기화
    const gameInstructions = [
      "이 게임은 방울을 많이 터트리는 사람이 우승하는 게임이에요.",
      "어떤 방울 안에는 특별한 선물도 들어있답니다~ㅎㅎ",
      "그럼 준비하시고 ~",
      3,
      2,
      1,
      "start!",
    ];
    function sendInstruction(index) {
      if (index < gameInstructions.length) {
        io.emit("gameInstructions", gameInstructions[index]);
        setTimeout(() => sendInstruction(index + 1), 1600);
      } else {
        io.emit("gameInstructions", ""); // 모든 지침 전송 이후 마지막으로 빈 문자열을 보냄
        startBubbleGeneration(); // 버블 생성 시작
        setTimeout(() => {
          if (!gameEnded) {
            io.emit("showRank");
            console.log("게임이 종료되었습니다.");
            gameStarted = false;
            gameEnded = true; // 게임 종료 상태 true
          }
        }, 30000); // 120초 후에 게임 종료
      }
    }
    sendInstruction(0); // 시작
  });
});

// 정적 파일 serve
app.use(express.static(path.join(__dirname, "../dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
