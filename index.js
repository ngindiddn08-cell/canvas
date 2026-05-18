const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const uiLayer = document.getElementById('ui-layer');
    const scoreEl = document.getElementById('scoreVal');
    const levelEl = document.getElementById('levelVal');
    const finalScoreEl = document.getElementById('final-score');
    
    // --- VARIABEL TOMBOL LOMPAT ---
    const jumpBtn = document.getElementById('jump-btn');

    let animationId, isGameRunning = false;
    let score = 0, level = 1, gameSpeed = 5, frameCount = 0;
    const groundHeight = 100;
    const groundY = canvas.height - groundHeight;

    let audioCtx;
    function playBackgroundMusic() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [329.63, 392.00, 440.00, 523.25]; 
        let nextNoteTime = audioCtx.currentTime;

        function playNote() {
            if (!isGameRunning) return;
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], nextNoteTime);
            gain.gain.setValueAtTime(0.02, nextNoteTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, nextNoteTime + 0.8);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(nextNoteTime); osc.stop(nextNoteTime + 0.8);
            nextNoteTime += 0.8;
            setTimeout(playNote, 800);
        }
        playNote();
    }

    // Objek status tombol global
    const keys = { Space: false };
    
    // --- KONTROL KEYBOARD ---
    window.addEventListener('keydown', (e) => { 
        if (e.code === 'Space' || e.code === 'ArrowUp') { 
            keys.Space = true; 
            e.preventDefault(); 
        } 
    });
    window.addEventListener('keyup', (e) => { 
        if (e.code === 'Space' || e.code === 'ArrowUp') keys.Space = false; 
    });

    // --- KONTROL TOMBOL LAYAR (MOUSE & TOUCH) ---
    function handleJumpPress(e) {
        e.preventDefault(); 
        keys.Space = true; // Mengaktifkan lompat di logika player
    }
    
    function handleJumpRelease(e) {
        e.preventDefault();
        keys.Space = false; // Menghentikan input lompat
    }

    // Event listener untuk klik mouse di komputer
    jumpBtn.addEventListener('mousedown', handleJumpPress);
    jumpBtn.addEventListener('mouseup', handleJumpRelease);
    jumpBtn.addEventListener('mouseleave', handleJumpRelease);

    // Event listener untuk sentuhan jari di HP (Touchscreen)
    jumpBtn.addEventListener('touchstart', handleJumpPress, { passive: false });
    jumpBtn.addEventListener('touchend', handleJumpRelease, { passive: false });

    // --- OBJEK PLAYER DENGAN LOGIKA ANIMASI BARU ---
    const player = {
        x: 100, y: 0, width: 36, height: 76, vy: 0,
        gravity: 0.8, jumpPower: -16, isGrounded: false,
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);

            let walkCycle = frameCount * 0.15; 
            let swingRange = 15;
            let armSwing = Math.sin(walkCycle) * swingRange;
            let legSwing = Math.sin(walkCycle) * swingRange;
            
            let bodyBob = Math.abs(Math.cos(walkCycle)) * 4;

            if (!this.isGrounded) {
                armSwing = -20; // Tangan ke atas
                legSwing = 15;  // Kaki menekuk
                bodyBob = 0;
            }

            ctx.fillStyle = '#1a237e'; 
            ctx.fillRect(20, 52 + bodyBob - (legSwing > 0 ? 0 : legSwing), 10, 24);

            ctx.fillStyle = '#0288d1';
            ctx.fillRect(28, 24 + bodyBob + armSwing, 8, 25);

            ctx.fillStyle = '#4fc3f7';
            ctx.fillRect(2, 22 + bodyBob, 32, 30);
            
            ctx.fillStyle = '#ffccbc';
            ctx.fillRect(12, 22 + bodyBob, 12, 5);

            ctx.save();
            ctx.translate(0, bodyBob);
            ctx.fillStyle = '#ffccbc';
            ctx.fillRect(6, 0, 24, 22);
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(6, 0, 24, 6);  
            ctx.fillRect(24, 6, 6, 10); 
            ctx.fillRect(6, 16, 24, 6);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(10, 10, 8, 4); ctx.fillRect(22, 10, 8, 4);
            ctx.fillStyle = '#3f51b5'; ctx.fillRect(14, 10, 4, 4); ctx.fillRect(22, 10, 4, 4);
            ctx.restore();
            
            ctx.fillStyle = '#303f9f';
            ctx.fillRect(6, 52 + bodyBob + (legSwing > 0 ? 0 : legSwing), 10, 24);
            ctx.fillStyle = '#03a9f4';
            ctx.fillRect(-4, 24 + bodyBob - armSwing, 8, 25);

            ctx.restore();
        },
        
        update() {
            this.vy += this.gravity; 
            this.y += this.vy;
            if (this.y + this.height >= groundY) { 
                this.y = groundY - this.height; 
                this.vy = 0; 
                this.isGrounded = true; 
            } else {
                this.isGrounded = false;
            }
            // Menerima input baik dari Keyboard ataupun Tombol Layar via variabel keys.Space
            if (keys.Space && this.isGrounded) { 
                this.vy = this.jumpPower; 
                this.isGrounded = false; 
            }
        }
    };

    class Obstacle {
        constructor() {
            this.width = 40;
            this.type = ['stone', 'log', 'dirt'][Math.floor(Math.random() * 3)];
            this.height = Math.random() > 0.7 ? 80 : 40;
            this.x = canvas.width;
            this.y = groundY - this.height;
        }
        draw() {
            ctx.lineWidth = 3;
            if (this.type === 'stone') {
                ctx.fillStyle = '#90a4ae'; ctx.fillRect(this.x, this.y, 40, this.height);
                ctx.strokeStyle = '#546e7a'; ctx.strokeRect(this.x, this.y, 40, this.height);
            } else if (this.type === 'log') {
                ctx.fillStyle = '#795548'; ctx.fillRect(this.x, this.y, 40, this.height);
                ctx.strokeStyle = '#4e342e'; ctx.strokeRect(this.x, this.y, 40, this.height);
            } else {
                ctx.fillStyle = '#8d6e63'; ctx.fillRect(this.x, this.y, 40, this.height);
                ctx.fillStyle = '#66bb6a'; ctx.fillRect(this.x, this.y, 40, 10);
            }
        }
        update() { this.x -= gameSpeed; }
    }

    class Coin {
        constructor() {
            this.size = 20; this.x = canvas.width;
            this.y = groundY - 60 - Math.random() * 150;
        }
        draw() {
            ctx.fillStyle = '#fbc02d'; ctx.beginPath();
            ctx.arc(this.x + 10, this.y + 10, 12, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#f9a825'; ctx.stroke();
        }
        update() { this.x -= gameSpeed; }
    }

    function drawEnvironment() {
        let cycle = (frameCount % 6000) / 6000;
        let skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
        if (cycle < 0.5) { 
            skyGradient.addColorStop(0, '#e3f2fd'); skyGradient.addColorStop(1, '#bbdefb');
        } else { 
            skyGradient.addColorStop(0, '#fff9c4'); skyGradient.addColorStop(1, '#ffccbc');
        }
        ctx.fillStyle = skyGradient; ctx.fillRect(0, 0, canvas.width, groundY);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for(let i=0; i<3; i++) {
            let cx = (200 + i*300 - frameCount*0.4) % (canvas.width + 200);
            ctx.fillRect(cx - 100, 100 + i*40, 80, 30);
        }

        ctx.fillStyle = '#6d4c41'; ctx.fillRect(0, groundY, canvas.width, groundHeight);
        ctx.fillStyle = '#5d4037';
        for(let i=0; i<canvas.width; i+=100) ctx.fillRect(i, groundY + 30, 60, 10);

        for(let i=0; i<4; i++) {
            let tx = (100 + i * 250 - frameCount * 1.2) % (canvas.width + 250);
            drawStylizedTree(tx - 100, groundY);
        }

        ctx.fillStyle = '#81c784'; ctx.fillRect(0, groundY - 15, canvas.width, 15);
    }

    function drawStylizedTree(x, y) {
        ctx.fillStyle = '#5d4037'; ctx.fillRect(x + 15, y - 50, 12, 50);
        ctx.fillStyle = '#45a049'; ctx.fillRect(x, y - 90, 42, 42); 
        ctx.fillStyle = '#4caf50'; ctx.fillRect(x + 6, y - 110, 30, 30); 
    }

    let obstacles = [], coins = [];

    function gameLoop() {
        if (!isGameRunning) return;
        frameCount++;
        drawEnvironment();
        player.update(); player.draw();

        if (frameCount % 100 === 0) coins.push(new Coin());
        if (frameCount % (Math.max(100 - level*5, 50)) === 0) obstacles.push(new Obstacle());

        coins.forEach((c, i) => {
            c.update(); c.draw();
            if (player.x < c.x + 20 && player.x + player.width > c.x && player.y < c.y + 20 && player.y + player.height > c.y) {
                score++; coins.splice(i, 1);
                if (score % 10 === 0) { level++; gameSpeed += 0.5; }
                scoreEl.innerText = score; levelEl.innerText = level;
            }
            if (c.x < -50) coins.splice(i, 1);
        });

        obstacles.forEach((o, i) => {
            o.update(); o.draw();
            if (player.x + 10 < o.x + o.width && player.x + player.width - 10 > o.x && player.y + 10 < o.y + o.height && player.y + player.height > o.y) {
                gameOver();
            }
            if (o.x < -50) obstacles.splice(i, 1);
        });

        animationId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
        score = 0; level = 1; gameSpeed = 5; frameCount = 0;
        obstacles = []; coins = []; player.y = 0; player.vy = 0;
        startScreen.style.display = 'none'; gameOverScreen.style.display = 'none';
        
        uiLayer.style.display = 'flex'; 
        jumpBtn.style.display = 'block'; // Menampilkan tombol saat permainan dimulai

        isGameRunning = true;
        scoreEl.innerText = '0'; levelEl.innerText = '1';
        playBackgroundMusic(); gameLoop();
    }

    function gameOver() {
        isGameRunning = false;
        cancelAnimationFrame(animationId);
        
        uiLayer.style.display = 'none';
        jumpBtn.style.display = 'none'; // Menyembunyikan tombol saat game over
        
        gameOverScreen.style.display = 'flex';
        finalScoreEl.innerText = score;
    }

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);