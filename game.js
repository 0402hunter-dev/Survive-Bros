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

// Power-up Types
const PowerUpType = {
  HEALTH: 'health',
  DAMAGE: 'damage',
  SPEED: 'speed'
};

// Colors
const Colors = {
  BLACK: '#000000',
  WHITE: '#ffffff',
  PLAYER: '#00d2ff',
  PLAYER2: '#ff00ff',
  ENEMY: '#e74c3c',
  BOSS: '#ff4757',
  MINIBOSS: '#ff9f43',
  TREE_TRUNK: '#3e2723',
  TREE_LEAF: '#1b4d2e',
  PRIMARY: '#2ecb71',
  DANGER: '#ff4757',
  ACCENT: '#f1c40f',
  DARK_BG: '#141e1e',
  LIGHT_BG: '#1e1e28',
  POWERUP_HEALTH: '#ff6b6b',
  POWERUP_DAMAGE: '#ffa502',
  POWERUP_SPEED: '#64dfdf',
  SWORD_BLADE: '#e8e8e8',
  SWORD_EDGE: '#c0c0c0',
  SWORD_HILT: '#8b4513',
  SWORD_GUARD: '#daa520',
  SWORD_HANDLE: '#a0522d'
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
  BOSS_SPEED_BASE: 1.8,
  ARROW_SPEED: 15, // fallback if weapon doesn't provide arrowSpeed
  ENEMY_DAMAGE: 0.5,
  BOSS_DAMAGE_BASE: 1.2,
  INITIAL_HP: 100,
  INITIAL_WOOD: 20,
  WALL_COST: 10,
  WALL_HP: 200,
  WALL_SIZE: 30,
  WALL_DAMAGE: 0.5,
  ENEMY_KILL_REWARD: 5,
  BOSS_KILL_REWARD: 150,
  MINIBOSS_KILL_REWARD: 75,
  TREE_KILL_REWARD: 10,
  TREE_HARVEST_DISTANCE: 60,
  ENEMY_BASE_HP: 40,
  ENEMY_HP_SCALE: 10,
  BOSS_HP_SCALE_BASE: 500,
  MINIBOSS_HP_SCALE_BASE: 250,
  SPAWN_RATE_BASE: 0.02,
  SPAWN_RATE_WAVE_SCALE: 0.005,
  DAY_LENGTH: 360,
  NIGHT_START: 180,
  MINIBOSS_SPAWN_INTERVAL: 3,
  BOSS_SPAWN_INTERVAL: 10,
  TREE_COUNT: 15,
  BOSS_MELEE_RANGE: 50,
  MINIBOSS_MELEE_RANGE: 45,
  BLOCK_COOLDOWN: 30,
  BLOCK_DURATION: 8,
  POWERUP_SPAWN_CHANCE: 0.1
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
      size: 15,
      attackCooldown: 0,
      blocking: false,
      blockCooldown: 0,
      damageMultiplier: 1.0
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
      attackCooldown: 0,
      blocking: false,
      blockCooldown: 0,
      damageMultiplier: 1.0
    };

    this.trees = [];
    this.enemies = [];
    this.arrows = [];
    this.walls = [];
    this.boss = null;
    this.miniboss = null;
    this.powerups = [];
    this.waveComplete = false;

    this.setupEventListeners();
    this.initializeWorld();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keysPressed.add(key);

      if (e.key === ' ' && this.state === GameState.TITLE) {
        this.startGame();
      }
      if (e.key === ' ' && this.state === GameState.END) {
        this.startGame();
      }
      if (key === 'z') {
        this.placeWall(this.player.x, this.player.y);
      }
      // Switch weapons with 'x' key
      if (key === 'x') {
        this.switchWeapon(this.player);
      }
      // Block with 'c' key
      if (key === 'c') {
        this.startBlock(this.player);
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
    if (this.time <= CONFIG.NIGHT_START || this.boss || this.miniboss) return;
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

  spawnMiniBoss() {
    if (this.wave % CONFIG.MINIBOSS_SPAWN_INTERVAL !== 0) return;
    if (this.wave % CONFIG.BOSS_SPAWN_INTERVAL === 0) return; // Boss takes priority
    if (this.miniboss) return;

    const level = Math.floor(this.wave / CONFIG.MINIBOSS_SPAWN_INTERVAL);
    const hp = CONFIG.MINIBOSS_HP_SCALE_BASE * level;

    this.miniboss = {
      x: SCREEN_WIDTH / 2,
      y: -100,
      hp: hp,
      maxHp: hp,
      angle: 0,
      level: level,
      speed: 2.0 + level * 0.1,
      damage: 0.8 + level * 0.2,
      onFire: 0,
      attackCooldown: 0,
      size: 24
    };

    this.particleSystem.addExplosion(this.miniboss.x, this.miniboss.y, Colors.MINIBOSS, 12);
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
      size: 30,
      hasSword: true // Boss now has sword for melee attacks
    };

    this.particleSystem.addExplosion(this.boss.x, this.boss.y, Colors.BOSS, 15);
  }

  placeWall(x, y) {
    if (this.player.wood < CONFIG.WALL_COST) return;

    // Check if too close to player or another wall
    for (const wall of this.walls) {
      if (Math.hypot(wall.x - x, wall.y - y) < 50) {
        return; // Too close to another wall
      }
    }

    this.walls.push({
      x: x,
      y: y,
      hp: CONFIG.WALL_HP,
      maxHp: CONFIG.WALL_HP,
      size: CONFIG.WALL_SIZE
    });

    this.player.wood -= CONFIG.WALL_COST;
  }

  switchWeapon(player) {
    const weapons = Object.keys(WEAPONS);
    const currentIndex = weapons.indexOf(player.weaponKey);
    const nextIndex = (currentIndex + 1) % weapons.length;
    player.weaponKey = weapons[nextIndex];
    player.weapon = WEAPONS[player.weaponKey];
    player.attackCooldown = 0; // Reset cooldown when switching
    this.particleSystem.addExplosion(player.x, player.y, Colors.ACCENT, 5);
  }

  startBlock(player) {
    if (player.blockCooldown > 0) return;
    player.blocking = true;
    setTimeout(() => {
      player.blocking = false;
      player.blockCooldown = CONFIG.BLOCK_COOLDOWN;
    }, CONFIG.BLOCK_DURATION * 16); // 16ms per frame
  }

  // New unified attack handler for players
  handleAttack(player) {
    // Check cooldown
    if (player.attackCooldown > 0) return;

    const weapon = player.weapon;
    if (!weapon) return;

    // Determine cooldown based on weapon.speed (higher speed -> lower cooldown)
    // Base cooldown frames: 30 (0.5s at 60fps) divided by speed
    const baseCooldown = Math.max(6, Math.floor(30 / (weapon.speed || 1)));
    player.attackCooldown = baseCooldown;

    if (weapon.type === WeaponType.BOW) {
      this.fireBow(player);
    } else if (weapon.type === WeaponType.SWORD) {
      this.swingSword(player);
    }
  }

  swingSword(player) {
    const weapon = player.weapon;
    player.swing = 8; // frames of swing animation

    const damage = weapon.atk * player.damageMultiplier;

    // Damage enemies within range
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist <= weapon.range) {
        enemy.hp -= damage;
        this.particleSystem.addExplosion(enemy.x, enemy.y, Colors.ACCENT, 6);
      }
    }

    // Damage boss if in range
    if (this.boss) {
      const distB = Math.hypot(player.x - this.boss.x, player.y - this.boss.y);
      if (distB <= weapon.range) {
        this.boss.hp -= damage;
        this.particleSystem.addExplosion(this.boss.x, this.boss.y, Colors.ACCENT, 10);
      }
    }

    // Damage miniboss if in range
    if (this.miniboss) {
      const distM = Math.hypot(player.x - this.miniboss.x, player.y - this.miniboss.y);
      if (distM <= weapon.range) {
        this.miniboss.hp -= damage;
        this.particleSystem.addExplosion(this.miniboss.x, this.miniboss.y, Colors.ACCENT, 8);
      }
    }
  }

  fireBow(player) {
    const weapon = player.weapon;
    const projectiles = weapon.projectiles || 1;
    const spread = 0.1; // radians total spread when firing multiple arrows
    const arrowSpeed = weapon.arrowSpeed || CONFIG.ARROW_SPEED;
    const baseAngle = player.angle;
    const damage = weapon.atk * player.damageMultiplier;

    for (let i = 0; i < projectiles; i++) {
      const t = projectiles === 1 ? 0.5 : i / (projectiles - 1);
      const angle = baseAngle + (t - 0.5) * spread;
      const arrow = {
        x: player.x + Math.cos(angle) * 10,
        y: player.y + Math.sin(angle) * 10,
        angle: angle,
        life: Math.floor((weapon.range || 400) / arrowSpeed) * 4,
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

    player.x = Math.max(20, Math.min(SCREEN_WIDTH - 20, player.x + mx));
    player.y = Math.max(20, Math.min(SCREEN_HEIGHT - 20, player.y + my));
    player.angle = Math.atan2(this.mouseY - player.y, this.mouseX - player.x);

    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.swing > 0) player.swing--;
    if (player.blockCooldown > 0) player.blockCooldown--;
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

      // Damage player on contact (unless blocking)
      if (dist < 30 && !this.player.blocking) {
        this.player.hp -= CONFIG.ENEMY_DAMAGE;
      } else if (dist < 30 && this.player.blocking) {
        this.particleSystem.addExplosion(this.player.x, this.player.y, Colors.PRIMARY, 4);
      }

      // Check wall collisions
      for (let j = this.walls.length - 1; j >= 0; j--) {
        const wall = this.walls[j];
        const wallDist = Math.hypot(enemy.x - wall.x, enemy.y - wall.y);
        if (wallDist < 30) {
          wall.hp -= CONFIG.WALL_DAMAGE;
          if (wall.hp <= 0) {
            this.walls.splice(j, 1);
            this.particleSystem.addExplosion(wall.x, wall.y, '#5d4037', 8);
          }
        }
      }

      if (enemy.hp <= 0) {
        this.player.wood += CONFIG.ENEMY_KILL_REWARD;
        this.particleSystem.addExplosion(enemy.x, enemy.y, Colors.ENEMY, 10);
        
        // Chance to spawn power-up
        if (Math.random() < CONFIG.POWERUP_SPAWN_CHANCE) {
          this.spawnPowerUp(enemy.x, enemy.y);
        }
        
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

    // Boss melee attack with sword (reduced range)
    if (this.boss.attackCooldown <= 0 && dist < CONFIG.BOSS_MELEE_RANGE) {
      if (!this.player.blocking) {
        this.player.hp -= this.boss.damage;
      } else {
        this.particleSystem.addExplosion(this.player.x, this.player.y, Colors.PRIMARY, 6);
      }
      this.boss.attackCooldown = 30;
      this.particleSystem.addExplosion(this.player.x, this.player.y, Colors.DANGER, 8);
    } else {
      this.boss.attackCooldown--;
    }

    // Check wall collisions
    for (let j = this.walls.length - 1; j >= 0; j--) {
      const wall = this.walls[j];
      const wallDist = Math.hypot(this.boss.x - wall.x, this.boss.y - wall.y);
      if (wallDist < 40) {
        wall.hp -= CONFIG.WALL_DAMAGE * 2; // Boss does more damage to walls
        if (wall.hp <= 0) {
          this.walls.splice(j, 1);
          this.particleSystem.addExplosion(wall.x, wall.y, '#5d4037', 10);
        }
      }
    }

    if (this.boss.hp <= 0) {
      this.player.wood += CONFIG.BOSS_KILL_REWARD;
      this.particleSystem.addExplosion(this.boss.x, this.boss.y, Colors.BOSS, 25);
      this.boss = null;
    }
  }

  updateMiniBoss() {
    if (!this.miniboss) return;

    const target = this.player;
    const dx = target.x - this.miniboss.x;
    const dy = target.y - this.miniboss.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      this.miniboss.x += (dx / dist) * this.miniboss.speed;
      this.miniboss.y += (dy / dist) * this.miniboss.speed;
    }

    this.miniboss.angle = Math.atan2(dy, dx);

    // Miniboss attack
    if (this.miniboss.attackCooldown <= 0 && dist < CONFIG.MINIBOSS_MELEE_RANGE) {
      if (!this.player.blocking) {
        this.player.hp -= this.miniboss.damage;
      } else {
        this.particleSystem.addExplosion(this.player.x, this.player.y, Colors.PRIMARY, 5);
      }
      this.miniboss.attackCooldown = 40;
      this.particleSystem.addExplosion(this.player.x, this.player.y, Colors.DANGER, 6);
    } else {
      this.miniboss.attackCooldown--;
    }

    // Check wall collisions
    for (let j = this.walls.length - 1; j >= 0; j--) {
      const wall = this.walls[j];
      const wallDist = Math.hypot(this.miniboss.x - wall.x, this.miniboss.y - wall.y);
      if (wallDist < 35) {
        wall.hp -= CONFIG.WALL_DAMAGE * 1.5;
        if (wall.hp <= 0) {
          this.walls.splice(j, 1);
          this.particleSystem.addExplosion(wall.x, wall.y, '#5d4037', 8);
        }
      }
    }

    if (this.miniboss.hp <= 0) {
      this.player.wood += CONFIG.MINIBOSS_KILL_REWARD;
      this.particleSystem.addExplosion(this.miniboss.x, this.miniboss.y, Colors.MINIBOSS, 20);
      this.miniboss = null;
    }
  }

  updatePowerUps() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      const dist = Math.hypot(this.player.x - powerup.x, this.player.y - powerup.y);
      
      if (dist < 30) {
        this.applyPowerUp(powerup);
        this.particleSystem.addExplosion(powerup.x, powerup.y, powerup.color, 12);
        this.powerups.splice(i, 1);
      }
    }
  }

  spawnPowerUp(x, y) {
    const types = [PowerUpType.HEALTH, PowerUpType.DAMAGE, PowerUpType.SPEED];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let color = Colors.POWERUP_HEALTH;
    if (type === PowerUpType.DAMAGE) color = Colors.POWERUP_DAMAGE;
    if (type === PowerUpType.SPEED) color = Colors.POWERUP_SPEED;
    
    this.powerups.push({
      x: x,
      y: y,
      type: type,
      color: color,
      lifetime: 300 // 5 seconds at 60fps
    });
  }

  applyPowerUp(powerup) {
    if (powerup.type === PowerUpType.HEALTH) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
    } else if (powerup.type === PowerUpType.DAMAGE) {
      this.player.damageMultiplier = Math.min(2.0, this.player.damageMultiplier + 0.3);
      setTimeout(() => {
        this.player.damageMultiplier = Math.max(1.0, this.player.damageMultiplier - 0.3);
      }, 10000); // 10 second boost
    } else if (powerup.type === PowerUpType.SPEED) {
      this.player.speed = Math.min(10, this.player.speed + 2);
      setTimeout(() => {
        this.player.speed = CONFIG.PLAYER_SPEED;
      }, 8000); // 8 second boost
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

      // Check miniboss collision
      if (this.miniboss && !hit) {
        const dist = Math.hypot(arrow.x - this.miniboss.x, arrow.y - this.miniboss.y);
        if (dist < 18) {
          this.miniboss.hp -= arrow.atk;
          this.particleSystem.addExplosion(arrow.x, arrow.y, Colors.ACCENT, 7);
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

  checkWaveComplete() {
    const isDaytime = this.time < CONFIG.NIGHT_START;
    
    if (isDaytime) {
      return true; // Wave not in progress
    }
    
    // During night, check if all enemies and bosses are defeated
    if (this.enemies.length === 0 && !this.boss && !this.miniboss) {
      return true;
    }
    
    return false;
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    this.updatePlayer(this.player);
    this.spawnEnemy();
    this.spawnMiniBoss();
    this.spawnBoss();
    this.updateEnemies();
    this.updateBoss();
    this.updateMiniBoss();
    this.updateArrows();
    this.updatePowerUps();
    this.particleSystem.update();

    // Update power-up lifetimes
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      this.powerups[i].lifetime--;
      if (this.powerups[i].lifetime <= 0) {
        this.powerups.splice(i, 1);
      }
    }

    this.time++;
    if (this.time >= CONFIG.DAY_LENGTH) {
      // Only advance wave if all enemies are defeated
      if (this.checkWaveComplete()) {
        this.time = 0;
        this.wave++;
      }
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
      '⚔️ Click to attack with current weapon.',
      '🔄 Press X to Switch Weapons.',
      '🛡️ Press C to Block (blocks damage).',
      '👹 Mini-Boss appears every 3 waves!',
      '👿 BOSS appears every 10 waves!'
    ];

    let y = SCREEN_HEIGHT / 2 + 80;
    for (const inst of instructions) {
      this.ctx.fillText(inst, 60, y);
      y += 28;
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
    this.ctx.fillText('NAH, I\'D WIN', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3);

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
    this.drawPowerUps();
    this.drawPlayer(this.player, Colors.PLAYER);

    // Draw particles
    this.particleSystem.draw(this.ctx);

    // Draw HUD
    this.drawHUD();
  }

  drawSword(x, y, angle, swing = 0) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    // Apply swing animation
    const swingRotation = (swing / 8) * (Math.PI / 4);
    this.ctx.rotate(swingRotation);

    // Blade (main part)
    this.ctx.fillStyle = Colors.SWORD_BLADE;
    this.ctx.fillRect(0, -3, 50, 6); // Long blade

    // Blade edge highlight
    this.ctx.fillStyle = Colors.SWORD_EDGE;
    this.ctx.fillRect(0, -2, 50, 2);

    // Crossguard
    this.ctx.fillStyle = Colors.SWORD_GUARD;
    this.ctx.fillRect(-12, -5, 24, 10);

    // Hilt/handle
    this.ctx.fillStyle = Colors.SWORD_HILT;
    this.ctx.fillRect(-4, -4, 8, 16); // Handle

    // Handle grip pattern
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(-3, 0 + i * 3);
      this.ctx.lineTo(3, 0 + i * 3);
      this.ctx.stroke();
    }

    // Pommel (end of handle)
    this.ctx.fillStyle = Colors.SWORD_GUARD;
    this.ctx.beginPath();
    this.ctx.arc(0, 12, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
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

    // Block indicator
    if (player.blocking) {
      this.ctx.strokeStyle = Colors.PRIMARY;
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(player.x - 20, player.y - 20, 40, 40);
    }

    // Weapon rendering
    if (player.weapon.type === WeaponType.BOW) {
      // Draw bow
      const bowLength = 20;
      this.ctx.strokeStyle = player.weapon.color;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(player.x, player.y);
      this.ctx.lineTo(player.x + Math.cos(player.angle) * bowLength, player.y + Math.sin(player.angle) * bowLength);
      this.ctx.stroke();
    } else if (player.weapon.type === WeaponType.SWORD) {
      // Draw detailed sword model
      this.drawSword(player.x, player.y, player.angle, player.swing);
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

      // Draw HP bar on wall
      this.ctx.fillStyle = '#e74c3c';
      const barWidth = 30;
      this.ctx.fillRect(wall.x - barWidth / 2, wall.y - wall.size / 2 - 8, barWidth * (wall.hp / wall.maxHp), 3);

      // Outline
      this.ctx.strokeStyle = '#8d6e63';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(wall.x - wall.size / 2, wall.y - wall.size / 2, wall.size, wall.size);
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

  drawMiniBoss() {
    if (!this.miniboss) return;

    this.ctx.fillStyle = Colors.MINIBOSS;
    this.ctx.fillRect(this.miniboss.x - this.miniboss.size / 2, this.miniboss.y - this.miniboss.size / 2, this.miniboss.size, this.miniboss.size);

    this.ctx.strokeStyle = Colors.WHITE;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.miniboss.x - this.miniboss.size / 2, this.miniboss.y - this.miniboss.size / 2, this.miniboss.size, this.miniboss.size);

    // MiniBoss HP bar
    this.ctx.fillStyle = Colors.MINIBOSS;
    const barWidth = 50;
    this.ctx.fillRect(this.miniboss.x - barWidth / 2, this.miniboss.y - this.miniboss.size / 2 - 10, barWidth * (this.miniboss.hp / this.miniboss.maxHp), 5);

    // Draw mini-boss label
    this.ctx.fillStyle = Colors.MINIBOSS;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Mini-Boss', this.miniboss.x, this.miniboss.y - this.miniboss.size / 2 - 20);
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

    // Draw boss label
    this.ctx.fillStyle = Colors.BOSS;
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOSS', this.boss.x, this.boss.y - this.boss.size / 2 - 20);

    // Draw detailed sword on boss
    if (this.boss.hasSword) {
      this.drawSword(this.boss.x, this.boss.y, this.boss.angle, 0);
    }
  }

  drawPowerUps() {
    for (const powerup of this.powerups) {
      this.ctx.fillStyle = powerup.color;
      this.ctx.beginPath();
      this.ctx.arc(powerup.x, powerup.y, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // Outline
      this.ctx.strokeStyle = Colors.WHITE;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(powerup.x, powerup.y, 8, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  drawHUD() {
    this.ctx.fillStyle = Colors.WHITE;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'left';

    this.ctx.fillText(`Wave: ${this.wave}`, 20, 30);
    this.ctx.fillText(`Wood: ${Math.floor(this.player.wood)}`, 20, 60);
    this.ctx.fillText(`HP: ${Math.floor(this.player.hp)}`, 20, 90);
    this.ctx.fillText(`Weapon: ${this.player.weapon.name} (Press X)`, 20, 120);

    // Damage multiplier indicator
    if (this.player.damageMultiplier > 1.0) {
      this.ctx.fillStyle = Colors.POWERUP_DAMAGE;
      this.ctx.fillText(`DMG Boost: ${this.player.damageMultiplier.toFixed(1)}x`, 20, 150);
    }

    // Block cooldown indicator
    if (this.player.blockCooldown > 0) {
      this.ctx.fillStyle = Colors.DANGER;
      this.ctx.fillText(`Block cooldown: ${Math.ceil(this.player.blockCooldown / 60)}s`, 20, 180);
    } else {
      this.ctx.fillStyle = Colors.PRIMARY;
      this.ctx.fillText('Block available (Press C)', 20, 180);
    }

    const isDaytime = this.time < CONFIG.NIGHT_START;
    this.ctx.fillStyle = isDaytime ? Colors.ACCENT : Colors.PRIMARY;
    this.ctx.textAlign = 'right';
    this.ctx.fillText(isDaytime ? '☀️ DAY' : '🌙 NIGHT', SCREEN_WIDTH - 20, 30);

    // Show wave completion status during night
    if (!isDaytime) {
      const enemyCount = this.enemies.length + (this.boss ? 1 : 0) + (this.miniboss ? 1 : 0);
      this.ctx.fillStyle = Colors.ACCENT;
      this.ctx.fillText(`Enemies: ${enemyCount}`, SCREEN_WIDTH - 20, 60);
    }
  }

  startGame() {
    this.state = GameState.PLAYING;
    this.time = 0;
    this.wave = 1;
    this.frameCount = 0;

    this.player.hp = CONFIG.INITIAL_HP;
    this.player.maxHp = CONFIG.INITIAL_HP;
    this.player.wood = CONFIG.INITIAL_WOOD;
    this.player.attackCooldown = 0;
    this.player.blocking = false;
    this.player.blockCooldown = 0;
    this.player.damageMultiplier = 1.0;

    this.trees = [];
    this.enemies = [];
    this.arrows = [];
    this.walls = [];
    this.boss = null;
    this.miniboss = null;
    this.powerups = [];
    this.waveComplete = false;

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
