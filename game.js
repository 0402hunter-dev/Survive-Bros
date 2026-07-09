// Survive Bros - Web Edition (JavaScript/Canvas)

const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const FPS = 60;

// Game States
const GameState = {
  TITLE: 'title',
  PLAYING: 'playing',
  END: 'end'
};

// Weapon Types
const WeaponType = {
  SWORD: 'sword',
  BOW: 'bow'
};

// Colors
const Colors = {
  BLACK: '#000000',
  WHITE: '#ffffff',
  PLAYER: '#00d2ff',
  PLAYER2: '#ff00ff',
  ENEMY: '#e74c3c',
  BOSS: '#ff4757',
  TREE_TRUNK: '#3e2723',
  TREE_LEAF: '#1b4d2e',
  PRIMARY: '#2ecb71',
  DANGER: '#ff4757',
  ACCENT: '#f1c40f',
  DARK_BG: '#141e1e',
  LIGHT_BG: '#1e1e28'
};

// Weapons
const WEAPONS = {
  'iron-sword': {
    type: WeaponType.SWORD,
    name: 'Iron Sword',
    atk: 25,
    speed: 1.5,
    range: 80,
    cost: 0,
    color: '#bdc3c7',
    projectiles: 1
  },
  'wood-bow': {
    type: WeaponType.BOW,
    name: 'Wood Bow',
    atk: 20,
    speed: 1.0,
    range: 400,
    cost: 0,
    color: '#8b4513',
    projectiles: 1
  }
};

