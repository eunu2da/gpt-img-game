<template>
    <div class="modal-overlay">
      <div class="modal">
        <audio ref="buttonSound" src="../assets/music/effect.mp4" preload="auto"></audio>
        <p class="modal-message" >{{ message }}</p>
        <div class="modal-buttons">
          <button class="modal-button confirm" @click="handleAction('confirm')">확인</button>
          <button class="modal-button cancel" @click="handleAction('cancel')">취소</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['message'],
    methods: {
      playButtonSound() {
        const audio = this.$refs.buttonSound;
        if (audio) {
          audio.currentTime = 0;  
          audio.play().catch(error => {
            console.error('Audio play error:', error);
          });
        }
      },
      handleAction(action) {
        this.playButtonSound();
        setTimeout(() => {
          if (action === 'confirm') {
            this.$emit('confirm');
          } else if (action === 'cancel') {
            this.$emit('cancel');
          }
        }, 1000);  
      }
    }
  };
  </script>
  
  <style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal {
    background: rgba(0, 0, 0, 0.733);
    padding: 14px 10px 10px 11px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgb(255 255 255 / 20%);
    max-width: 200px;
    width: 100%;
    text-align: center;
  }
  
  .modal-message {
    font-weight: 500;
    font-size: 0.8rem;
    line-height:1.8;
    color:  white;
  }
  
  .modal-buttons {
    display: flex;
    justify-content: space-around;
  }
  
  .modal-button {
    padding: 9px 25px;
    font-size: 0.9rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .modal-button.confirm {
    background-color: #000aff8f;
    color: white;
  }
  
  .modal-button.cancel {
    background-color: #ff00188a;
    color:  white;
  }
  
  </style>
  