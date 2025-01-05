<template>
  <div>
    <div>
      <!--참가자 대기실 -->
      <audio ref="gameStartedMusic" src="../assets/music/startGame.mp4" loop></audio>
      <audio ref="waitingMusic" src="../assets/music/waiting.mp4" loop></audio>
      <audio ref="buttonSound" src="../assets/music/effect.mp4" preload="auto"></audio>
      <audio ref="countDownAudio" src="../assets/music/count_down.mp4" preload="auto"></audio>
      <audio ref="laugh" src="../assets/music/laugh.mp4" preload="auto"></audio>
      <!-- 일등으로 변경됬을 때 효과음 -->
      <audio ref="changeFirstAudio" src="../assets/music/change_1st.mp4" preload="auto"></audio>
    </div>
      <!--메인 화면-->
      <MainScreen @enter-game="enterGame" ref="mainScreen" v-if="!gameEnd" />
    
      <div class="container" v-if="!gameEnd">
      <div class="layout_container">
        <div id="back-button">
           <!-- 현재 위치 표시 -->
          <div class="back-button"></div>
          <!-- 방장의 시작을 기다리는 중일때만 show -->
          <div class="neon-container" v-if="nickname && !gameStart">
            <div v-if="showWelcomeMessage" class="newPartiMsg">{{ welcomeMessage }}</div>
            <div v-else class="welcomeMsg">{{nickname}}님 환영합니다. Good luck 🤞</div>
          </div>
          <div id="currentPosition" class="currentPosition" v-if="showGameArea">
          {{ currentPosition }}
          </div> 
          <!--내 이모지 표시 -->
          <div id="myEmoji" class="myEmojiBox" v-if="showMyCharacter">
            <h5 class="me">{{isHost}}</h5> 
            <span class="myCharacter">{{ myEmoji }}</span>
            <div v-if="gameStart && currentRank" >
              <span class="myRank">현재 {{currentRank}}등!</span>
            </div>
          </div>
        </div>
      </div>
     
      <div class="game_area_wrapper">
        <div class="game_area_container">
          <!-- 게임 배경 이미지 -->
          <img src="@/assets/console.png" alt="Console Background" class="console-img">
          <!-- GameArea 컴포넌트 -->
          <GameArea v-if="showGameArea" :participants="participants" :firstPlace="firstPlace" ref="gameArea" @updateBubbleCount="updateBubbleCount"/>
          <!-- 달리기 버튼 -->  
          <div class="run-controls" v-if="showGameArea">
              <div class="run-button-wrapper">
                <button 
                  @mousedown="runAction" 
                  @mouseup="runStop" 
                  @mouseleave="runStop"
                  @touchstart="runAction" 
                  @touchend="runStop" 
                  ref="runButton" 
                  class="run-button">
                  <img src="../assets/client/run.gif" alt="Running" class="run-emoji" />
                </button>
                <svg class="run-button-progress" width="100" height="100">
                  <circle cx="50" cy="50" r="45" :style="{ strokeDashoffset: progressOffset }"></circle>
                </svg>
              </div>
            </div>  
          </div>
        
        <!-- 접속중인 인원 표시 -->
        <div id="survivorCount" class="survivorCount" @click="toggleParticipantsList" v-if="!gameStart">
          접속중인 인원  {{ survivorsCount }} 명
        </div> 
        
        <!-- 게임 진행 상태 표시 -->
        <div class="game_progress_status" v-if="gameStart">
          <span style="margin-right: 25px;">my rank 🏆: {{currentRank}} </span>
          <span style="margin-right: 30px;"> 남은 종료 시간 : {{remainingTime}}⏳️ </span>
          <span> {{ bubbleCountText }}</span>            
        </div>

        <!-- 전체 화면 버튼(android에서만 표시)-->
        <div class="fullscreen-buttons" v-if="isAndroidDevice">
          <button id="fullscreen-toggle" @click="toggleFullscreen">전체 화면 켜기</button>
        </div> 
      </div>

      <!-- 호스트 게임 시작 버튼 -->
      <div v-if="host" v-show="!gameStarted" class="host-controls">
            <button :class="['start-game-button', { animated: animateButton }]" @click="attemptStartGame">Start</button>
      </div> 
      <div v-show="gameStart" class="updatedRank">
           {{ Currently1stPlace }}
      </div> 
      <!-- 방장이 start버튼 클릭시 뜨는 모달팝업 -->
      <custom-modal v-if="showModal" :message="modalMessage" @confirm="startGame" @cancel="cancelStartGame" />
    
      <!--조이스틱 -->
      <div class="joystick" ref="joystick" v-if="showGameArea">
        <div class="joystick-base" ref="joystickBase">
          <div class="joystick-stick" ref="joystickStick">
            <span class="joystick-emoji">{{ myEmoji }}</span>
          </div>
        </div>
      </div>

      <!--세로 모드일때 -->
      <div id="orientation-warning">
        가로 모드로 돌리면 더 재밌게 게임을 즐기실 수 있습니다!
      </div>
      
      <!-- Participants List Popup -->
      <div v-if="showParticipantsList" class="participants-list-popup">
        <div class="popup-header">
          <h3>접속자 명단</h3>
          <button @click="toggleParticipantsList">닫기</button>
        </div>
        <ul>
          <li v-for="participant in participants" :key="participant.id">{{ participant.nickname }}</li>
        </ul>
      </div>

      <!-- 게임 설명 -->
      <div v-if="gameInstructions" class="game-instructions">
        <div class="game-instructions-content">
          <p>{{ gameInstructions }}</p>
        </div>
      </div>
    </div>
    
    <!--게임 종료 이후 뜨는 우승자 모달 -->
    <WinnerModal v-if="gameEnd" 
        :winner="firstPlace" 
        :sortedParticipants="allParticipants"
        @close="returnToMain"/>
  </div>