// Game Config
const CONFIG = {
  PLAYER_SPEED: 5,
  ENEMY_SPEED: 2.2,
  BOSS_SPEED_BASE: 1.8,
  ARROW_SPEED: 15,
  ENEMY_DAMAGE: 0.5,
  BOSS_DAMAGE_BASE: 1.2,
  INITIAL_HP: 100,
  INITIAL_WOOD: 20,
  WALL_COST: 10,
  WALL_HP: 200,
  WALL_DAMAGE: 0.5,
  ENEMY_KILL_REWARD: 5,
  BOSS_KILL_REWARD: 150,
  TREE_KILL_REWARD: 10,
  TREE_HARVEST_DISTANCE: 60,
  ENEMY_BASE_HP: 40,
  ENEMY_HP_SCALE: 10,
  BOSS_HP_SCALE_BASE: 500,
  SPAWN_RATE_BASE: 0.02,
  SPAWN_RATE_WAVE_SCALE: 0.005,
  DAY_LENGTH: 360,
  NIGHT_START: 180,
  BOSS_SPAWN_INTERVAL: 3,
  TREE_COUNT: 15
};

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addExplosion(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: color,
        size: 2 + Math.random() * 2
      });
    }
  }

  addFireEffect(x, y, count = 3) {
    const colors = ['#ff9600', '#ff6400', '#ffc800'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + Math.random() * Math.PI;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: -Math.abs(Math.sin(angle) * speed),
        life: 25,
        maxLife: 25,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravity
      p.life -= 1;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = this.hexToRgba(p.color, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

class SurviveBros {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = GameState.TITLE;
    this.time = 0;
    this.wave = 1;
    this.frameCount = 0;
    this.isMultiplayer = false;
    this.keysPressed = new Set();
    this.mouseX = SCREEN_WIDTH / 2;
    this.mouseY = SCREEN_HEIGHT / 2;

    this.particleSystem = new ParticleSystem();

    // Initialize player
    this.player = {
      x: SCREEN_WIDTH / 2 - 50,
      y: SCREEN_HEIGHT / 2,
      hp: CONFIG.INITIAL_HP,
      maxHp: CONFIG.INITIAL_HP,
      wood: CONFIG.INITIAL_WOOD,
      angle: 0,
      weaponKey: 'iron-sword',
      weapon: WEAPONS['iron-sword'],
      speed: CONFIG.PLAYER_SPEED,
      swing: 0,
      size: 15
    };

    this.player2 = {
      x: SCREEN_WIDTH / 2 + 50,
      y: SCREEN_HEIGHT / 2,
      hp: CONFIG.INITIAL_HP,
      maxHp: CONFIG.INITIAL_HP,
      wood: CONFIG.INITIAL_WOOD,
      angle: 0,
      weaponKey: 'wood-bow',
      weapon: WEAPONS['wood-bow'],
      speed: CONFIG.PLAYER_SPEED,
      swing: 0,
      size: 15
    };

    this.trees = [];
    this.enemies = [];
    this.arrows = [];
    this.walls = [];
    this.boss = null;

    this.setupEventListeners();
    this.initializeWorld();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.key.toLowerCase());
      if (e.key === ' ' && this.state === GameState.TITLE) {
        this.startGame();
      }
      if (e.key === ' ' && this.state === GameState.END) {
        this.startGame();
      }
      if (e.key.toLowerCase() === 'z') {
        this.placeWall(this.player.x, this.player.y);
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.key.toLowerCase());
    });

    document.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('click', () => {
      if (this.state === GameState.PLAYING) {
        this.handleMouseClick(this.player);
      }
    });
  }

  initializeWorld() {
    this.trees = [];
    for (let i = 0; i < CONFIG.TREE_COUNT; i++) {
      this.spawnTree();
    }
  }

  spawnTree() {
    this.trees.push({
      x: 50 + Math.random() * (SCREEN_WIDTH - 100),
      y: 50 + Math.random() * (SCREEN_HEIGHT - 100),
      scale: 0.8 + Math.random() * 0.5
    });
  }

  spawnEnemy() {
    if (this.time <= CONFIG.NIGHT_START || this.boss) return;
    if (Math.random() > CONFIG.SPAWN_RATE_BASE + this.wave * CONFIG.SPAWN_RATE_WAVE_SCALE) return;

    const edges = [
      [Math.random() * SCREEN_WIDTH, -30],
      [SCREEN_WIDTH + 30, Math.random() * SCREEN_HEIGHT],
      [Math.random() * SCREEN_WIDTH, SCREEN_HEIGHT + 30],
      [-30, Math.random() * SCREEN_HEIGHT]
    ];

    const edge = edges[Math.floor(Math.random() * edges.length)];
    this.enemies.push({
      x: edge[0],
      y: edge[1],
      hp: CONFIG.ENEMY_BASE_HP + this.wave * CONFIG.ENEMY_HP_SCALE,
      onFire: 0,
      size: 12
    });
  }

  spawnBoss() {
    if (this.wave % CONFIG.BOSS_SPAWN_INTERVAL !== 0) return;
    if (this.boss) return;

    const level = Math.floor(this.wave / CONFIG.BOSS_SPAWN_INTERVAL);
    const hp = CONFIG.BOSS_HP_SCALE_BASE * level * 1.5;

    this.boss = {
      x: SCREEN_WIDTH / 2,
      y: -100,
      hp: hp,
      maxHp: hp,
      angle: 0,
      level: level,
      speed: CONFIG.BOSS_SPEED_BASE + level * 0.2,
      damage: CONFIG.BOSS_DAMAGE_BASE + level * 0.3,
      onFire: 0,
      attackCooldown: 0,
      size: 30
    };

    this.particleSystem.addExplosion(this.boss.x, this.boss.y, Colors.BOSS, 15);
  }

  handleMouseClick(player) {
    if (player.weapon.type === WeaponType.BOW) {
      this.fireArrow(player);
    }
  }

  fireArrow(player) {
    const weapon = player.weapon;
    const arrow = {
      x: player.x,
      y: player.y,
      angle: player.angle,
      life: 120,
      atk: weapon.atk
    };
    this.arrows.push(arrow);
  }

  placeWall(x, y) {
    if (this.player.wood < CONFIG.WALL_COST) return;
    this.player.wood -= CONFIG.WALL_COST;
    this.walls.push({
      x: x,
      y: y,
      hp: CONFIG.WALL_HP,
      size: 40
    });
    this.particleSystem.addExplosion(x, y, Colors.PRIMARY, 5);
  }

  updatePlayer(player) {
    let mx = 0,
      my = 0;

    if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) my -= player.speed;
    if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) my += player.speed;
    if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) mx -= player.speed;
    if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) mx += player.speed;

    if (mx !== 0 && my !== 0) {
      mx *= 0.707;
      my *= 0.707;
    }

    player.x = Math.max(20, Math.min(SCREEN_WIDTH - 20, player.x + mx));
    player.y = Math.max(20, Math.min(SCREEN_HEIGHT - 20, player.y + my));
    player.angle = Math.atan2(this.mouseY - player.y, this.mouseX - player.x);
  }

  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const target = this.player;

      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        enemy.x += (dx / dist) * CONFIG.ENEMY_SPEED;
        enemy.y += (dy / dist) * CONFIG.ENEMY_SPEED;
      }

      // Damage player on contact
      if (dist < 30) {
        this.player.hp -= CONFIG.ENEMY_DAMAGE;
      }

      if (enemy.hp <= 0) {
        this.player.wood += CONFIG.ENEMY_KILL_REWARD;
        this.particleSystem.addExplosion(enemy.x, enemy.y, Colors.ENEMY, 10);
        this.enemies.splice(i, 1);
      }
    }
  }

  updateBoss() {
    if (!this.boss) return;

    const target = this.player;
    const dx = target.x - this.boss.x;
    const dy = target.y - this.boss.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      this.boss.x += (dx / dist) * this.boss.speed;
      this.boss.y += (dy / dist) * this.boss.speed;
    }

    this.boss.angle = Math.atan2(dy, dx);

    if (this.boss.attackCooldown <= 0 && dist < 100) {
      this.player.hp -= this.boss.damage;
      this.boss.attackCooldown = 30;
      this.particleSystem.addExplosion(this.player.x, this.player.y, Colors.DANGER, 8);
    } else {
      this.boss.attackCooldown--;
    }

    if (this.boss.hp <= 0) {
      this.player.wood += CONFIG.BOSS_KILL_REWARD;
      this.particleSystem.addExplosion(this.boss.x, this.boss.y, Colors.BOSS, 25);
      this.boss = null;
    }
  }

  updateArrows() {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arrow = this.arrows[i];
      arrow.x += Math.cos(arrow.angle) * CONFIG.ARROW_SPEED;
      arrow.y += Math.sin(arrow.angle) * CONFIG.ARROW_SPEED;
      arrow.life--;

      let hit = false;

      // Check enemy collisions
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        const dist = Math.hypot(arrow.x - enemy.x, arrow.y - enemy.y);
        if (dist < 15) {
          enemy.hp -= arrow.atk;
          this.particleSystem.addExplosion(arrow.x, arrow.y, Colors.ACCENT, 5);
          hit = true;
          break;
        }
      }

      // Check boss collision
      if (this.boss && !hit) {
        const dist = Math.hypot(arrow.x - this.boss.x, arrow.y - this.boss.y);
        if (dist < 20) {
          this.boss.hp -= arrow.atk;
          this.particleSystem.addExplosion(arrow.x, arrow.y, Colors.ACCENT, 8);
          hit = true;
        }
      }

      if (
        arrow.x < 0 ||
        arrow.x > SCREEN_WIDTH ||
        arrow.y < 0 ||
        arrow.y > SCREEN_HEIGHT ||
        arrow.life <= 0 ||
        hit
      ) {
        this.arrows.splice(i, 1);
      }
    }
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    this.updatePlayer(this.player);
    this.spawnEnemy();
    this.updateEnemies();
    this.updateBoss();
    this.spawnBoss();
    this.updateArrows();
    this.particleSystem.update();

    this.time++;
    if (this.time >= CONFIG.DAY_LENGTH) {
      this.time = 0;
      this.wave++;
    }

    if (this.player.hp <= 0) {
      this.state = GameState.END;
    }

    this.frameCount++;
  }

  drawTitleScreen() {
    // Animated background
    for (let i = 0; i < SCREEN_HEIGHT; i++) {
      const val = 30 + 20 * Math.sin(i / 100 + this.frameCount / 30);
      this.ctx.fillStyle = `rgb(${Math.floor(val)}, ${Math.floor(val)}, ${Math.floor(val + 20)})`;
      this.ctx.fillRect(0, i, SCREEN_WIDTH, 1);
    }

    // Title
    this.ctx.fillStyle = Colors.PRIMARY;
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SURVIVE BROS', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 4);

    // Start text
    this.ctx.fillStyle = Colors.ACCENT;
    this.ctx.font = '48px Arial';
    this.ctx.fillText('Press SPACE to Start', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 40);

    // Instructions
    this.ctx.fillStyle = Colors.WHITE;
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    const instructions = [
      '☀️ DAY: Harvest Trees to get Wood.',
      '🌙 NIGHT: Defend against Monsters.',
      '🛠️ BUILD: Press Z to place Walls (10 Wood).',
      '⚔️ Click to shoot arrows at enemies.',
      '👹 BOSS appears every 3 waves!'
    ];

    let y = SCREEN_HEIGHT / 2 + 80;
    for (const inst of instructions) {
      this.ctx.fillText(inst, 60, y);
      y += 32;
    }
  }

  drawEndScreen() {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // End text
    this.ctx.fillStyle = Colors.DANGER;
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('YOU PERISHED', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3);

    // Stats
    this.ctx.fillStyle = Colors.ACCENT;
    this.ctx.font = '32px Arial';
    this.ctx.fillText(`Wave: ${this.wave} | Wood: ${Math.floor(this.player.wood)}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

    // Retry text
    this.ctx.fillStyle = Colors.PRIMARY;
    this.ctx.fillText('Press SPACE to Retry', SCREEN_WIDTH / 2, (SCREEN_HEIGHT * 2) / 3);
  }

  drawGame() {
    // Background
    const isDaytime = this.time < CONFIG.NIGHT_START;
    if (isDaytime) {
      this.ctx.fillStyle = '#141e28';
      this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    } else {
      this.ctx.fillStyle = '#0a0a14';
      this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    // Draw entities
    this.drawTrees();
    this.drawWalls();
    this.drawArrows();
    this.drawEnemies();
    this.drawBoss();
    this.drawPlayer(this.player, Colors.PLAYER);

    // Draw particles
    this.particleSystem.draw(this.ctx);

    // Draw HUD
    this.drawHUD();
  }

  drawPlayer(player, color) {
    // Glow
    const gradient = this.ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 25);
    gradient.addColorStop(0, `rgba(0, 210, 255, 0.3)`);
    gradient.addColorStop(1, `rgba(0, 210, 255, 0)`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(player.x - 25, player.y - 25, 50, 50);

    // Body
    this.ctx.fillStyle = color;
    this.ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

    // Outline
    this.ctx.strokeStyle = Colors.WHITE;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

    // Weapon indicator
    if (player.weapon.type === WeaponType.BOW) {
      const bowLength = 20;
      this.ctx.strokeStyle = player.weapon.color;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(player.x, player.y);
      this.ctx.lineTo(player.x + Math.cos(player.angle) * bowLength, player.y + Math.sin(player.angle) * bowLength);
      this.ctx.stroke();
    }
  }

  drawTrees() {
    for (const tree of this.trees) {
      const trunkWidth = 16 * tree.scale;
      const trunkHeight = 25 * tree.scale;

      this.ctx.fillStyle = Colors.TREE_TRUNK;
      this.ctx.fillRect(tree.x - trunkWidth / 2, tree.y - trunkHeight / 2, trunkWidth, trunkHeight);

      this.ctx.fillStyle = Colors.TREE_LEAF;
      this.ctx.beginPath();
      this.ctx.arc(tree.x, tree.y - 10 * tree.scale, 15 * tree.scale, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawWalls() {
    for (const wall of this.walls) {
      this.ctx.fillStyle = '#5d4037';
      this.ctx.fillRect(wall.x - wall.size / 2, wall.y - wall.size / 2, wall.size, wall.size);
    }
  }

  drawArrows() {
    for (const arrow of this.arrows) {
      this.ctx.fillStyle = Colors.ACCENT;
      this.ctx.beginPath();
      this.ctx.arc(arrow.x, arrow.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawEnemies() {
    for (const enemy of this.enemies) {
      this.ctx.fillStyle = Colors.ENEMY;
      this.ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);

      this.ctx.strokeStyle = Colors.WHITE;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
    }
  }

  drawBoss() {
    if (!this.boss) return;

    this.ctx.fillStyle = Colors.BOSS;
    this.ctx.fillRect(this.boss.x - this.boss.size / 2, this.boss.y - this.boss.size / 2, this.boss.size, this.boss.size);

    this.ctx.strokeStyle = Colors.WHITE;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.boss.x - this.boss.size / 2, this.boss.y - this.boss.size / 2, this.boss.size, this.boss.size);

    // Boss HP bar
    this.ctx.fillStyle = '#e74c3c';
    const barWidth = 60;
    this.ctx.fillRect(this.boss.x - barWidth / 2, this.boss.y - this.boss.size / 2 - 10, barWidth * (this.boss.hp / this.boss.maxHp), 5);
  }

  drawHUD() {
    this.ctx.fillStyle = Colors.WHITE;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'left';

    this.ctx.fillText(`Wave: ${this.wave}`, 20, 30);
    this.ctx.fillText(`Wood: ${Math.floor(this.player.wood)}`, 20, 60);
    this.ctx.fillText(`HP: ${Math.floor(this.player.hp)}`, 20, 90);

    const isDaytime = this.time < CONFIG.NIGHT_START;
    this.ctx.fillStyle = isDaytime ? Colors.ACCENT : Colors.PRIMARY;
    this.ctx.fillText(isDaytime ? '☀️ DAY' : '🌙 NIGHT', SCREEN_WIDTH - 150, 30);
  }

  startGame() {
    this.state = GameState.PLAYING;
    this.time = 0;
    this.wave = 1;
    this.frameCount = 0;

    this.player.hp = CONFIG.INITIAL_HP;
    this.player.maxHp = CONFIG.INITIAL_HP;
    this.player.wood = CONFIG.INITIAL_WOOD;

    this.trees = [];
    this.enemies = [];
    this.arrows = [];
    this.walls = [];
    this.boss = null;

    this.initializeWorld();
  }

  render() {
    if (this.state === GameState.TITLE) {
      this.drawTitleScreen();
    } else if (this.state === GameState.PLAYING) {
      this.drawGame();
    } else if (this.state === GameState.END) {
      this.drawEndScreen();
    }
  }

  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  start() {
    this.gameLoop();
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const loadingDiv = document.getElementById('loading');
  loadingDiv.style.display = 'none';

  const game = new SurviveBros(canvas);
  game.start();
});
