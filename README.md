# 🎮 Survive Bros - Web Edition

A thrilling survival game where you defend against waves of enemies, harvest resources, and battle bosses. Built with vanilla JavaScript and HTML5 Canvas.

## 🎯 Features

- **Day/Night Cycle**: Peaceful days for resource gathering, intense nights with enemy waves
- **Wave-Based Progression**: Difficulty increases with each wave
- **Boss Battles**: Every 3 waves, a powerful boss appears
- **Resource Management**: Collect wood to build defensive walls
- **Particle Effects**: Explosions, fire effects, and visual feedback
- **Responsive Canvas**: Runs smoothly on any modern browser

## 🕹️ How to Play

### Controls
- **WASD** or **Arrow Keys**: Move around
- **Mouse Movement**: Aim your weapon
- **Click**: Shoot arrows at enemies
- **Z**: Build walls (costs 10 wood)
- **B**: Pause game
- **M**: Toggle multiplayer mode
- **SPACE**: Start game / Retry after death

### Gameplay
1. **Day Phase** (☀️): Harvest trees to collect wood
2. **Night Phase** (🌙): Enemies spawn and attack - defend yourself!
3. **Waves**: Complete a day/night cycle to advance to the next wave
4. **Bosses**: Every 3 waves, defeat increasingly powerful bosses
5. **Survival**: Last as long as possible and reach higher waves

## 🚀 Deployment on Render

### Prerequisites
- A Render account (free at https://render.com)
- Git and GitHub (optional, for easier deployment)

### Quick Start

1. **Option A: Deploy from GitHub (Recommended)**
   - Push this repository to GitHub
   - Go to https://render.com and sign in
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `survive-bros`
     - **Environment**: `Static Site`
     - **Build Command**: (leave empty)
     - **Publish Directory**: `.` (root directory)
   - Click "Create Web Service"
   - Your game will be live in ~2 minutes at `https://survive-bros-xxxx.onrender.com`

2. **Option B: Deploy via Git Push**
   ```bash
   # Clone this repo or create a new one
   git clone https://github.com/YOUR_USERNAME/Survive-Bros.git
   cd Survive-Bros
   
   # Add Render remote
   git remote add render https://git.render.com/YOUR_REPO.git
   
   # Push to Render
   git push render main
   ```

3. **Option C: Manual Upload**
   - Download all files from this repository
   - Go to Render Dashboard
   - Create a new "Static Site"
   - Upload the files through Render's web interface

### Files Needed
- `index.html` - Main HTML page
- `game.js` - Game engine (JavaScript)
- `pyproject.toml` - Project metadata (optional for web)

### After Deployment

Your game will be accessible at:
```
https://your-render-app-name.onrender.com
```

**Share the link** with friends! The game runs entirely in the browser with no backend needed.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Page shows "Loading..." | Wait 30 seconds, refresh browser |
| Game doesn't load | Check browser console (F12) for errors |
| Canvas is blank | Ensure all files are deployed correctly |
| Game is slow | Try a different browser or lower graphics settings |

## 🛠️ Development

### Local Testing
1. Open `index.html` directly in your browser, or
2. Run a local server:
   ```bash
   python -m http.server 8000
   # Visit http://localhost:8000
   ```

### File Structure
```
Survive-Bros/
├── index.html          # Game page
├── game.js             # Game logic (1000+ lines)
├── pyproject.toml      # Project config
├── code                # Original Python version (Pygame)
└── README.md          # This file
```

## 📊 Game Balance

### Weapons
- **Iron Sword**: 25 ATK, close range, fast
- **Wood Bow**: 20 ATK, long range, arrows

### Enemies
- **Base HP**: 40 + (wave × 10)
- **Speed**: 2.2 units/frame
- **Damage**: 0.5 per contact

### Bosses
- **Appear**: Every 3 waves
- **HP Scale**: 500 × level × 1.5
- **Damage Scale**: 1.2 + (level × 0.3)
- **Reward**: 150 wood per defeat

### Resources
- **Starting Wood**: 20
- **Wall Cost**: 10 wood
- **Enemy Kill Reward**: 5 wood
- **Tree Harvest**: 10 wood

## 🎨 Visual Design

- **Color Scheme**: Dark cyberpunk theme with neon accents
- **Animations**: Particle systems for explosions and effects
- **Resolution**: 1280×720 (locked aspect ratio)
- **Performance**: 60 FPS target with requestAnimationFrame

## 📝 Original Version

The original Python/Pygame version is in the `code` file. This web version is a complete JavaScript rewrite for browser compatibility.

## 🤝 Contributing

Found a bug? Have an idea? 
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📜 License

This project is open source and available under the MIT License.

## 🎮 Have Fun!

Survive the waves, defeat the bosses, and reach the highest wave possible!

---

**Play Now**: [Survive Bros on Render](https://github.com/0402hunter-dev/Survive-Bros)

*Built with ❤️ using vanilla JavaScript and HTML5 Canvas*