</template>

<script>
import MainScreen from '@/components/MainScreen.vue';
import GameArea from '@/components/GameArea.vue';
import WinnerModal from '@/components/WinnerModal.vue';
import CustomModal from '@/components/CustomModal.vue';
import io from 'socket.io-client';
var socket = io();

export default {
  components: {
    MainScreen,
    GameArea,
    WinnerModal,
    CustomModal
  },
  data() {
    return {
      participants: [],        // 게임 내 참가자 목록
      showMyCharacter: false,  // 내 캐릭터 표시 여부
      myEmoji: '',             // 내 이모지
      showGameArea: false,     // 게임 영역 표시 여부
      survivorsCount: 0,       // 접속 중인 인원
      bubbleCountText: '터트린 🫧 갯수 : 0',  
      currentPosition: '',     // 현재 위치
      moveInterval: null,
      gameInstructions: '',    // 게임 설명 text
      gameStart: false,        // 게임 시작 여부 
      timerInterval: null, 
      gameEnd: false,          // 게임 종료 여부
      remainingTime: '',       // 남은 종료 시간 표시
      isRun: false,            // 달리기 여부
      gameEndSent: false,
      currentRank: '',         // 현재 나의 랭크
      firstPlace: {},          // 1등 참가자
      allParticipants: [],     // 모든 참가자 목록
      isAndroidDevice: false,  // os확인
      joystickStartX: 0,       // 조이스틱 시작 X 좌표 
      joystickStartY: 0,       // 조이스틱 시작 X 좌표 
      joystickMoveX: 0,        // 조이스틱 이동 X 좌표
      joystickMoveY: 0,        // 조이스틱 이동 Y 좌표
      joystickMoveInterval: null,
      isHost: '',              // 호스트 여부
      host: false,             // 호스트 여부
      gameStarted: false,      // 게임 시작 여부
      showModal: false,        // 게임시작 확인 팝업
      modalMessage: '',        // 게임시작 팝업 메세지
      animateButton: false,    // 버튼 애니메이션
      runProgress: 100,        // 달리기 진행도
      runInterval: null,       // 달리기 인터벌
      fillInterval: null,      // 채우기 인터벌
      Currently1stPlace: '',
      showParticipantsList: false,
      showWelcomeMessage: false,
      welcomeMessage: '',
      welcomeMessageTimeout: null,
      previousParticipants: [], //현재까지 접속한 참가자배열
    };
  },
  computed: {
    // 달리기 진행도 오프셋 계산
    progressOffset() {
      const circumference = 2 * Math.PI * 45;
      return circumference * (1 - this.runProgress / 100);
    }
  },
  watch: {
    // 접속자 수 변화 감지
    survivorsCount(newValue, oldValue) {
      if (newValue > oldValue) {
        this.animateButton = true;
        this.playButtonSound();
        setTimeout(() => {
          this.animateButton = false;
        }, 1000);
      }
    }
  },
  methods: {
    // 효과음 재생
    playButtonSound() {
      const audio = this.$refs.buttonSound;
      if (audio) {
        audio.currentTime = 0;  // 사운드를 처음부터 재생
        audio.play().catch(error => {
          console.error('Audio play error:', error);
        });
      }
    },
    attemptStartGame (){
      this.playButtonSound();
      setTimeout(() => {
        this.modalMessage = `${this.survivorsCount}명으로 게임을 시작하시겠습니까? 게임 시작 이후 종료가 불가능 합니다.`;
        this.showModal = true;
      }, 1000);  
    },
    // 게임 시작 확인 팝업 버튼 확인 클릭시
    startGame() {
      this.showModal = false;
      this.gameStarted = true;
      socket.emit('startGame'); // 게임시작 전송
    },
    // 게임 시작 확인 팝업 취소 버튼 클릭시
    cancelStartGame() {
      this.showModal = false;
    },
    // 게임 종료 이후 새로고침
    returnToMain() {
      window.location.reload();
    },
    // 게임 입장
    enterGame(nickname) {
      document.getElementById('main-screen').style.display='none';  //main screen hide
      this.showGameArea = true;
      this.showMyCharacter = true;
      this.showNumOfSurvivors = false;    
      this.nickname = nickname; //mainvue에서 전달받은 닉네임
      this.$refs.gameStartedMusic.play();
      console.log('this.nickname?', this.nickname);
      this.$nextTick(() => {
          var gameAreaSize = document.getElementById('game-area').getBoundingClientRect();
          this.gameAreaHeight = gameAreaSize.height - 48;
          this.gameAreaWidth = gameAreaSize.width - 48;
          var areaSize = {
            top: gameAreaSize.height,
            right: gameAreaSize.width
          };
          //서버에게 해당 참가자의 게임영역 전송
          socket.emit('newParticipant', { emoji: '', gameAreaSize: areaSize, nickname: this.nickname });
          if (this.$refs.joystick) {
            this.initJoystick();
          }
      });
    },
    // 해당 참가자의 이동이 일어났을때
    move(deltaX, deltaY) {
        let currentUser = this.participants.find(p => p.id === socket.id);
        if (currentUser) {
          currentUser.x += deltaX;
          currentUser.y += deltaY;

          // 경계 체크
          if (currentUser.x < 0) currentUser.x = 0;
          if (currentUser.x > this.gameAreaWidth) currentUser.x = this.gameAreaWidth;
          if (currentUser.y < 0) currentUser.y = 0;
          if (currentUser.y > this.gameAreaHeight) currentUser.y = this.gameAreaHeight;
          //업데이트 된 위치 서버로 전달  
          socket.emit('updateParticipantPosition', currentUser);
          this.updateCurrentPosition(); //해당 참가자의 위치 update
        }
    }, 
    //해당 참가자가 달리기 버튼을 클릭 시
    runAction() {
      //잔여 run이 있을때만
      if (this.runProgress > 0) {
        this.isRun = true;
        this.$refs.runButton.classList.add('active');
        this.runInterval = setInterval(() => {
          if (this.runProgress > 0) {
            this.runProgress -= 1;  
          } else {
            this.runStop();  // 이동 중지
          }
        }, 30);
      }
    },
    // 이동 중지
    runStop() {
      this.isRun = false;
      this.$refs.runButton.classList.remove('active');
      clearInterval(this.runInterval);
    },
    // run 채우기
    startFilling() {
      this.fillInterval = setInterval(() => {
        //현재 달리는 중이 아니고 잔여 process가 full fill이 아닐때만
        if (this.runProgress < 100 && !this.isRun) {
          this.runProgress += 0.5;  
        }
      }, 100);
    },
    // 해당 참가자의 위치 update 
    updateCurrentPosition() {
      const currentUser = this.participants.find(p => p.id === socket.id);
      if (currentUser) {
        this.currentPosition = `X: ${currentUser.x.toFixed(1)}, Y: ${currentUser.y.toFixed(1)}`;
      }
    },
    // 해당 참가자의 bubble count 업데이트
    updateBubbleCount(count) {
      this.bubbleCountText = '터트린 🫧 갯수: ' + count;
      // update된 버블 count를 서버에 전달
      socket.emit('bubbleBuster', {id : socket.id, emoji: this.myEmoji, bCount : count});
    },
    // 게임 설명 뒤 타이머 시작 
    startTimer() {
      this.remainingTime = 30;
      this.gameEndSent = false;
      this.timerInterval = setInterval(() => {
        this.remainingTime--; //1초씩 차감
        if (this.remainingTime <= 0 && !this.gameEndSent) {
          clearInterval(this.timerInterval);
          this.gameEndSent = true; // 게임 종료 상태를 true로
        }
      }, 1000);
    },
    // full screen (adroid) toggle
    toggleFullscreen() {
      const elem = document.documentElement;
      elem.requestFullscreen();
      const toggleButton = document.getElementById('fullscreen-toggle');
      //full screen 일때
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { // Safari
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {     // IE11
          elem.msRequestFullscreen();
        }
        toggleButton.textContent = '전체 화면 끄기';
      //full screen이 아닐때
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {     // IE11
          document.msExitFullscreen();
        }
        toggleButton.textContent = '전체 화면 켜기';
      }
    },
    // 안드로이드 기기 여부 확인
    isAndroid() {
        return /Android/i.test(navigator.userAgent);
    },
    // 조이스틱 초기화
    initJoystick() {
        const joystickBase = this.$refs.joystickBase;
        const joystickStick = this.$refs.joystickStick;
        joystickStick.addEventListener('touchstart', this.startJoystick);
        joystickStick.addEventListener('touchmove', this.moveJoystick);
        joystickStick.addEventListener('touchend', this.endJoystick);
      },
    // 조이스틱 시작
    startJoystick(event) {
      const touch = event.touches[0];
      this.joystickStartX = touch.clientX;
      this.joystickStartY = touch.clientY;
      this.joystickMoveX = 0;
      this.joystickMoveY = 0;

    // 기존의 setInterval 정리
    if (this.joystickMoveInterval) {
      clearInterval(this.joystickMoveInterval);
    }

      this.joystickMoveInterval = setInterval(this.updateMovement, 30);
      this.$refs.joystickBase.classList.add('active');
    },
    // 조이스틱 이동
    moveJoystick(event) {
      event.preventDefault(); // 터치 이동 중 스크롤 방지
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.joystickStartX;
      const deltaY = touch.clientY - this.joystickStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 50; // 조이스틱 최대 이동 거리

      let moveX = deltaX;
      let moveY = deltaY;

      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        moveX = Math.cos(angle) * maxDistance;
        moveY = Math.sin(angle) * maxDistance;
      }

      this.joystickMoveX = moveX / maxDistance;
      this.joystickMoveY = moveY / maxDistance;
      if (this.$refs.joystickStick) {
        this.$refs.joystickStick.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    },
    // 조이스틱 종료
    endJoystick(event) {
      event.preventDefault(); // 터치 종료 중 스크롤 방지
      this.$refs.joystickStick.style.transform = 'translate(0, 0)';
      clearInterval(this.joystickMoveInterval);
      this.joystickMoveX = 0;
      this.joystickMoveY = 0;
      this.triggerHapticFeedback();
      this.$refs.joystickBase.classList.remove('active');
    },
    //  이동 update
    updateMovement() {
      const moveDistance = this.isRun ? 10 : 5; // 이동 속도 조절
      const deltaX = this.joystickMoveX * moveDistance;
      const deltaY = this.joystickMoveY * moveDistance;
      this.move(deltaX, deltaY);
    },
    // 조이스틱 종료 이후 진동
    triggerHapticFeedback() {
      // adnroid
      if (navigator.vibrate) {
        navigator.vibrate(10); 
      } else {
        // ios
        this.addVisualFeedback();
      }
    },
    // ios 진동
    addVisualFeedback() {
      const joystickStick = this.$refs.joystickStick;
      joystickStick.classList.add('shake');
      setTimeout(() => {
        joystickStick.classList.remove('shake');
      }, 100);
    },
    toggleParticipantsList() {
      this.showParticipantsList = !this.showParticipantsList;
    },
    updateParticipants(participants) {
      this.previousParticipants = [...this.participants];
      this.participants = participants;
      this.survivorsCount = participants.length;
      this.updateCurrentPosition();

      const currentUser = participants.find(p => p.id === socket.id);
      if (currentUser) {
        this.myEmoji = currentUser.emoji; 
        this.showMyCharacter = true;
        this.isHost = currentUser.isHost ? '👑방장👑' : '👔참가자👔';
        if (currentUser.isHost) {
          this.host = true;
          const laughAudio = this.$refs.laugh;
          laughAudio.play();
        }
      }

      // 새로운 참가자 확인
      const newParticipants = participants.filter(p => !this.previousParticipants.some(prev => prev.id === p.id));
      newParticipants.forEach(newParticipant => {
        if (newParticipant.id !== socket.id) {  //본인이 아닌 새로운 참가자가 접속한 경우 welcome message
        this.handleNewUserJoin(newParticipant.nickname);
        }
      });
    },
    handleNewUserJoin(newUserNickname) {
      // 새로운 사용자가 입장하면 환영 메시지 표시
      this.welcomeMessage = `${newUserNickname}님이 입장하셨습니다.`;
      this.showWelcomeMessage = true;

      // 일정 시간 후에 원래 메시지로 복귀
      if (this.welcomeMessageTimeout) {
        clearTimeout(this.welcomeMessageTimeout);
      }
      this.welcomeMessageTimeout = setTimeout(() => {
        this.showWelcomeMessage = false;
      }, 5000); // 5초 후에 원래 메시지로 복귀
    },
  },
  mounted() {
    this.isAndroidDevice = this.isAndroid();    // 안드로이드 기기 여부 확인
    this.startFilling();                        // run fill

    // 서버로부터 현재 참가자들의 인원수를 전달 받는다.
    socket.on('currentclientCount', (clientCount) => {
      this.survivorsCount = clientCount;
    });
    // 업데이트 된 참가자 정보
    socket.on('updateParticipants', (participants) => {
      this.updateParticipants(participants);
    }); 
    // 서버로부터 전달받은 참가자의 위치 정보 업데이트
    socket.on('positionUpdate', (data) => {
      const participant = this.participants.find(p => p.id === data.id);
      if (participant) {
        participant.x = data.x;
        participant.y = data.y;
        this.updateCurrentPosition();
      }
    });   
   // 방장의 start 신호 이후 게임 설명
   socket.on('gameInstructions', (data) => {
    const waitingMusic = this.$refs.waitingMusic;
    const gameStartedMusic = this.$refs.gameStartedMusic;
    this.gameStart = true;

    this.gameInstructions = data;   // 게임 지침 설명 text
    if(data == '3') {               
      const countDownAudio = this.$refs.countDownAudio;
      countDownAudio.play();
    }
    if(data == '') {               
        this.runProgress = 100;     // run fill
        this.$refs.gameStartedMusic.pause();
        this.$refs.waitingMusic.play();
        this.startTimer();          // count 시작
      }
      
   });
   // 참가자들의 bubble count로 순위 업데이트
   socket.on('rankUpdate', (data) => {
    // if (this.previousFirstPlace && this.previousFirstPlace.id !== data.firstPlace.id) {
      //   const downToSecondAudio = this.$refs.downToSecondAudio;
      //   downToSecondAudio.play();
      // }

      this.currentRank = data.rank;
      if(this.currentRank == '1'){
        const changeFirstAudio = this.$refs.changeFirstAudio;
        changeFirstAudio.play();
      }
      this.firstPlace = data.firstPlace;
      this.allParticipants = data.allParticipants;
      this.Currently1stPlace = `현재 1등 참가자는 ${data.firstPlace.emoji}이며, 터트린 갯수는 ${data.firstPlace.bCount}개 입니다.`;
    });
    // 게임 종료 신호
    socket.on('showRank',(data) => {
      this.gameEnd = true;  
      this.firstPlace = data.whoFianlWinner; 
      this.allParticipants = data.resultRank; // 전체 참가자의 게임 정보
    });
  
  },
};
</script>

