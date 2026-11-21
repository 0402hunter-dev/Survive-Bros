// Optional voxel-inspired visual layer for Survive Bros.
// This only replaces drawing methods; movement, collisions, and combat stay unchanged.

(() => {
  const pixel = (ctx, color, x, y, width, height = width) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(width), Math.ceil(height));
  };

  const drawPixelFace = (ctx, x, y, size, danger) => {
    const unit = Math.max(2, Math.floor(size / 8));
    const eyeY = y - unit * 0.7;
    const eyeOffset = unit * 1.5;
    const eyeColor = danger > 0.72 ? '#fff1a8' : '#f5ffff';
    const ink = '#18202a';

    // Square eyes and brows make the expression readable at small sizes.
    pixel(ctx, eyeColor, x - eyeOffset - unit, eyeY, unit * 1.5, unit * 1.5);
    pixel(ctx, eyeColor, x + eyeOffset - unit / 2, eyeY, unit * 1.5, unit * 1.5);
    if (danger >= 0.55) {
      pixel(ctx, ink, x - eyeOffset - unit, eyeY - unit, unit * 2.5, unit);
      pixel(ctx, ink, x + eyeOffset - unit / 2, eyeY - unit, unit * 2.5, unit);
      // Slant the brows inward as the enemy becomes more dangerous.
      pixel(ctx, '#711d28', x - eyeOffset - unit, eyeY - unit * 2, unit, unit);
      pixel(ctx, '#711d28', x + eyeOffset + unit / 2, eyeY - unit * 2, unit, unit);
    }

    const mouthY = y + unit * 1.4;
    const mouthWidth = danger >= 0.8 ? unit * 4 : unit * 3;
    pixel(ctx, ink, x - mouthWidth / 2, mouthY, mouthWidth, unit);
    if (danger >= 0.8) {
      pixel(ctx, '#f2eee0', x - unit, mouthY + unit, unit, unit);
      pixel(ctx, '#f2eee0', x + unit / 2, mouthY + unit, unit, unit);
    } else if (danger < 0.3) {
      pixel(ctx, '#f2eee0', x - unit / 2, mouthY + unit, unit, unit);
    }
  };

  const drawBlockCreature = (ctx, x, y, size, color, danger) => {
    const half = size / 2;
    const unit = Math.max(2, Math.floor(size / 5));
    // Offset shadow and colored side/top planes give each sprite a chunky depth.
    pixel(ctx, '#080d16', x - half + unit, y - half + unit * 2, size, size);
    pixel(ctx, color, x - half, y - half, size, size);
    pixel(ctx, 'rgba(255,255,255,0.2)', x - half, y - half, size, unit);
    pixel(ctx, 'rgba(0,0,0,0.2)', x - half, y + half - unit, size, unit);
    pixel(ctx, 'rgba(0,0,0,0.18)', x + half - unit, y - half, unit, size);
    drawPixelFace(ctx, x, y, size, danger);
  };

  const drawHealthBar = (ctx, x, y, width, height, ratio, color) => {
    pixel(ctx, '#11131d', x - 1, y - 1, width + 2, height + 2);
    pixel(ctx, '#3a2530', x, y, width, height);
    pixel(ctx, color, x, y, width * Math.max(0, Math.min(1, ratio)), height);
    pixel(ctx, '#ffffff', x, y, width * Math.max(0, Math.min(1, ratio)), 1);
  };

  if (typeof ParticleSystem !== 'undefined') {
    ParticleSystem.prototype.draw = function (ctx) {
      for (const particle of this.particles) {
        ctx.globalAlpha = particle.life / particle.maxLife;
        pixel(ctx, particle.color, particle.x, particle.y, Math.max(2, Math.round(particle.size * 2)));
      }
      ctx.globalAlpha = 1;
    };
  }

  if (typeof SurviveBros === 'undefined') return;

  SurviveBros.prototype.drawPlayer = function (player, color) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    const size = 22;
    const x = Math.round(player.x);
    const y = Math.round(player.y);
    const half = size / 2;
    const unit = 4;

    pixel(ctx, '#07121d', x - half + 4, y - half + 7, size, size);
    pixel(ctx, color, x - half, y - half, size, size);
    pixel(ctx, '#a7f3ff', x - half, y - half, size, unit);
    pixel(ctx, '#0785a7', x - half, y + half - unit, size, unit);
    pixel(ctx, '#08718e', x + half - unit, y - half, unit, size);
    // Bright pixel eyes give the player a friendly block-hero expression.
    pixel(ctx, '#ffffff', x - 6, y - 3, 4, 4);
    pixel(ctx, '#ffffff', x + 3, y - 3, 4, 4);
    pixel(ctx, '#073047', x - 2, y + 5, 5, 2);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(player.angle);
    if (player.weapon.type === WeaponType.BOW) {
      pixel(ctx, '#693c20', 7, -2, 4, 4);
      pixel(ctx, '#d7a665', 10, -1, 8, 2);
      pixel(ctx, '#e8f6ff', 16, -2, 4, 4);
    } else {
      pixel(ctx, '#70431f', 8, -2, 6, 5);
      pixel(ctx, '#cbd5df', 14, -3, 13, 6);
      pixel(ctx, '#ffffff', 15, -3, 10, 2);
      pixel(ctx, '#8a9aa9', 24, -2, 3, 4);
    }
    ctx.restore();

    if (player.weapon.type === WeaponType.SWORD && player.swing > 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(player.angle);
      pixel(ctx, '#fff0a3', 18, -14, 8, 5);
      pixel(ctx, '#ffd44f', 24, -8, 9, 5);
      pixel(ctx, '#fff0a3', 27, 0, 8, 5);
      ctx.restore();
    }
  };

  SurviveBros.prototype.drawTrees = function () {
    const ctx = this.ctx;
    for (const tree of this.trees) {
      const x = Math.round(tree.x);
      const y = Math.round(tree.y);
      const unit = Math.max(5, Math.round(8 * tree.scale));
      // Layered square foliage replaces the old round canopy.
      pixel(ctx, '#12361f', x - unit * 2, y - unit * 2, unit * 4, unit * 3);
      pixel(ctx, '#236b35', x - unit * 1.5, y - unit * 3, unit * 3, unit * 2);
      pixel(ctx, '#38894a', x - unit, y - unit * 3, unit * 2, unit);
      pixel(ctx, '#57a85c', x - unit, y - unit * 2, unit, unit);
      pixel(ctx, '#69442c', x - unit / 2, y + unit, unit, unit * 2);
      pixel(ctx, '#9a6840', x - unit / 2, y + unit, unit / 2, unit * 2);
      pixel(ctx, '#35251e', x - unit, y + unit * 2, unit * 2, unit / 2);
    }
  };

  SurviveBros.prototype.drawArrows = function () {
    const ctx = this.ctx;
    for (const arrow of this.arrows) {
      ctx.save();
      ctx.translate(Math.round(arrow.x), Math.round(arrow.y));
      ctx.rotate(arrow.angle);
      pixel(ctx, '#6d4a2d', -5, -2, 10, 4);
      pixel(ctx, '#ffe16a', 3, -3, 6, 6);
      pixel(ctx, '#ffffff', 7, -2, 4, 4);
      ctx.restore();
    }
  };

  SurviveBros.prototype.drawEnemies = function () {
    const ctx = this.ctx;
    for (const enemy of this.enemies) {
      const size = Math.max(18, enemy.size + 8);
      const danger = Math.max(0.15, Math.min(0.98, 0.2 + this.wave * 0.045));
      drawBlockCreature(ctx, enemy.x, enemy.y, size, Colors.ENEMY, danger);
      const maxHp = CONFIG.ENEMY_BASE_HP + this.wave * CONFIG.ENEMY_HP_SCALE;
      drawHealthBar(ctx, enemy.x - 12, enemy.y - size / 2 - 8, 24, 4, enemy.hp / maxHp, '#ff5364');
    }
  };

  SurviveBros.prototype.drawMiniBoss = function () {
    if (!this.miniBoss) return;
    const enemy = this.miniBoss;
    const size = enemy.size + 12;
    const danger = Math.max(0.62, Math.min(0.9, 0.65 + enemy.level * 0.06));
    drawBlockCreature(this.ctx, enemy.x, enemy.y, size, Colors.MINI_BOSS, danger);
    drawHealthBar(this.ctx, enemy.x - 28, enemy.y - size / 2 - 12, 56, 6, enemy.hp / enemy.maxHp, '#ffc247');
    this.ctx.fillStyle = Colors.MINI_BOSS;
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MINI BOSS', enemy.x, enemy.y - size / 2 - 20);
  };

  SurviveBros.prototype.drawBoss = function () {
    if (!this.boss) return;
    const enemy = this.boss;
    const size = enemy.size + 16;
    const danger = Math.max(0.85, Math.min(1, 0.88 + enemy.level * 0.04));
    drawBlockCreature(this.ctx, enemy.x, enemy.y, size, Colors.BOSS, danger);
    drawHealthBar(this.ctx, enemy.x - 42, enemy.y - size / 2 - 14, 84, 8, enemy.hp / enemy.maxHp, '#ff3b55');
    this.ctx.fillStyle = Colors.BOSS;
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOSS', enemy.x, enemy.y - size / 2 - 23);

    if (enemy.hasSword) {
      this.ctx.save();
      this.ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
      this.ctx.rotate(enemy.angle);
      pixel(this.ctx, '#6c4a2e', 14, -3, 8, 6);
      pixel(this.ctx, '#d9e2ec', 21, -4, 20, 8);
      pixel(this.ctx, '#ffffff', 22, -4, 15, 3);
      this.ctx.restore();
    }
  };

  const originalDrawGame = SurviveBros.prototype.drawGame;
  SurviveBros.prototype.drawGame = function () {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    const daytime = this.time < CONFIG.NIGHT_START;
    ctx.fillStyle = daytime ? '#263c36' : '#101a2b';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Subtle 32px ground tiles add a crisp pixel-world texture without obscuring HUD.
    const tile = 32;
    for (let row = 0; row < SCREEN_HEIGHT / tile; row++) {
      for (let col = 0; col < SCREEN_WIDTH / tile; col++) {
        if ((row + col) % 2 === 0) {
          ctx.fillStyle = daytime ? 'rgba(127, 176, 112, 0.045)' : 'rgba(104, 131, 190, 0.045)';
          ctx.fillRect(col * tile, row * tile, tile, tile);
        }
      }
    }

    // Keep the existing entity order and HUD while using the blocky draw methods above.
    this.drawTrees();
    this.drawArrows();
    this.drawEnemies();
    this.drawMiniBoss();
    this.drawBoss();
    this.drawPlayer(this.player, Colors.PLAYER);
    this.particleSystem.draw(ctx);
    this.drawHUD();
  };
})();
