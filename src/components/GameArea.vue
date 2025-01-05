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
    };
  },
  mounted() {
    
    socket.on('newBubble', (bubble) => {
      if (this.bubbles.length >= 20) {
        this.bubbles.shift(); // 오래된 버블 제거
      }
      this.bubbles.push(bubble);
    });

   this.detectCollisions(); // 충돌 감지 시작
  },

  methods: {
     
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
  }
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


#game-area {
  position: absolute;
  top: 0%;
  left: 17%;
  width: 67%;
  height: 97%;
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


 

</style>
