<template>
  <div id="main-screen" ref="MainScreen">
    <!-- 게임에 입장한 접속자 수 -->
    <h3 id="numOfsurvivors">{{ survivorsCount }}</h3>
    <audio
      ref="buttonSound"
      src="../assets/music/effect.mp4"
      preload="auto"
    ></audio>
    <audio
      ref="gameStartedMusic"
      src="../assets/music/startGame.mp4"
      loop
    ></audio>
    <audio
      ref="keyboard"
      src="../assets/music/keyboard.mp4"
      preload="auto"
    ></audio>
    <audio
      ref="invalidNick"
      src="../assets/music/invalidNicknameLength.mp4"
      preload="auto"
    ></audio>
    <audio ref="hello" src="../assets/music/hello.mp4" preload="auto"></audio>
    <!-- 게임 입장 하기 버튼 -->
    <button
      v-if="!showNicknameInput"
      @click="handleEnterGame"
      :disabled="gameStarted"
      class="enter-button"
      ref="enterButton"
    >
      {{ gameStateTxt }}
    </button>

    <div class="neon-container" v-show="neonText">
      <div class="neon-text">{{ nickname }}님 환영합니다. Good luck</div>
    </div>
    <!-- 닉네임 입력 필드 -->
    <div v-if="showNicknameInput" class="nickname-input-container">
      <span
        v-if="showNicknameInput && !isNickName"
        :disabled="gameStarted"
        class="none-nickName"
        >닉네임 등록 후 입장이 가능합니다</span
      >
      <label for="nickname" class="nickname-label">나의 닉네임은</label>
      <!--닉네임이 없는경우 애니메이션 추가 -->
      <div v-if="!isNickName" @click="showCustomKeyboard" class="your-nick">
        <span
          v-for="(char, index) in splitText('닉네임을 입력하세요')"
          :key="index"
          class="char"
          :style="{ 'animation-delay': `${index * 0.2}s` }"
          >{{ char }}</span
        >
      </div>
      <!--닉네임이 있을때 -->
      <div
        v-if="isNickName"
        @click="showCustomKeyboard"
        class="nickname-display"
        ref="nicknameDisplay"
      >
        {{ nickname }}
      </div>
      <span class="nickname-label">입니다</span>
      <button
        v-show="!isDuplicate"
        v-if="showNicknameInput && isNickName"
        @click="nicknameCheck"
        :disabled="gameStarted"
        class="nickname-button"
        ref="nicknameButton"
      >
        {{ nickStateTxt }}
      </button>
      <button
        v-if="isDuplicate"
        :disabled="gameStarted"
        class="nickname-button"
      >
        {{ nickStateTxt }}
      </button>
    </div>
    <!-- 커스텀 키보드 -->
    <div
      id="keyboard-container"
      class="customKeyBoard"
      ref="keyboardContainer"
      v-show="isKeyboardVisible"
    ></div>
    <!-- 세로 모드일 경우 가로 화면으로 변경하라는 권장 메세지 -->
    <div id="orientation-warning">
      가로 모드로 돌리면 더 재밌게 게임을 즐기실 수 있습니다 !
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
import Keyboard from "simple-keyboard";
import Hangul from "hangul-js";
import "simple-keyboard/build/css/index.css";
import { gsap } from "gsap";

const socket = io();

