// Survive Bros - Web Edition (JavaScript/Canvas)

const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const FPS = 60;

// Game States
const GameState = {
  TITLE: 'title',
  PLAYING: 'playing',
  END: 'end',
  SHOP: 'shop'
};

// Weapon Types
const WeaponType = {
  SWORD: 'sword',
  BOW: 'bow'
};

// Enemy Types
const EnemyType = {
  NORMAL: 'normal',
  MINI_BOSS: 'mini_boss',
  BOSS: 'boss'
};

// Power-ups
const POWERUPS = {
  'health-boost': {
    name: 'Health Boost',
    cost: 30,
    effect: () => ({ type: 'hp', value: 30 }),
    color: '#e74c3c'
  },
  'damage-boost': {
    name: 'Damage Boost',
    cost: 40,
    effect: () => ({ type: 'damage', value: 5 }),
    color: '#ff6b6b'
  },
  'speed-boost': {
    name: 'Speed Boost',
    cost: 35,
    effect: () => ({ type: 'speed', value: 2 }),
    color: '#4ecdc4'
  },
  'fire-rate-boost': {
    name: 'Fire Rate Boost',
    cost: 45,
    effect: () => ({ type: 'fire_rate', value: 0.2 }),
    color: '#f1c40f'
  },
  'range-boost': {
    name: 'Range Boost',
    cost: 35,
    effect: () => ({ type: 'range', value: 20 }),
    color: '#9b59b6'
  }
};

// Colors
const Colors = {
  BLACK: '#000000',
  WHITE: '#ffffff',
  PLAYER: '#00d2ff',
  PLAYER2: '#ff00ff',
  ENEMY: '#e74c3c',
  MINI_BOSS: '#ff9800',
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
    speed: 1.5, // higher => faster attacks
    range: 80,
    cost: 0,
    color: '#bdc3c7',
    projectiles: 1
  },
  'wood-bow': {
    type: WeaponType.BOW,
    name: 'Wood Bow',
    atk: 20,
    speed: 1.0, // influences cooldown and arrow speed
    range: 400,
    cost: 0,
    color: '#8b4513',
    projectiles: 1,
    arrowSpeed: 15
  }
};

