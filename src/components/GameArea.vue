<template>
  <div id="app">
      <div class="board">
        <!-- 배경 음악 토글 버튼 -->
        <!-- <img class="music-area" src = "../assets/client/sound_on.png" v-if="isPlaying"  @click="toggleMusic">
        <img class="music-area" src = "../assets/client/sound_off.png" v-if="!isPlaying"  @click="toggleMusic">
         -->
        <!-- 배경 음악 오디오 요소 -->
        
        
        <!-- 버블 소리 오디오 요소 -->
        <!-- <audio ref="bubbleSound" preload="auto">
          <source src="../assets/music/water.mp4" type="audio/mpeg">
        </audio> -->
                  
        <!-- 게임 영역 -->
        <div id="game-area">
          <div class="game-screen">
    <div class="game-container">
      <!-- 제시어 영역 -->
      <div class="word-display">
        <span class="word-label">제시어</span>
        <h2 class="random-word">{{ randomWord }}</h2>
      </div>

      <!-- 타이머 영역 -->
      <div class="timer-wrapper">
        <div class="timer-bar" :style="{ width: `${(timeLeft/30) * 100}%` }"></div>
        <span class="timer" :class="{ 'warning': timeLeft <= 10 }">{{ timeLeft }}</span>
      </div>

      <!-- 게임 영역 -->
      <div class="game-area">
        <!-- 이미지 선택 영역 -->
        <div v-if="!imagePreview && timeLeft > 0" class="upload-area">
          <input 
            type="file" 
            @change="handleImageUpload" 
            accept="image/*"
            class="file-input"
            id="fileInput"
          >
          <label for="fileInput" class="select-btn">
            이미지 선택
          </label>
        </div>

        <!-- 이미지 미리보기 -->
        <div v-if="imagePreview" class="preview-container">
          <img :src="imagePreview" alt="Preview" class="preview-image">
          <button 
            v-if="timeLeft > 0"
            class="submit-btn"
            @click="submitImage"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '분석중...' : '제출하기' }}
          </button>
        </div>
        <div v-if="score !== null" class="result-display">
          <h3>분석 결과</h3>
          <p>일치도: {{ score }}점</p>
          <p>{{ feedbackMessage }}</p>
        </div>

        <!-- 시간 종료 메시지 -->
        <div v-if="timeLeft === 0" class="timeout-message">
          TIME OVER
        </div>
      </div>
    </div>
  </div>
          <!-- <div ref="gameArea"  
            v-for="participant in participants"     
            :key="participant.id"
            class="participant"
            :style="{ left: participant.x + 'px', top: participant.y + 'px' }"
          >
           
          <span>{{ nickname }}</span>
          <span v-if="firstPlace && participant.id === firstPlace.id" class="crown">👑</span>
            {{ participant.emoji }}
          </div> -->
        <!-- 버블 요소 -->
        <!-- <div
          v-for="bubble in bubbles"
          :key="bubble.id"
          :ref="'bubble-' + bubble.id"
          :class="['bubble', { 'exploded': bubble.exploded }]"
          :style="{ left: bubble.x * gameAreaWidth + 'px', top: bubble.y * gameAreaHeight + 'px', animationDelay: bubble.delay + 's' }"
        >
        </div> -->
        </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client'; 
var socket = io();