export default {
  data() {
    return {
      survivorsCount: "",
      gameStateTxt: "게임 입장하기",
      gameStarted: false,
      showNicknameInput: false,
      nickname: "",
      nickStateTxt: "닉네임 등록 후 입장이 가능합니다",
      isNickName: false,
      isKeyboardVisible: false,
      keyboard: null,
      neonText: false,
      isDuplicate: false,
    };
  },

  watch: {
    nickname(newVal) {
      this.checkNickname(newVal);
    },
  },

  mounted() {
    socket.emit("checkGameStatus");

    socket.on("gameAlreadyStarted", () => {
      this.gameStateTxt = "게임 진행중";
      this.gameStarted = true; //게임 입장하기 버튼 비활성화
    });

    socket.on("gameNotStarted", () => {
      this.gameStateTxt = "게임 입장하기";
      this.gameStarted = false;
    });

    socket.on("gameEnd", () => {
      this.gameStateTxt = "게임 입장하기";
      this.gameStarted = false;
    });

    socket.on("sendCurrentClientNames", (data) => {
      this.handleCurrentClientNames(data);
    });
  },

  methods: {
    checkNickname(name) {
      const newVal = name.trim();
      if (newVal !== "") {
        socket.emit("reqCurrentClientNames");
      } else {
        this.isNickName = false;
        this.nickStateTxt = "닉네임 등록 후 입장이 가능합니다";
      }
    },

    handleCurrentClientNames(data) {
      console.log("sendCurrentClientNames:::", data);
      this.participants = data;

      const newVal = this.nickname.trim();
      const nicknames = this.participants.map(
        (participant) => participant.nickname
      );
      const isDuplicate = nicknames.includes(newVal);
      if (isDuplicate) {
        this.nickStateTxt = "이미 사용 중인 닉네임 입니다.";
        this.isDuplicate = true;
      } else {
        this.isNickName = true;
        this.isDuplicate = false;
        this.nickStateTxt = "좋은 닉네임입니다. 바로 게임을 시작해보세요!";
      }
    },

    handleEnterGame() {
      const gameStartedMusic = this.$refs.gameStartedMusic;
      const hello = this.$refs.hello;
      hello.play();

      const button = this.$refs.enterButton;
      if (!button) return;

      const buttonRect = button.getBoundingClientRect();
      const burstContainer = document.createElement("div");
      burstContainer.style.position = "absolute";
      burstContainer.style.top = `${buttonRect.top}px`;
      burstContainer.style.left = `${buttonRect.left}px`;
      burstContainer.style.width = `${buttonRect.width}px`;
      burstContainer.style.height = `${buttonRect.height}px`;
      burstContainer.style.overflow = "visible";
      document.body.appendChild(burstContainer);

      const text = "XPREM";
      const numParticles = text.length;
      const timeline = gsap.timeline({
        onComplete: () => {
          setTimeout(() => {
            burstContainer.remove();
            this.showNicknameInput = true;
          }, 2000); // 애니메이션 종료 후 5초 대기
        },
      });

      const finalPositions = [];

      for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement("div");
        particle.style.position = "absolute";
        particle.style.fontSize = "60px";
        particle.style.color = getComputedStyle(button).color;
        particle.textContent = text[i];
        particle.style.left = `${buttonRect.width / 2}px`;
        particle.style.top = `${buttonRect.height / 2}px`;
        particle.style.transform = "translateZ(0)";
        particle.style.textShadow =
          "0 0 5px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 0, 0, 0.2)";
        burstContainer.appendChild(particle);

        const finalX = buttonRect.width / 2 + (i - numParticles / 2) * 40;
        const finalY = buttonRect.height / 2;

        finalPositions.push({ x: finalX, y: finalY });

        const angle = (i / numParticles) * Math.PI - Math.PI / 2;
        const velocity = Math.random() * 100 + 50;

        timeline.to(
          particle,
          {
            x: Math.cos(angle) * velocity,
            y: Math.sin(angle) * velocity,
            z: Math.random() * 200 - 100,
            opacity: 0,
            duration: 1.5,
            ease: "power1.out",
          },
          0
        );
      }

      setTimeout(() => {
        for (let i = 0; i < numParticles; i++) {
          const particle = burstContainer.children[i];
          gsap.to(particle, {
            x: finalPositions[i].x - buttonRect.width / 2,
            y: finalPositions[i].y - buttonRect.height / 2,
            opacity: 1,
            color: "#0000FF",
            duration: 1.5,
            ease: "power1.out",
          });
        }
      }, 1000);

      gsap.to(button, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          button.style.visibility = "hidden";
        },
      });

      const bubbleContainer = document.createElement("div");
      bubbleContainer.style.position = "absolute";
      bubbleContainer.style.top = `${buttonRect.top}px`;
      bubbleContainer.style.left = `${buttonRect.left}px`;
      bubbleContainer.style.width = `${buttonRect.width}px`;
      bubbleContainer.style.height = `${buttonRect.height}px`;
      bubbleContainer.style.overflow = "visible";
      document.body.appendChild(bubbleContainer);

      const numBubbles = 20;
      for (let i = 0; i < numBubbles; i++) {
        const bubble = document.createElement("div");
        bubble.style.position = "absolute";
        bubble.style.width = "20px";
        bubble.style.height = "20px";
        bubble.style.borderRadius = "50%";
        bubble.style.background = getComputedStyle(button).background;
        bubble.style.left = `${buttonRect.width / 2}px`;
        bubble.style.top = `${buttonRect.height / 2}px`;
        bubbleContainer.appendChild(bubble);

        const angle = (i / numBubbles) * Math.PI * 2;
        const velocity = Math.random() * 100 + 50;

        gsap.to(bubble, {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity,
          opacity: 0,
          duration: 2,
          ease: "power1.out",
          onComplete: () => {
            bubble.remove();
            if (i === numBubbles - 1) {
              bubbleContainer.remove();
            }
          },
        });
      }
    },

    nicknameCheck() {
      if (this.nickname.trim() !== "" && !this.gameStarted) {
        const audio = this.$refs.buttonSound;
        audio.play();
        this.$refs.nicknameButton.style.display = "none"; //입장버튼 클릭하고 나면 remove
        document.getElementById("keyboard-container").remove(); // 시작이후 키보드 삭제
        this.neonText = true;

        // 닉네임 회전 애니메이션 추가
        setTimeout(() => {
          const nicknameDisplay = this.$refs.nicknameDisplay;
          nicknameDisplay.classList.add("nickname-rotate");
          setTimeout(() => {
            this.transitionToNextScene(); // 다음 장면으로 전환
          }, 3000); // 애니메이션 시간과 동일하게 설정
        }, 1000);
      }
    },
    transitionToNextScene() {
      const audio = this.$refs.buttonSound;
      audio.play();
      this.$emit("enter-game", this.nickname); // 닉네임 전송
    },

    showCustomKeyboard() {
      this.isKeyboardVisible = true;

      this.$nextTick(() => {
        if (!this.keyboard) {
          const keyboardContainer = this.$refs.keyboardContainer;
          if (keyboardContainer) {
            this.keyboard = new Keyboard(keyboardContainer, {
              onChange: (input) =>
                this.handleChange(Hangul.assemble(input.split(""))),
              onKeyPress: (button) => this.handleKeyPress(button),
              layout: {
                default: [
                  "1 2 3 4 5 6 7 8 9 0",
                  "ㅂ ㅈ ㄷ ㄱ ㅅ ㅛ ㅕ ㅑ ㅐ ㅔ",
                  "ㅁ ㄴ ㅇ ㄹ ㅎ ㅗ ㅓ ㅏ ㅣ",
                  "ㅋ ㅌ ㅊ ㅍ ㅠ ㅜ ㅡ {bksp}",
                  "{enter}",
                ],
              },
              display: {
                "{bksp}": "del",
                "{enter}": "확인",
              },
            });
            // 키보드 버튼 스타일 변경
            this.changeKeyboardButtonStyles([
              "hg-button hg-standardBtn",
              "hg-button hg-functionBtn hg-button-bksp",
              "hg-button hg-functionBtn hg-button-enter",
            ]);
          }
        } else {
          this.keyboard.setInput(Hangul.assemble(this.nickname.split("")));
        }
      });
    },
    handleChange(input) {
      const button = this.$refs.nicknameButton;
      const audio = this.$refs.invalidNick;

      if (input.length > 5) {
        audio.play();
        this.nickStateTxt = "닉네임은 최대 5자까지 가능합니다.";
        this.keyboard.setInput(input.slice(0, 5));
        this.nickname = input.slice(0, 5);
        this.isNickName = true;

        if (button) {
          button.classList.add("shake");
          setTimeout(() => {
            button.classList.remove("shake");
            this.nickStateTxt = "좋은 닉네임입니다. 바로 게임을 시작해보세요!"; //shake 이후 문구 변경
          }, 2000); // 2초간 shaking
        }
      } else {
        this.nickname = input;
      }
    },

    handleKeyPress(button) {
      const audio = this.$refs.keyboard;
      audio.play();
      const buttonElement = this.keyboard.getButtonElement(button);
      if (!buttonElement) return;

      const originalBackgroundColor = buttonElement.style.backgroundColor || "";
      const originalBoxShadow = buttonElement.style.boxShadow || "";
      const originalBorderBottom = buttonElement.style.borderBottom || "";

      buttonElement.style.background = "rgb(26 0 159 / 70%)";
      buttonElement.style.boxShadow =
        "rgba(255, 255, 255, 0.5) 0px 0px 9px 0px";
      buttonElement.style.borderBottom = "0px solid rgba(255, 255, 255, 0.14)";

      setTimeout(() => {
        buttonElement.style.backgroundColor = originalBackgroundColor;
        buttonElement.style.boxShadow = originalBoxShadow;
        buttonElement.style.borderBottom = originalBorderBottom;
      }, 100);

      if (button === "{enter}") this.isKeyboardVisible = false;
    },

    changeKeyboardButtonStyles(classes) {
      this.$nextTick(() => {
        const mainScreen = document.getElementById("main-screen");
        if (mainScreen) {
          classes.forEach((className) => {
            const buttons = mainScreen.getElementsByClassName(className);
            for (let i = 0; i < buttons.length; i++) {
              buttons[i].style.background = "rgb(0 0 255 / 25%)";
              buttons[i].style.boxShadow =
                "rgb(255 255 255 / 50%) 0px 0px 4px 2px";
              buttons[i].style.borderBottom =
                "4px solid rgb(255 255 255 / 14%)";
            }
          });
        }
      });
    },

    splitText(text) {
      return text.split("");
    },
  },
};
</script>