<style scoped>
body, html {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
  user-select: none; 
  touch-action: none;
}

#orientation-warning {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  z-index: 9999;
  font-size: 1.5rem;
}

#back-button {
  width: 90px;
  height: 50px;
  position: fixed;
  top: 20px;
  left: 15px;
  z-index: 1000;
}
 

@keyframes floating {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(0, -3px);
  }
}

.back_button_img {
  width: 100%;
  height: 100%;
  margin-top: 0;
  margin-left: 0;
  border-radius: 20px;
}

.game_area_wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game_area_container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  width: 140vw;
  height: 121vh;
}

.console-img {
  overflow: hidden;
  position: absolute;
  width: 114%;
  height: 117%;
}

.myEmojiBox {
  width: 100px;
  height: 130px;
  border: 3px solid rgba(200,241,255,.5607843137254902);
  border-radius: 20px;
  text-align: center;
  background: rgb(0 0 255 / 25%);
  box-shadow: 0 8px 12px #fff;
}


.me {
  color: #ffffff;
  margin: 8px;
}

.myCharacter {
  font-size: 2.1rem;
}

.survivorCount {
  position: fixed;
  top: 12px;
  right:150px;
  color: hsl(0deg 0% 100%);
  padding: 8px;
  border-radius: 10px;
  z-index: 1000;
}

