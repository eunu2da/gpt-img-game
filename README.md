# bubble

```javascript
// 이미지 파일을 base64로 변환
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
  });
}

// 이미지 제출 시
async function submitImage(file) {
  const base64Image = await fileToBase64(file);
  socket.emit("submitImage", { base64Image });
}
```

```javascript
// 수신 이벤트
socket.on("newWord", (word) => {
  // 새로운 제시어 표시
});

socket.on("timeRemaining", (seconds) => {
  // 남은 시간 표시
});

socket.on("submissionResult", (result) => {
  // 개인 제출 결과 표시
});

socket.on("gameStatus", (status) => {
  // 전체 게임 현황 업데이트
});

socket.on("roundEnd", (results) => {
  // 라운드 종료 및 결과 표시
});
```