<style scoped>
#main-screen {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.enter-button {
  position: relative;
  overflow: hidden;
  width: 300px;
  height: 50px;
  cursor: pointer;
  border-radius: 50px;
  color: white;
  font-size: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  /* animation: floating 3s ease-in-out infinite; */
  background: linear-gradient(
    to right,
    rgb(255, 105, 180),
    rgb(255, 20, 147),
    rgb(138, 43, 226),
    rgb(75, 0, 130),
    rgb(0, 191, 255),
    rgb(60, 179, 113),
    rgb(255, 215, 0)
  );
  background-size: 200% 100%;
  animation: borderNeon 5s linear infinite;
}

.nickname-button {
  width: 50%;
  height: 39px;
  margin: 11px;
  cursor: pointer;
  border-radius: 8px;
  color: #ffffff;
  font-size: 1.1rem;
  border: none;
  /* animation: floating 3s ease-in-out infinite; */
  background: linear-gradient(
    to right,
    rgb(255, 105, 180),
    rgb(255, 20, 147),
    rgb(138, 43, 226),
    rgb(75, 0, 130),
    rgb(0, 191, 255),
    rgb(60, 179, 113),
    rgb(255, 215, 0)
  );
  background-size: 200% 100%;
  animation: borderNeon 5s linear infinite;
}