// Game Config
const CONFIG = {
  PLAYER_SPEED: 5,
  ENEMY_SPEED: 2.2,
  MINI_BOSS_SPEED_BASE: 1.5,
  BOSS_SPEED_BASE: 1.8,
  ARROW_SPEED: 15,
  ENEMY_DAMAGE: 0.5,
  MINI_BOSS_DAMAGE_BASE: 1.0,
  BOSS_DAMAGE_BASE: 1.2,
  INITIAL_HP: 100,
  INITIAL_WOOD: 20,
  WALL_COST: 10,
  WALL_HP: 200,
  WALL_DAMAGE: 0.5,
  ENEMY_KILL_REWARD: 5,
  MINI_BOSS_KILL_REWARD: 75,
  BOSS_KILL_REWARD: 150,
  TREE_KILL_REWARD: 10,
  TREE_HARVEST_DISTANCE: 60,
  ENEMY_BASE_HP: 40,
  ENEMY_HP_SCALE: 10,
  MINI_BOSS_HP_BASE: 200,
  BOSS_HP_SCALE_BASE: 500,
  SPAWN_RATE_BASE: 0.02,
  SPAWN_RATE_WAVE_SCALE: 0.005,
  DAY_LENGTH: 360,
  NIGHT_START: 180,
  MINI_BOSS_SPAWN_INTERVAL: 3,
  BOSS_SPAWN_INTERVAL: 10,
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
    this.autoStartCountdown = 120; // auto-start in 2 seconds

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
      size: 15,
      attackCooldown: 0,
      damageBoost: 0,
      speedBoost: 0,
      fireRateBoost: 0,
      rangeBoost: 0
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
      size: 15,
      attackCooldown: 0
    };

    this.trees = [];
    this.enemies = [];
    this.arrows = [];
    this.walls = [];
    this.miniBoss = null;
    this.boss = null;
    this.waveCleared = false;

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
      if (e.key === ' ' && this.state === GameState.SHOP) {
        this.resumeGame();
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

    // Use pointerdown to support touch and mouse consistently
    this.canvas.addEventListener('pointerdown', (ev) => {
      if (this.state === GameState.PLAYING) {
        this.handleAttack(this.player);
      } else if (this.state === GameState.SHOP) {
        this.handleShopClick(ev);
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

  placeWall(x, y) {
    if (this.player.wood >= CONFIG.WALL_COST) {
      this.player.wood -= CONFIG.WALL_COST;
      this.walls.push({
        x: x,
        y: y,
        hp: CONFIG.WALL_HP,
        size: 30
      });
    }
  }

  spawnEnemy() {
    if (this.time <= CONFIG.NIGHT_START || this.miniBoss || this.boss) return;
    if (this.waveCleared) return;
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
      size: 12,
      type: EnemyType.NORMAL
    });
  }

  spawnMiniBoss() {
    if (this.wave % CONFIG.MINI_BOSS_SPAWN_INTERVAL !== 0 || this.wave % CONFIG.BOSS_SPAWN_INTERVAL === 0) return;
    if (this.miniBoss) return;

    const level = Math.floor(this.wave / CONFIG.MINI_BOSS_SPAWN_INTERVAL);
    const hp = CONFIG.MINI_BOSS_HP_BASE * level;

    this.miniBoss = {
      x: SCREEN_WIDTH / 2,
      y: -50,
      hp: hp,
      maxHp: hp,
      angle: 0,
      level: level,
      speed: CONFIG.MINI_BOSS_SPEED_BASE + level * 0.1,
      damage: CONFIG.MINI_BOSS_DAMAGE_BASE + level * 0.2,
      onFire: 0,
      attackCooldown: 0,
      size: 25,
      type: EnemyType.MINI_BOSS
    };

    this.particleSystem.addExplosion(this.miniBoss.x, this.miniBoss.y, Colors.MINI_BOSS, 12);
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
      size: 35,
      hasSword: true,
      type: EnemyType.BOSS
    };

    this.particleSystem.addExplosion(this.boss.x, this.boss.y, Colors.BOSS, 15);
  }

  handleAttack(player) {
    if (player.attackCooldown > 0) return;

    const weapon = player.weapon;
    if (!weapon) return;

    const baseCooldown = Math.max(6, Math.floor(30 / (weapon.speed || 1)));
    const adjustedCooldown = Math.max(3, baseCooldown - Math.floor(player.fireRateBoost * 10));
    player.attackCooldown = adjustedCooldown;

    if (weapon.type === WeaponType.BOW) {
      this.fireBow(player);
    } else if (weapon.type === WeaponType.SWORD) {
      this.swingSword(player);
    }
  }

  swingSword(player) {
    const weapon = player.weapon;
    player.swing = 8;

    const range = weapon.range + player.rangeBoost;
    const damage = weapon.atk + player.damageBoost;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist <= range) {
        enemy.hp -= damage;
        this.particleSystem.addExplosion(enemy.x, enemy.y, Colors.ACCENT, 6);
      }
    }

    if (this.miniBoss) {
      const distM = Math.hypot(player.x - this.miniBoss.x, player.y - this.miniBoss.y);
      if (distM <= range) {
        this.miniBoss.hp -= damage;
        this.particleSystem.addExplosion(this.miniBoss.x, this.miniBoss.y, Colors.ACCENT, 10);
      }
    }

    if (this.boss) {
      const distB = Math.hypot(player.x - this.boss.x, player.y - this.boss.y);
      if (distB <= range) {
        this.boss.hp -= damage;
        this.particleSystem.addExplosion(this.boss.x, this.boss.y, Colors.ACCENT, 10);
      }
    }
  }

  fireBow(player) {
    const weapon = player.weapon;
    const projectiles = weapon.projectiles || 1;
    const spread = 0.1;
    const arrowSpeed = weapon.arrowSpeed || CONFIG.ARROW_SPEED;
    const baseAngle = player.angle;
    const damage = weapon.atk + player.damageBoost;
    const range = weapon.range + player.rangeBoost;

    for (let i = 0; i < projectiles; i++) {
      const t = projectiles === 1 ? 0.5 : i / (projectiles - 1);
      const angle = baseAngle + (t - 0.5) * spread;
      const arrow = {
        x: player.x + Math.cos(angle) * 10,
        y: player.y + Math.sin(angle) * 10,
        angle: angle,
        life: Math.floor(range / arrowSpeed) * 4,
        atk: damage,
        speed: arrowSpeed
      };
      this.arrows.push(arrow);
    }

    this.particleSystem.addExplosion(player.x + Math.cos(baseAngle) * 12, player.y + Math.sin(baseAngle) * 12, weapon.color || Colors.ACCENT, 4);
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

    const actualSpeed = player.speed + player.speedBoost;
    player.x = Math.max(20, Math.min(SCREEN_WIDTH - 20, player.x + mx * (actualSpeed / CONFIG.PLAYER_SPEED)));
    player.y = Math.max(20, Math.min(SCREEN_HEIGHT - 20, player.y + my * (actualSpeed / CONFIG.PLAYER_SPEED)));
    player.angle = Math.atan2(this.mouseY - player.y, this.mouseX - player.x);

    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.swing > 0) player.swing--;
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

  updateMiniBoss() {
    if (!this.miniBoss) return;

    const target = this.player;
    const dx = target.x - this.miniBoss.x;
    const dy = target.y - this.miniBoss.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      this.miniBoss.x += (dx / dist) * this.miniBoss.speed;
      this.miniBoss.y += (dy / dist) * this.miniBoss.speed;
    }

    this.miniBoss.angle = Math.atan2(dy, dx);

    if (this.miniBoss.attackCooldown <= 0 && dist < 80) {
      this.player.hp -= this.miniBoss.damage;
      this.miniBoss.attackCooldown = 25;
      this.particleSystem.addExplosion(this.player.x, this.player.y, Colors.DANGER, 6);
    } else {
      this.miniBoss.attackCooldown--;
    }

    if (this.miniBoss.hp <= 0) {
      this.player.wood += CONFIG.MINI_BOSS_KILL_REWARD;
      this.particleSystem.addExplosion(this.miniBoss.x, this.miniBoss.y, Colors.MINI_BOSS, 20);
      this.miniBoss = null;
      this.checkWaveCleared();
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
      this.checkWaveCleared();
    }
  }

  updateArrows() {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arrow = this.arrows[i];
      const spd = arrow.speed || CONFIG.ARROW_SPEED;
      arrow.x += Math.cos(arrow.angle) * spd;
      arrow.y += Math.sin(arrow.angle) * spd;
      arrow.life--;

      let hit = false;

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

      if (this.miniBoss && !hit) {
        const dist = Math.hypot(arrow.x - this.miniBoss.x, arrow.y - this.miniBoss.y);
        if (dist < 20) {
          this.miniBoss.hp -= arrow.atk;
          this.particleSystem.addExplosion(arrow.x, arrow.y, Colors.ACCENT, 8);
          hit = true;
        }
      }

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

  checkWaveCleared() {
    if (this.enemies.length === 0 && !this.miniBoss && !this.boss && this.time > CONFIG.NIGHT_START) {
      this.waveCleared = true;
      this.state = GameState.SHOP;
    }
  }

  resumeGame() {
    this.state = GameState.PLAYING;
    this.waveCleared = false;
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    this.updatePlayer(this.player);
    this.spawnEnemy();
    this.updateEnemies();
    this.updateMiniBoss();
    this.updateBoss();
    this.spawnMiniBoss();
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

    this.checkWaveCleared();
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

    // Auto-start countdown
    this.ctx.fillStyle = Colors.WHITE;
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Auto-starting in ${Math.ceil(this.autoStartCountdown / 60)}s...`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 20);

    // Instructions
    this.ctx.fillStyle = Colors.WHITE;
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    const instructions = [
      '☀️ DAY: Harvest Trees to get Wood.',
      '🌙 NIGHT: Defend against Monsters.',
      '🛠️ BUILD: Press Z to place Walls (10 Wood).',
      '⚔️ Click to attack enemies.',
      '👹 Mini-Boss every 3 waves | BOSS every 10 waves!'
    ];

    let y = SCREEN_HEIGHT / 2 + 80;
    for (const inst of instructions) {
      this.ctx.fillText(inst, 60, y);
      y += 32;
    }
  }

  drawShopScreen() {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Title
    this.ctx.fillStyle = Colors.PRIMARY;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚔️ POWER-UP SHOP ⚔️', SCREEN_WIDTH / 2, 60);

    // Current wood
    this.ctx.fillStyle = Colors.ACCENT;
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Wood: ${Math.floor(this.player.wood)}`, SCREEN_WIDTH / 2, 110);

    // Draw power-ups as buttons
    let yPos = 160;
    const powerupKeys = Object.keys(POWERUPS);
    const buttonWidth = 400;
    const buttonHeight = 60;
    const startX = (SCREEN_WIDTH - buttonWidth) / 2;

    for (let i = 0; i < powerupKeys.length; i++) {
      const key = powerupKeys[i];
      const powerup = POWERUPS[key];
      const x = startX;
      const y = yPos + i * 80;

      // Button background
      const canAfford = this.player.wood >= powerup.cost;
      this.ctx.fillStyle = canAfford ? powerup.color : '#444';
      this.ctx.fillRect(x, y, buttonWidth, buttonHeight);

      // Button border
      this.ctx.strokeStyle = Colors.WHITE;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, buttonWidth, buttonHeight);

      // Text
      this.ctx.fillStyle = Colors.WHITE;
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${powerup.name}`, x + 15, y + 30);
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Cost: ${powerup.cost} Wood`, x + 15, y + 50);

      // Store button info
      powerup.buttonX = x;
      powerup.buttonY = y;
      powerup.buttonWidth = buttonWidth;
      powerup.buttonHeight = buttonHeight;
      powerup.key = key;
    }

    // Instructions
    this.ctx.fillStyle = Colors.ACCENT;
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Click on a power-up to buy | Press SPACE to continue', SCREEN_WIDTH / 2, SCREEN_HEIGHT - 40);
  }

  handleShopClick(ev) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = ev.clientX - rect.left;
    const clickY = ev.clientY - rect.top;

    const powerupKeys = Object.keys(POWERUPS);
    for (const key of powerupKeys) {
      const powerup = POWERUPS[key];
      if (
        clickX >= powerup.buttonX &&
        clickX <= powerup.buttonX + powerup.buttonWidth &&
        clickY >= powerup.buttonY &&
        clickY <= powerup.buttonY + powerup.buttonHeight
      ) {
        if (this.player.wood >= powerup.cost) {
          this.player.wood -= powerup.cost;
          const effect = powerup.effect();
          this.applyPowerup(effect);
          this.particleSystem.addExplosion(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, powerup.color, 15);
        }
        break;
      }
    }
  }

  applyPowerup(effect) {
    switch (effect.type) {
      case 'hp':
        this.player.hp = Math.min(this.player.hp + effect.value, this.player.maxHp + effect.value);
        this.player.maxHp += effect.value;
        break;
      case 'damage':
        this.player.damageBoost += effect.value;
        break;
      case 'speed':
        this.player.speedBoost += effect.value;
        break;
      case 'fire_rate':
        this.player.fireRateBoost += effect.value;
        break;
      case 'range':
        this.player.rangeBoost += effect.value;
        break;
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
    this.ctx.fillText('NAH,ID WIN', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3);

    // Stats
    this.ctx.fillStyle = Colors.ACCENT;
    this.ctx.font = '32px Arial';
    this.ctx.fillText(`Wave: ${this.wave} | Wood: ${Math.floor(this.player.wood)}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

    // Retry text
    this.ctx.fillStyle = Colors.PRIMARY;
    this.ctx.fillText('Press SPACE to try to not die', SCREEN_WIDTH / 2, (SCREEN_HEIGHT * 2) / 3);
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
    this.drawMiniBoss();
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

    // Weapon indicator (smaller)
    if (player.weapon.type === WeaponType.BOW) {
      const bowLength = 12; // smaller
      this.ctx.strokeStyle = player.weapon.color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(player.x, player.y);
      this.ctx.lineTo(player.x + Math.cos(player.angle) * bowLength, player.y + Math.sin(player.angle) * bowLength);
      this.ctx.stroke();
    }

    // Draw sword swing arc (smaller)
    if (player.weapon.type === WeaponType.SWORD && player.swing > 0) {
      const progress = player.swing / 8;
      const arcRadius = (player.weapon.range + player.rangeBoost) * 0.4; // smaller
      this.ctx.beginPath();
      this.ctx.strokeStyle = player.weapon.color;
      this.ctx.lineWidth = 3;
      const startAngle = player.angle - Math.PI / 4 * progress;
      const endAngle = player.angle + Math.PI / 4 * progress;
      this.ctx.arc(player.x, player.y, arcRadius * 0.6, startAngle, endAngle);
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

      // Wall HP bar
      this.ctx.fillStyle = '#27ae60';
      const barWidth = 30;
      this.ctx.fillRect(wall.x - barWidth / 2, wall.y - wall.size / 2 - 8, barWidth * (wall.hp / CONFIG.WALL_HP), 3);
    }
  }

  drawArrows() {
    for (const arrow of this.arrows) {
      this.ctx.fillStyle = Colors.ACCENT;
      this.ctx.beginPath();
      this.ctx.arc(arrow.x, arrow.y, 3, 0, Math.PI * 2); // smaller
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

      // Enemy HP bar
      this.ctx.fillStyle = '#e74c3c';
      const barWidth = 20;
      const maxHp = CONFIG.ENEMY_BASE_HP + this.wave * CONFIG.ENEMY_HP_SCALE;
      this.ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size / 2 - 6, barWidth * (enemy.hp / maxHp), 2);
    }
  }

  drawMiniBoss() {
    if (!this.miniBoss) return;

    this.ctx.fillStyle = Colors.MINI_BOSS;
    this.ctx.fillRect(this.miniBoss.x - this.miniBoss.size / 2, this.miniBoss.y - this.miniBoss.size / 2, this.miniBoss.size, this.miniBoss.size);

    this.ctx.strokeStyle = Colors.WHITE;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.miniBoss.x - this.miniBoss.size / 2, this.miniBoss.y - this.miniBoss.size / 2, this.miniBoss.size, this.miniBoss.size);

    // Mini-Boss HP bar
    this.ctx.fillStyle = '#ff9800';
    const barWidth = 50;
    this.ctx.fillRect(this.miniBoss.x - barWidth / 2, this.miniBoss.y - this.miniBoss.size / 2 - 10, barWidth * (this.miniBoss.hp / this.miniBoss.maxHp), 6);

    // Mini-Boss label
    this.ctx.fillStyle = Colors.MINI_BOSS;
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MINI BOSS', this.miniBoss.x, this.miniBoss.y - this.miniBoss.size / 2 - 20);
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
    const barWidth = 80;
    this.ctx.fillRect(this.boss.x - barWidth / 2, this.boss.y - this.boss.size / 2 - 12, barWidth * (this.boss.hp / this.boss.maxHp), 8);

    // Boss label
    this.ctx.fillStyle = Colors.BOSS;
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOSS', this.boss.x, this.boss.y - this.boss.size / 2 - 25);

    // Draw sword for boss
    if (this.boss.hasSword) {
      this.ctx.strokeStyle = '#bdc3c7';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(this.boss.x, this.boss.y);
      this.ctx.lineTo(
        this.boss.x + Math.cos(this.boss.angle) * 20,
        this.boss.y + Math.sin(this.boss.angle) * 20
      );
      this.ctx.stroke();
    }
  }

  drawHUD() {
    this.ctx.fillStyle = Colors.WHITE;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'left';

    this.ctx.fillText(`Wave: ${this.wave}`, 20, 30);
    this.ctx.fillText(`Wood: ${Math.floor(this.player.wood)}`, 20, 60);
    this.ctx.fillText(`HP: ${Math.floor(this.player.hp)}/${Math.floor(this.player.maxHp)}`, 20, 90);

    const isDaytime = this.time < CONFIG.NIGHT_START;
    this.ctx.fillStyle = isDaytime ? Colors.ACCENT : Colors.PRIMARY;
    this.ctx.fillText(isDaytime ? '☀️ DAY' : '🌙 NIGHT', SCREEN_WIDTH - 150, 30);

    // Boosts display
    this.ctx.fillStyle = Colors.WHITE;
    this.ctx.font = '14px Arial';
    if (this.player.damageBoost > 0) {
      this.ctx.fillText(`DMG: +${this.player.damageBoost}`, 20, 120);
    }
    if (this.player.speedBoost > 0) {
      this.ctx.fillText(`SPD: +${this.player.speedBoost}`, 20, 140);
    }
    if (this.player.fireRateBoost > 0) {
      this.ctx.fillText(`RATE: +${(this.player.fireRateBoost * 100).toFixed(0)}%`, 20, 160);
    }
  }

  startGame() {
    this.state = GameState.PLAYING;
    this.time = 0;
    this.wave = 1;
    this.frameCount = 0;
    this.autoStartCountdown = 120;

    this.player.hp = CONFIG.INITIAL_HP;
    this.player.maxHp = CONFIG.INITIAL_HP;
    this.player.wood = CONFIG.INITIAL_WOOD;
    this.player.attackCooldown = 0;
    this.player.damageBoost = 0;
    this.player.speedBoost = 0;
    this.player.fireRateBoost = 0;
    this.player.rangeBoost = 0;

    this.trees = [];
    this.enemies = [];
    this.arrows = [];
    this.walls = [];
    this.miniBoss = null;
    this.boss = null;
    this.waveCleared = false;

    this.initializeWorld();
  }

  render() {
    if (this.state === GameState.TITLE) {
      this.drawTitleScreen();
    } else if (this.state === GameState.PLAYING) {
      this.drawGame();
    } else if (this.state === GameState.SHOP) {
      this.drawGame();
      this.drawShopScreen();
    } else if (this.state === GameState.END) {
      this.drawEndScreen();
    }
  }

  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  updateTitleScreen() {
    this.autoStartCountdown--;
    if (this.autoStartCountdown <= 0) {
      this.startGame();
    }
  }

  start() {
    this.gameLoop();
    // Update title screen countdown
    setInterval(() => {
      if (this.state === GameState.TITLE) {
        this.updateTitleScreen();
      }
    }, 16); // ~60fps
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
