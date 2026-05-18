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
            if (keys.Space && this.isGrounded) { 
                this.vy = this.jumpPower; 
                this.isGrounded = false; 
            }
        }
    };