<template>
  <div class="winner-modal">
    <div class="winner-modal-content">
      <span class="close" @click="$emit('close')">&times;</span>
      <h2 class="winnerTxt">winner 🎉</h2>
      <div class="content-wrapper">
        <div class="winner-section">
          <div class="winner-announcement">
            <div class="emoji-and-gif">
              <span class="winner-emoji">{{ winner.emoji }}</span>
              <img src="../assets/client/winner.gif" alt="Winner GIF" class="winner-gif" />
            </div>
            <p>
              {{ winner.nickname }}님이 <br>{{ winner.bCount }}개의 버블을 터트렸습니다!
            </p>
          </div>
        </div>
        <div class="ranking-section">
          <ul class="ranking-list">
            <li v-for="(participant, index) in sortedParticipants" :key="participant.id" class="ranking-item">
              <span class="rank">{{ index + 1 }}등:</span> {{ participant.emoji }}{{ participant.nickname }} - {{ participant.bCount }}개
            </li>
          </ul>
        </div>
      </div>
      <audio ref="applauseAudio" src="../assets/music/applause.mp4"></audio>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    winner: {
      type: Object,
      default: () => ({})
    },
    sortedParticipants: {
      type: Array,
      default: () => []
    },
    myRank: {
      type: Number,
      default: 0
    },
    myBubbleCount: {
      type: Number,
      default: 0
    }
  },
  mounted() {
    const audio = this.$refs.applauseAudio;
    audio.play();
  },
};
</script>

<style scoped>
.winner-modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
}

.winner-modal-content {
  background-color: #000;
  border: none;
  width: 94vw;
  height: 94vh;
  padding: 15px;
  text-align: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  position: relative;
}

.close {
  color: #aaa;
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

h2 {
  margin-top: 0;
  color: #fff;
  font-size: 1.8em;
}


.content-wrapper {
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
}

.winner-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #444;
  padding-right: 20px;
}

.ranking-section {
  overflow-y: auto;
}

.winner-announcement {
  font-size: 1.2em;
  margin-top: 20px;
  color: #fff;
}

.emoji-and-gif {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.winner-emoji {
  font-size: 6rem; /* 이모지 확대 */
  position: relative;
}

.winner-gif {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px; /* GIF 크기 조정 */
  height: 200px; /* GIF 크기 조정 */
  z-index: 1;
}

.message-emoji {
  position: relative;
  font-size: 2rem;
}
.all-rankings {
  text-align: left;
}

.all-rankings h3 {
  margin-bottom: 10px;
  font-size: 1.5em;
  color: #fff;
}

.ranking-item {
  margin: 5px 0;
  font-size: 1em;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank {
  font-weight: bold;
  color: #fff;
}

.ranking-list {
  overflow-y: auto;
  max-height: 60vh; /* 스크롤 영역 크기 설정 */
}

@media (max-width: 600px) {
  .winner-modal-content {
    width: 95%;
    padding: 15px;
  }

  .close {
    font-size: 24px;
  }

  h2 {
    font-size: 1.5em;
  }

  .winner-announcement {
    font-size: 1em;
  }

  .all-rankings h3 {
    font-size: 1.2em;
  }

  .ranking-item {
    font-size: 0.9em;
  }
}

.winnerTxt {
  color: #00edff;
  font-size : 2.5em;
}
</style>