export default {
  
  props: {
    participants: Array, // 참가자 목록
    firstPlace: Object,
  },
  data() {
    return {
      bubbles: [],   // 생성된 버블을 담을 배열   
      bubbleCount: 0,
      isPlaying: false,    
      nickname: '',
      gameAreaWidth: window.innerWidth * 0.9, // 게임 영역 너비의 90%
      gameAreaHeight: window.innerHeight * 0.7, // 게임 영역 높이의 70%
      currentScreen: 'game',
      randomWord: '',
      timeLeft: 30,
      imagePreview: null,
      isSubmitting: false,
      words: ['사과', '자동차', '강아지', '책상', '컴퓨터']
    };
  },
  mounted() {
    this.selectRandomWord()
    this.startTimer()
  
    socket.on('newBubble', (bubble) => {
      if (this.bubbles.length >= 20) {
        this.bubbles.shift(); // 오래된 버블 제거
      }
      this.bubbles.push(bubble);
    });

   this.detectCollisions(); // 충돌 감지 시작
  },

  methods: {
    startTimer() {
      const timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--
        } else {
          clearInterval(timer)
          this.handleTimeout()
        }
      }, 1000)
    },
    handleTimeout() {
      this.imagePreview = null
    },
    selectRandomWord() {
      const randomIndex = Math.floor(Math.random() * this.words.length)
      this.randomWord = this.words[randomIndex]
    },
    handleImageUpload(event) {
      if (this.timeLeft === 0) return
      const file = event.target.files[0]
      if (file) {
        this.imagePreview = URL.createObjectURL(file)
      }
      // 파일 입력 요소 초기화
      event.target.value = ''
    },
    async submitImage() {
      if (!this.imagePreview || this.timeLeft === 0) return
      
      this.isSubmitting = true
      try {
        const result = await this.analyzeImageWithGPT(this.imagePreview, this.randomWord)
        this.score = result.score
        this.feedbackMessage = result.feedback
      } catch (error) {
        console.error('이미지 분석 실패:', error)
        this.feedbackMessage = '이미지 분석에 실패했습니다.'
      } finally {
        this.isSubmitting = false
      }
    },
    async analyzeImageWithGPT(imageUrl, targetWord) {
  try {
    const base64Image = await this.getBase64(imageUrl);
    
    // 이미지 크기 확인 (예: 5MB 제한)
    if (base64Image.length > 5 * 1024 * 1024) {
      throw new Error('이미지 크기가 너무 큽니다 (5MB 이하여야 합니다).');
    }
    const apiKey = '';
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const data = {
      "model": "gpt-4-vision-preview",
      "messages": [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": `이 이미지가 "${targetWord}"와 얼마나 일치하는지 분석해주세요. 0에서 100 사이의 점수로 평가하고, 간단한 피드백을 제공해주세요.`
            },
            {
              "type": "image_url",
              "image_url": {
                "url": `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      "max_tokens": 300
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const scoreMatch = content.match(/(\d+)점/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const feedback = content.replace(/\d+점/, '').trim();

    return { score, feedback };
  } catch (error) {
    console.error('GPT API 호출 실패:', error);
    if (error.name === 'AbortError') {
      throw new Error('API 요청 시간이 초과되었습니다.');
    }
    throw error;
  }
},

    getBase64(url) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.setAttribute('crossOrigin', 'anonymous')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const dataURL = canvas.toDataURL('image/jpeg')
          resolve(dataURL.replace(/^data:image\/(png|jpg);base64,/, ''))
        }
        img.onerror = error => reject(error)
        img.src = url
      })
    },
    // 배경 음악 토글
    toggleMusic() {
      const audio = this.$refs.backgroundMusic;
      if (this.isPlaying) {
        audio.pause();
      } else {
          // 사용자의 인터랙션 이후에 오디오를 재생
          audio.play().catch(error => {
              console.error('재생 오류:', error);
          });
      }
      this.isPlaying = !this.isPlaying;
    },
 
    popBubble(bubble) {
      const bubbleElement = this.$refs['bubble-' + bubble.id][0];
      if (bubbleElement) {
        bubble.exploded = true;
  
        setTimeout(() => {
          this.bubbles = this.bubbles.filter(b => b.id !== bubble.id);
        }, 400); // 0.5초 후에 버블 제거
      }
    },

    // 충돌 감지
    detectCollisions() {
      setInterval(() => {
        this.bubbles.forEach((bubble, bubbleIndex) => {
          this.participants.forEach((participant) => {
            const bubbleX = bubble.x * this.gameAreaWidth;
            const bubbleY = bubble.y * this.gameAreaHeight;
            const dx = bubbleX - participant.x;
            const dy = bubbleY - participant.y;
            const distance = Math.sqrt(dx * dx + dy * dy);


            if (distance < 35 && !bubble.exploded) { // 버블과 참가자의 반지름을 더한 값보다 작으면 충돌 및 터지지 않은 버블만
            this.popBubble(bubble);
            this.bubbleCount++; // 터진 버블 카운트를 증가시킴
            this.$emit('updateBubbleCount', this.bubbleCount); // 이벤트 emit
            console.log(`현재 터트린 버블갯수!! : ${this.bubbleCount}`);
            if (this.$refs.bubbleSound) {
              this.$refs.bubbleSound.play().catch(error => {
                console.error('오디오 재생 오류:', error);
              });
            }
          }
        });
      });
    }, 50); // 50ms마다 충돌 감지
  },
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
};
</script>
<style scoped>
#app {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: #3b9aff2b;

}

.board {
  position: relative;
  width: 90vw;
  height: 90vh;
  overflow: hidden;
}


.bubble-container {
  position: absolute;
  width: 40px;
  height: 40px;
}

.bubble {
  width: 40px;
  height: 40px;
  background: radial-gradient(circle at 30% 30%, rgba(97, 197, 255, 0.9), rgba(73, 198, 255, 0.3));
  border-radius: 50%;
  position: absolute;
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.8), 0 0 15px rgba(48, 196, 255, 0.7), 0 0 20px rgba(54, 118, 255, 0.5);
  animation: float 2s infinite ease-in-out, rise 3s infinite ease-in-out;
  opacity: 0.9;
}

.exploded {
  width: 30px;
  height: 90px;
  background: url('../assets/boom.gif') no-repeat center center !important;
  background-size: cover !important;
  box-shadow: none !important;
  animation:none;
  border-radius: none;
  position: none;
}




@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes rise {
  0% {
    transform: translateY(0) scale(0.9);
    opacity: 0.7;
  }
  100% {
    transform: translateY(-50px) scale(1.1);
    opacity: 0;
  }
}

.participant {
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 1.5rem;
  position: absolute;
  transition: all 0.3s ease;
}

.crown {
  position: absolute;
  top: -11px;
  font-size: 1.5rem;
}

.music-controls {
  pointer-events: auto; 
  width: 50px;
  height: 50px;
  background-size: cover;
  cursor: pointer;

}

.music-area{
  pointer-events: auto; 
  position: fixed;
  top: 52px;
  right: 15px;
  cursor: pointer;
  height: 25px;
  transition: background-color 0.3s ease;
  text-align: center;
}

.game-screen {
  background-color: #001529;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 50px;
}

.word-display {
  text-align: center;
  padding: 20px;
  border: 2px solid #00f;
  border-radius: 10px;
  background: rgba(0, 0, 255, 0.1);
}

.word-label {
  display: block;
  color: #0ff;
  font-size: 14px;
  margin-bottom: 10px;
}

.random-word {
  font-size: 36px;
  color: #fff;
  text-shadow: 0 0 10px #00f;
  margin: 0;
}

.timer-wrapper {
  position: relative;
  height: 4px;
  background: rgba(0, 255, 255, 0.2);
  border-radius: 2px;
}

.timer-bar {
  position: absolute;
  height: 100%;
  background: #0ff;
  border-radius: 2px;
  transition: width 1s linear;
}

.timer {
  position: absolute;
  top: -30px;
  right: 0;
  font-size: 24px;
  color: #0ff;
}

.timer.warning {
  color: #f00;
  animation: blink 0.5s infinite;
}

.upload-area {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.file-input {
  display: none;
}

.select-btn {
  display: inline-block;
  background: transparent;
  border: 2px solid #00f;
  color: #fff;
  padding: 12px 30px;
  font-size: 16px;
  border-radius: 25px;
  cursor: pointer;
  text-shadow: 0 0 5px #00f;
  box-shadow: 0 0 15px rgba(0, 0, 255, 0.3);
  transition: all 0.3s ease;
}

.select-btn:hover {
  background: rgba(0, 0, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 0, 255, 0.5);
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.preview-image {
  width: 100%;
  max-width: 300px;
  border-radius: 10px;
  border: 2px solid #00f;
  box-shadow: 0 0 20px rgba(0, 0, 255, 0.3);
}

.submit-btn {
  background: linear-gradient(45deg, #00f, #0ff);
  border: none;
  padding: 12px 40px;
  color: white;
  font-size: 16px;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
}

.timeout-message {
  font-size: 36px;
  color: #f00;
  text-shadow: 0 0 20px #f00;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-display {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 255, 255, 0.1);
  border-radius: 10px;
  text-align: center;
  color: #fff;
}

.result-display h3 {
  color: #0ff;
  margin-bottom: 10px;
}

.result-display p {
  margin: 5px 0;
}
 

</style>