.game_progress_status {
  width: 60%;
  position: fixed;
  top: 12px;
  right: 150px;
  background-color: rgb(0 0 0 / 18%);
  color: #73ff00;
  padding: 8px;
  border-radius: 10px;
  font-size: 1rem;
  z-index: 1000;
}

.currentPosition {
  margin: 4px;
  color:hsla(0,0%,100%,.7000000000000001);
  width: 100px;
  border-radius: 5px;
  font-size: 0.7rem;
  text-align: center;
  font-weight: bold;
}

.direct-controls {
  position: fixed;
  bottom: 20px;
  left: 20px;
}



.direction-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.direction-buttons button {
  width: 50px;
  height: 50px;
  margin: 5px;
  font-size: 1.2rem; 
  background-color: rgba(0,0,255,.5);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  outline: none;
}

.direction-buttons button::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(145deg, hsl(0deg 0% 100% / 40%), rgb(255 255 244));
  transition: all 0.3s ease;
  z-index: 1;
}

.direction-buttons button:active {
  background-color: rgba(0, 0, 255, 0.7);
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
  transform: translateY(2px);
}

.direction-buttons button:active::before {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0.1));
}

@media only screen and (max-width: 660px) and (orientation: portrait) {
  #orientation-warning {
    display: flex;
  }
}

