<template>
  <div id="host-info" class="container">
    <div class="dashboard-section">
      <!-- 주최자가 start버튼을 클릭하기 이전 화면 -->
      <div v-if="isWaiting">      
        <h2 class="title">접속자🦰</h2>
        <!-- 현재 대기중인 인원 -->
        <h3 class="participant-num">{{ survivorsCountText }}</h3>   
        <div class="participant-list">
          <!--현재 대기중인 인원이 없을때 보여줄 txt -->
          <div v-if="participantInfos.length == 0" class="noParticipant">
            <img src="../assets/host/wait.png" alt="Cute Tropical Fish"  class="cute-fish no-participant-fish">
            <h2 class="noParti">접속중인 참가자가 없어요.🫨</h2>
          </div>
          <!--현재 대기중인 인원의 이모지와 socket id -->
          <div v-for="info in participantInfos" :key="info.id" class="participant-info">
            {{ info.emoji }} {{ info.id }}
          </div>
        </div>
      </div>
      <!-- 주최자가 start버튼을 클릭 하면 보여주는 화면 -->
      <div v-if="!isWaiting">      
        <h1 class="title">record🏆</h1>
        <div class="participant-list">
          <!--participantInfos를 버블count순으로 sort한 배열 -->
          <!--rankClass: 랭킹순으로 class 먹이기-->
          <div v-for="(info, index) in sortedParticipantInfos" :key="info.id" :class="['rank-info', rankClass(index)]">
            <div v-if="info.bCount">
             {{ index + 1 }}등: {{ info.emoji }} {{ info.id }} 가 {{ info.bCount }}개!
            </div>
          </div>
        </div>
      </div>
    
    </div>

    <!--대기중 상태에선 startgame이었다가 게임 시작 이후 버튼 정보표시 변경-->
    <div v-if="isWaiting">
      <button class="start-game" @click="startGame">{{clickState}}</button> 
    </div>
    <div class="survivorCount" v-if="!isWaiting">남은 종료 시간 : {{remainingTime}}
    </div>
    <WinnerModal :visible="showWinnerModal" :winner="winner" @close="showWinnerModal = false" />
  </div>
</template>

<script>
import io from 'socket.io-client';
var socket = io();

export default {
  data() {
    return {
      participantInfos: [],
      survivorsCountText: '접속인원 0명',
      isWaiting: true,
      timerInterval: null,
      remainingTime: 0,
      showWinnerModal: false,
      winner: null,
      clickState: 'start 🏃‍♀️',
    };
  },
  computed: {
    sortedParticipantInfos() {
      return [...this.participantInfos].sort((a, b) => b.bCount - a.bCount);
    }
  },
  methods: {

    startGame() {
      if (this.participantInfos.length == 0) {
        alert('접속중인 참가자가 없어요!');
      }else{
       socket.emit('startGame');
      }
    },

    startTimer() {
      this.remainingTime = 30;
      this.isWaiting = false;
      this.timerInterval = setInterval(() => {
        this.remainingTime--; 
        if (this.remainingTime <= 0) {
          clearInterval(this.timerInterval);
        }
      }, 1000);
    },
     
    updateBubbleCount(data) {
      const currentUserIndex = this.participantInfos.findIndex((p) => p.id === data.id);
      if (currentUserIndex !== -1) {
        this.participantInfos[currentUserIndex].bCount = data.bCount;
      } else {
        this.participantInfos.push({ id: data.id, emoji: data.emoji, bCount: data.bCount });
      }

      const newSortedParticipants = [...this.participantInfos].sort((a, b) => b.bCount - a.bCount);
      
      let rankChanged = false;
      for (let i = 0; i < newSortedParticipants.length; i++) {
        if (i >= this.sortedParticipantInfos.length || newSortedParticipants[i].id !== this.sortedParticipantInfos[i].id) {
          rankChanged = true;
          break;
        }
      }

      if (rankChanged) {
        this.participantInfos = newSortedParticipants;
        this.requestRankUpdate(this.participantInfos);
      }
    },


    requestRankUpdate(data) {
      
      socket.emit('updateRanks', data); //업데이트 된 랭킹 정보
    },

    rankClass(index) {
      switch (index) {
        case 0:
          return 'first-place';
        case 1:
          return 'second-place';
        case 2:
          return 'third-place';
        default:
          return 'other-ranks';
      }
    },
  },
  mounted() {

    socket.on('updateParticipants', (participants) => {
      console.log(` ${socket.id}가 updateParticipants 이벤트 수신하였습니다.`);
      this.participantInfos = participants;
      this.survivorsCountText = `접속 인원: ${participants.length}명`;

      const currentUser = participants.find((p) => p.id === socket.id);
      if (currentUser) {
        this.myEmoji = currentUser.emoji;
        this.showMyCharacter = true;
        console.log('Current User Emoji:', this.myEmoji);
      } else {
        console.log('Current user not found in participants.');
      }
    });

    socket.on('gameInstructions', (data) => {
      if(data == '') {              
        this.startTimer();
     }else{
      this.clickState = "참가자들에게 게임설명중입니다...";
     }
    });

    socket.on('bubbleBuster', (data) => {
      console.log('업데이트 된 버블 카운ㅌ~!', data);
      this.updateBubbleCount(data); //해당 참가자의 socket id, emoji, bubbleCount
    });

    
    socket.on('gameEnd', () => {
      var resultGame = {
        whoFianlWinner : this.sortedParticipantInfos[0], //우승자
        resultRank : this.sortedParticipantInfos,
      }; 
      socket.emit('gameResult', resultGame);
      });
    
  },
};
</script>
<style scoped>
#host-info {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column; 
  align-items: center;  
  justify-content: center; 
  background-color: #001f3f;
  padding: 20px;
  box-sizing: border-box;
}

