// Level configuration

const levels = [
        {
          duration: 5,
          backgroundSound: './sounds/game-music.mp3',
          clickSound: './sounds/collect.wav',
          particleShapes: ['circle', 'square', 'triangle'],
          pattern: 'wave',
        },
        {
          duration: 5,
          backgroundSound: './sounds/game-music.mp3',
          clickSound: './sounds/collect.wav',
          particleShapes: ['circle'],
          pattern: 'constellation',
        },
        {
          duration: 5,
          backgroundSound: './sounds/storm-ambient.mp3',
          clickSound: './sounds/electric-zap.wav',
          particleShapes: ['circle', 'triangle'],
          pattern: 'pulse'
        },
        {
          duration: 5,
          backgroundSound: './sounds/wind-ambience.mp3',
          clickSound: './sounds/whoosh.wav',
          particleShapes: ['circle', 'square'],
          pattern: 'drift'
        },
        {
          duration: 5,
          backgroundSound: './sounds/space-buzz.mp3',
          clickSound: './sounds/collect-deep.wav',
          particleShapes: ['circle', 'triangle', 'square'],
          pattern: 'dense-blur'
        },
        {
          duration: 5,
          backgroundSound: './sounds/tech-glitch.mp3',
          clickSound: './sounds/glitch-pop.wav',
          particleShapes: ['square', 'triangle'],
          pattern: 'chaos-static'
        }
    ];
      

  
  let interval = null;
  let currentLevel = 0;
  let levelTime = levels[currentLevel].duration;
  let particles = [];
  let trail = [];
  let score = 0;
  let username = null;
  let coins = 0;
  let upgradeState = {
    radiusBoost: 0,
    particleMod: 0,
  };
  
  let mouse = { x: null, y: null };
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const scoreEl = document.getElementById('score');
  const nextLevelBtn = document.getElementById('next-level');
  const gameOverScreen = document.getElementById('game-over');
  const shopBtn = document.getElementById('shop-btn');
  const shopModal = document.getElementById('shop-modal');
  const coinsEl = document.getElementById('coins');
  
  const backgroundMusic = document.getElementById('background-music');
  const collectSound = document.getElementById('collect-sound');
  backgroundMusic.volume = 0.85;
  
  function enableAudio() {
    backgroundMusic.play().catch(() => {});
    window.removeEventListener('click', enableAudio);
    window.removeEventListener('touchstart', enableAudio);
  }
  window.addEventListener('click', enableAudio);
  window.addEventListener('touchstart', enableAudio);
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
  });
  
  function setPosition(e) {
    if (e.touches) e = e.touches[0];
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    trail.push({ x: mouse.x, y: mouse.y, life: 30 });
  }
  
  canvas.addEventListener('mousemove', setPosition);
  canvas.addEventListener('touchmove', setPosition, { passive: false });
  canvas.addEventListener('mouseleave', () => (mouse.x = mouse.y = null));
  canvas.addEventListener('touchend', () => (mouse.x = mouse.y = null));
  
  class Particle {
    constructor(x, y, shape, pattern) {
      this.baseX = x;
      this.baseY = y;
      this.x = x;
      this.y = y;
      this.shape = shape;
      this.pattern = pattern;
      this.baseSize = pattern === 'pulse' ? 3 + Math.random() * 4 : pattern === 'constellation' ? 2 + Math.random() * 8 : 4 + Math.random() * 6;
      this.size = this.baseSize;
      this.color = pattern === 'pulse'
        ? `hsl(${200 + Math.random() * 100}, 100%, 70%)`
        : pattern === 'constellation'
          ? `hsla(0, 0%, 100%, ${0.6 + Math.random() * 0.4})`
          : pattern === 'dense-blur'
            ? `hsla(${Math.random() * 360}, 100%, 80%, 0.7)`
            : pattern === 'chaos-static'
              ? `hsl(${Math.random() * 360}, 100%, 50%)`
              : `hsl(${Math.random() * 360}, 100%, 60%)`;
      this.speed = 0.01 + Math.random() * 0.02;
      this.angle = Math.random() * Math.PI * 2;
      this.amplitude = pattern === 'constellation' ? 5 + Math.random() * 10 : 20 + Math.random() * 30;
      this.collected = false;
      this.pulseDirection = Math.random() < 0.5 ? -1 : 1;
      this.driftSpeedX = 0.5 + Math.random() * 0.5;
      this.driftSpeedY = 0.5 + Math.random() * 0.5;
    }
  
    update() {
      this.angle += this.speed;
  
      if (this.pattern === 'constellation') {
        this.y = this.baseY + Math.cos(this.x * 0.02 + this.angle) * this.amplitude;
        this.x -= 1;
      } else if (this.pattern === 'drift') {
        this.x -= this.driftSpeedX;
        this.y += this.driftSpeedY * Math.sin(this.angle);
      } else if (this.pattern === 'chaos-static') {
        this.x += Math.sin(this.angle * 3) * 2;
        this.y += Math.cos(this.angle * 2) * 2;
      } else {
        this.y = this.baseY + Math.sin(this.x * 0.02 + this.angle) * this.amplitude;
        this.x -= 1;
      }
  
      if (this.pattern === 'pulse' || this.pattern === 'dense-blur') {
        this.size += this.pulseDirection * 0.1;
        if (this.size >= this.baseSize + 2 || this.size <= this.baseSize - 2) {
          this.pulseDirection *= -1;
        }
      }
  
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = Math.random() * canvas.height;
  
      if (mouse.x && mouse.y && !this.collected) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        const effectiveRadius = 25 + upgradeState.radiusBoost * 5;
        if (dist < effectiveRadius) {
          this.collected = true;
          score++;
          coins++;
          collectSound.play();
          scoreEl.innerText = `Username: ${username} | Points: ${score} | Time: ${levelTime}`;
          coinsEl.innerText = `Coins: ${coins}`;
          scoreEl.classList.add('text-yellow-400');
          setTimeout(() => scoreEl.classList.remove('text-yellow-400'), 200);
        }
      }
    }
  
    draw() {
      if (!this.collected) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.shape === 'circle') {
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        } else if (this.shape === 'square') {
          ctx.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        } else if (this.shape === 'triangle') {
          ctx.moveTo(this.x, this.y - this.size);
          ctx.lineTo(this.x - this.size, this.y + this.size);
          ctx.lineTo(this.x + this.size, this.y + this.size);
          ctx.closePath();
        }
        ctx.fill();
      }
    }
  }
  
  function drawStar(x, y, spikes, outerRadius, innerRadius) {
    ctx.beginPath();
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.closePath();
    ctx.fillStyle = '#FFD700';
    ctx.fill();
  }
  
  function initParticles() {
    particles = [];
    const { particleShapes, pattern } = levels[currentLevel];
    const numLines = 5;
    const baseCount = 100;
    const particleModifier = 1 + (upgradeState.particleMod * 0.01);
    const particlesPerLine = Math.floor(baseCount * particleModifier);
  
    for (let line = 1; line <= numLines; line++) {
      let y = (canvas.height / (numLines + 1)) * line;
      for (let i = 0; i < particlesPerLine; i++) {
        let x = Math.random() * canvas.width;
        let shape = particleShapes[Math.floor(Math.random() * particleShapes.length)];
        particles.push(new Particle(x, y, shape, pattern));
      }
    }
  }
  
  function animate() {
    ctx.fillStyle = levels[currentLevel].pattern === 'constellation' ? 'rgba(0,0,0,0.1)' : 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    particles.forEach(p => {
      p.update();
      p.draw();
      if (p.collected || p.x <= 0) {
        p.x = canvas.width;
        p.collected = false;
      }
    });
  
    trail.forEach((t, i) => {
      drawStar(t.x, t.y, 5, 8, 4);
      t.life--;
      if (t.life <= 0) trail.splice(i, 1);
    });
  
    requestAnimationFrame(animate);
  }
  
  function startLevel(levelIndex) {
    currentLevel = levelIndex;
    levelTime = levels[levelIndex].duration;
    score = 0;
    scoreEl.innerText = `Points: ${score} | Time: ${levelTime}`;
    coinsEl.innerText = `Coins: ${coins}`;
    gameOverScreen.classList.add('hidden');
    backgroundMusic.src = levels[levelIndex].backgroundSound;
    backgroundMusic.play();
    initParticles();
    countdown();
  }
  
  function countdown() {
    clearInterval(interval);
    interval = setInterval(() => {
      levelTime--;
      scoreEl.innerText = `Username: ${username} | Points: ${score} | Time: ${levelTime}`;
      if (levelTime <= 0) {
        clearInterval(interval);
        gameOverScreen.classList.remove('hidden');
      }
    }, 1000);
  }
  
  nextLevelBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    shopModal.classList.remove('hidden');
  });
  
  document.getElementById('start-next-level').addEventListener('click', () => {
    shopModal.classList.add('hidden');
    currentLevel = (currentLevel + 1) % levels.length;
    startLevel(currentLevel);
  });
  
  // Upgrade logic
  function upgradeRadius() {
    const cost = 10 + upgradeState.radiusBoost * 10;
    if (coins >= cost && upgradeState.radiusBoost < 5) {
      coins -= cost;
      upgradeState.radiusBoost++;
      document.querySelector('#radius-cost').innerText = cost;
      coinsEl.innerText = `Coins: ${coins}`;
    }
  }
  
  function upgradeParticles() {
    const cost = 10 + Math.abs(upgradeState.particleMod) * 10;
    if (coins >= cost && Math.abs(upgradeState.particleMod) < 25) {
      coins -= cost;
      upgradeState.particleMod++;
      document.querySelector('#density-cost').innerText = cost;
      
      coinsEl.innerText = `Coins: ${coins}`;
    }
  }
  
  document.getElementById('upgrade-radius').addEventListener('click', upgradeRadius);
  document.getElementById('upgrade-density').addEventListener('click', upgradeParticles);
  
  
  
  animate();
  
  // Start screen logic
  const startScreen = document.getElementById('start-screen');
  const startBtn = document.getElementById('start-btn');
  const usernameInput = document.getElementById('username');

  
  startBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (username !== '') {
      startScreen.classList.add('hidden');
      startLevel(0);
    }
  });
  