@media only screen and (min-width: 660px) and (orientation: landscape) {
  #orientation-warning {
    display: none;
  }
}

.game-instructions {
  position: fixed;
  top: 50%;
  left: 50%;
  border-radius: 20px;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.733);
  border: rgba(0,0,0,.18);
  color: white;
  padding: 7px 30px;
  max-width: 80%;
}

.game-instructions-content {
  opacity: 0.8;  
}

.fullscreen-buttons button {
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: rgb(0 0 0 / 18%);
  border: rgb(0 0 0 / 18%);
  color: hsla(0,0%,100%,.7000000000000001);
  padding: 10px;
  border-radius: 10px;
  font-size: 1rem;
  z-index: 1000;
  letter-spacing: -1px;
} 

.run-button {
  position: fixed;
  right: 27px;
  bottom: 40px;
  width: 90px; 
  height: 90px;
  font-size: 2.5rem; 
  background: rgb(255 255 255 / 23%);
  border: none; 
  border-radius: 50%; 
  transition: all 0.3s ease;  
  outline: none;
  z-index: 1000;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent; 
}

.run-emoji {
  width: 50px;  
  height: 50px;
}

.joystick {
  position: fixed;
  bottom: 37px;
  left: 14px;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.joystick-base {
  position: relative;
  width: 100%;
  height: 100%;
  background: #c8f1ff8f;
  border-radius: 50%;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.joystick-stick {
  position: absolute;
  width: 50%;
  height: 50%;
  border-radius: 50%;
  top: 25%;
  left: 25%;
  transition: transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.5), 0 5px 15px rgba(0, 0, 0, 0.5);
  transition: transform 0.1s;
}

.joystick-emoji {
  font-size: 2.5rem;
}

.joystick-stick:active {
  background: radial-gradient(circle at center, #d0d0d0, #a0a0a0);
}
 
@keyframes shake {
  0% { transform: translate(0, 0); }
  25% { transform: translate(4px, 0); }
  50% { transform: translate(0, 0); }
  75% { transform: translate(-4px, 0); }
  100% { transform: translate(0, 0); }
}

.joystick-stick.shake {
  animation: shake 0.2s linear;
}

.joystick-base.active, .run-button.active {
  background: radial-gradient(circle at center, #ffffff80, #fff);   /* 색상 변경 */
  transform: scale(0.95);
}


.host-controls {
  bottom: 120px; 
  right: 30px;
  display: flex;
  justify-content: center;
}

.updatedRank {
  right: 20px;
  position: fixed;
  background-color: #007bff2b;
  width: 90px;
  height: 120px;
  border: 2px solid rgba(200,241,255,.5607843137254902);
  transition: background-color 0.3s ease;
  border-radius: 20px;
  text-align: center;
  font-size: smaller;
  bottom: 180px;
  padding: 10px;
  color: #fff;
  font-weight:500;
  box-shadow: 0 8px 12px #fff;
}

@keyframes move-left-right {
  0%, 100% {
    transform: translateX(0);
  }
  25%, 75% {
    transform: translateX(-10px);
  }
  50% {
    transform: translateX(10px);
  }
}

.start-game-button.animated {
  animation: move-left-right 1s ease-in-out 2;
}

.start-game-button {
  right: 20px;
  position: fixed;
  background-color: rgb(0 0 255 / 25%);
  width: 100px;
  height: 130px;
  border: 3px solid rgba(200,241,255,.5607843137254902);
  transition: background-color 0.3s ease;
  border-radius: 20px;
  text-align: center;
  font-size: larger;
  bottom: 180px;
  color: #fff;
  font-weight:500;
  box-shadow: 0 8px 12px #fff;
}

.start-game-button:hover {
  background-color: rgba(0, 0, 255, .4);
}

.run-controls {
  position: fixed;
  right: 30px;
  bottom: 41px;
}
.run-button-wrapper {
  position: relative;
  width: 91px;
  height: 93px;
}
 
.run-button:active {
  box-shadow: 0 2px #666;
  transform: translateY(4px);
}

.run-button-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  transform: rotate(-90deg);
}

.run-button-progress circle {
  fill: none;
  stroke:rgba(200,241,255,.5607843137254902);
  stroke-width: 12;
  stroke-dasharray: 282; /* 2 * Math.PI * 45 */
  transition: stroke-dashoffset 0.3s;
}

.myRank {
  color:yellowgreen; 
  font-weight: bold;
  animation: floating 3s ease-in-out infinite;
}

@keyframes floating {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(0, -20px);
  }
}


@keyframes neon-move {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.neon-container {
  position: fixed;
  width: 100%;
  height: 100px; 
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcomeMsg {
  font-size: 2rem;
  color: #fff;
  text-shadow: 
    0 0 5px #00ffaa,   
    0 0 10px #00ffaa, 
    0 0 15px #00ffaa, 
    0 0 20px #0000ff,   
    0 0 25px #0000ff,
    0 0 30px #ffffff,   
    0 0 35px #ffffff;
  position: absolute;
  white-space: nowrap;
  animation: neon-move 10s linear infinite;
}

.newPartiMsg {
  font-size: 2rem;
  color: #fff;
  text-shadow: 
    0 0 5px #ff0000,   
    0 0 10px #ff0000, 
    0 0 15px #ff0000, 
    0 0 20px #ff4500,   
    0 0 25px #ff4500,
    0 0 30px #ffffff,   
    0 0 35px #ffffff;
  position: absolute;
  white-space: nowrap;
  animation: neon-move 10s linear infinite;
}
.participants-list-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  width: 300px;
  padding: 20px;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
}

.participants-list-popup .popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ccc;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.participants-list-popup h3 {
  margin: 0;
  font-size: 1.2rem;
}

.participants-list-popup button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #007BFF;
}

.participants-list-popup button:hover {
  text-decoration: underline;
}

.participants-list-popup ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.participants-list-popup li {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

</style>