.cute-fish {
  width: 300px;   
  height: auto;
  margin-bottom: 20px;
}

.no-participant-fish {
  width: 150px;    
  height: auto;
  margin-bottom: 10px;  
}

body {
  user-select: none; 
  touch-action: manipulation; 
}

.participant-list {
  max-height: 50vh; 
  overflow-y: auto;
  margin-top: 20px;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.dashboard-section {
  width: 100%;
  max-width: 600px;
  border-radius: 10px;
  background-color: rgba(0, 31, 63, 0.85);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.title {
  font-size: 1.8rem;
  text-align: center;
  color: #ffffff;
  margin-bottom: 20px;
  animation: floating 3s ease-in-out infinite;
}

@keyframes floating {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(0, -3px);
  }
}

.participant-info {
  font-size: 1.1rem;
  color: #ffffff;
  text-align: center;
  margin: 10px 0;
}

.noParticipant {
  font-size: 1.5rem;
  color: hsla(0, 0%, 100%, .38);
  text-align: center;
  margin: 10px 0;
}

.rank-info {
  font-size: 1.5rem;
  text-align: center;
  margin: 10px 0;
}

.first-place {
  font-size: 2rem;
  font-weight: bold;
  color: #ff0000;
}

.second-place {
  font-size: 1.75rem;
  font-weight: bold;
  color: #ff5100;
}

.third-place {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffbb00;
}

.other-ranks {
  font-size: 1.25rem;
  color: hsla(0, 0%, 100%, .8);
}

.survivorCount {
  font-size: 1.2rem;
  text-align: center;
  color: white;
  background-color: rgba(0, 0, 255, .34);
  padding: 10px;
  border-radius: 10px;
  width: 100%;
  font-weight: bold;
  margin-top: 20px;
}

.participant-num {
  color: white;
  background-color: rgba(0, 0, 0, .18);
  padding: 10px;
  text-align: center;
  border-radius: 5px;
  margin-top: 20px;
}
 
.start-game {
  font-size: 1.5rem;
  color: white;
  background-color: rgba(0, 0, 255, .2);
  padding: 10px;
  border: none;
  width: 100vw;
  max-width: 600px;
  margin-top: 20px;
  border-radius: 5px;
  cursor: pointer;
}

.start-game:hover {
  background-color: rgba(0, 0, 255, .4);
}

.noparti {
  color: hsl(0deg 0% 100% / 40%);
}
</style>