@keyframes borderNeon {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.none-nickName {
  width: 270x;
  color: #c0ff00;
  font-size: 1.2em;
  display: flex;
  justify-content: center;
  align-items: center;
  letter-spacing: 0px;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.enter-button:disabled {
  background-color: rgba(128, 128, 128, 0.5);
  cursor: not-allowed;
}

.enter-button button:active {
  background-color: rgba(255, 253, 238, 0.49);
}

@keyframes floating {
  0%,
  100% {
    transform: translate(0, -10px);
  }
  50% {
    transform: translate(0, -30px);
  }
}

.nickname-input-container {
  text-align: center;
  margin-bottom: 40px;
}

.nickname-label {
  color: #0070ff;
  font-size: 2.5rem;
  margin: 10px;
}

.nickname-display {
  background-color: transparent;
  color: #c0ff00;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 255, 0.5);
  font-size: 2rem;
  outline: none;
  text-align: center;
  min-width: 100px;
  cursor: pointer;
  display: inline-block;
  height: 10px;
  line-height: 0px;
  padding-top: 1px;
  padding-bottom: 3px;
  animation: borderRainbow 5s infinite;
}

.your-nick {
  background-color: transparent;
  color: #c0ff00;
  border: none;
  font-size: 2.5rem;
  outline: none;
  text-align: center;
  cursor: pointer;
  display: inline-block;
  animation: blink 5s infinite ease-in-out, textRainbow 5s infinite linear;
}

@keyframes borderRainbow {
  0% {
    border-bottom-color: rgb(255, 105, 180); /* 핫핑크 */
  }
  14.29% {
    border-bottom-color: rgb(255, 20, 147); /* 딥핑크 */
  }
  28.57% {
    border-bottom-color: rgb(138, 43, 226); /* 블루바이올렛 */
  }
  42.86% {
    border-bottom-color: rgb(75, 0, 130); /* 인디고 */
  }
  57.14% {
    border-bottom-color: rgb(0, 191, 255); /* 딥스카이블루 */
  }
  71.43% {
    border-bottom-color: rgb(60, 179, 113); /* 미디엄시그린 */
  }
  85.71% {
    border-bottom-color: rgb(255, 215, 0); /* 골드 */
  }
  100% {
    border-bottom-color: rgb(255, 105, 180); /* 핫핑크 */
  }
}

#numOfsurvivors {
  text-align: center;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

#orientation-warning {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  justify-content: center;
  align-items: center;
  text-align: center;
  z-index: 9999;
  font-size: 1.5rem;
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

.customKeyBoard {
  font-family: "Jua", sans-serif;
  background: hsla(0, 0%, 100%, 0);
  width: 70%;
  padding: 20px;
  color: #005bff;
  font-size: x-large;
  block-size: auto;
  margin: -45px;
  animation: borderBlink 2.5s infinite;
}

.customKeyBoard .custom-hg-button {
  background: #0000;
  box-shadow: 0px 0px 12px 9px rgb(56 56 165 / 50%);
  border-bottom: 1px solid #ffffff0f;
}

.customKeyBoard .custom-hg-button :active {
  background: #ff0000;
  box-shadow: 0px 0px 12px 9px rgb(56 56 165 / 50%);
  border-bottom: 1px solid #ffffff0f;
}

@keyframes textRainbow {
  0% {
    color: rgb(255, 0, 0);
  }
  16.67% {
    color: rgb(255, 165, 0);
  }
  33.33% {
    color: rgb(255, 255, 0);
  }
  50% {
    color: rgb(0, 255, 0);
  }
  66.67% {
    color: rgb(0, 0, 255);
  }
  83.33% {
    color: rgb(75, 0, 130);
  }
  100% {
    color: rgb(238, 130, 238);
  }
}

@keyframes blink {
  0%,
  20%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.nickname-rotate {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
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
  top: 10%;
}

.neon-text {
  font-size: 2rem;
  color: #fff;
  text-shadow: 0 0 5px #00ffaa, 0 0 10px #00ffaa, 0 0 15px #00ffaa,
    0 0 20px #0000ff, 0 0 25px #0000ff, 0 0 30px #ffffff, 0 0 35px #ffffff;
  position: absolute;
  white-space: nowrap;
  animation: neon-move 10s linear infinite;
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(5px);
  }
  75% {
    transform: translateX(-5px);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes neonGlow {
  0% {
    text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000,
      0 0 20px #ff0000, 0 0 25px #ff0000, 0 0 30px #ff0000, 0 0 35px #ff0000;
    color: #fff;
  }
  100% {
    text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000,
      0 0 20px #ff0000, 0 0 25px #ff0000, 0 0 30px #ff0000, 0 0 35px #ff0000;
    color: #fff;
  }
}

.shake {
  animation: shake 0.5s infinite, neonGlow 2s infinite;
}

.duplicate-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
