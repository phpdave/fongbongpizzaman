// 1) Define your version somewhere near the top:
let version = "v1.2.0-ned-double-lasers-random-angles-better-laser";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartButton");

canvas.width = 800;
canvas.height = 600;

/* Letterbox resizing */
function resizeCanvas() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const targetAspect = 800 / 600; // 4:3
  const windowAspect = windowWidth / windowHeight;

  let finalWidth, finalHeight;
  if (windowAspect < targetAspect) {
    finalWidth = windowWidth;
    finalHeight = windowWidth / targetAspect;
  } else {
    finalHeight = windowHeight;
    finalWidth = windowHeight * targetAspect;
  }

  canvas.style.width = finalWidth + "px";
  canvas.style.height = finalHeight + "px";
  canvas.style.left = (windowWidth - finalWidth) / 2 + "px";
  canvas.style.top = (windowHeight - finalHeight) / 2 + "px";
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
resizeCanvas();

// BACKGROUND MUSIC
const backgroundMusic = new Audio(
  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bit%20Quest.mp3"
);
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// YUMMY SOUND (pizza)
const yummySound = new Audio("./yummy.mp3");
yummySound.volume = 1.0;

// WEIGHT SOUND
const weightSound = new Audio("./weightlifting.mp3");
weightSound.volume = 0.8;

// GAME OVER SOUND
const gameOverSound = new Audio("./game_over.mp3");
gameOverSound.volume = 1.0;

// NED SOUND
const nedSound = new Audio("./ned.mp3");
nedSound.volume = 1.0;

// Load background image
const backgroundImage = new Image();
backgroundImage.src = "./fong_bong_pizza_man.webp";
backgroundImage.onload = () => {
  console.log("Background image loaded successfully.");
};
backgroundImage.onerror = () => {
  console.error("Failed to load the background image.");
};

// Off-screen canvas for transparency
const tempCanvas = document.createElement("canvas");
const tempCtx = tempCanvas.getContext("2d");
tempCanvas.width = canvas.width;
tempCanvas.height = canvas.height;

// Load the player image
const playerImage = new Image();
playerImage.src = "./player.png";

// Player object
let player = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 150,
  width: 100,
  height: 150,
  speed: 30,
};

// Health logic
let health = 3;
const maxHealth = 3;

// Arrays and scoring
let pizzas = [];
let weights = [];
let neds = [];
let score = 0;
let gameOver = false;

// Load images
const pizzaImage = new Image();
pizzaImage.src =
  "https://134984376.cdn6.editmysite.com/uploads/1/3/4/9/134984376/s935319452332453897_p106_i1_w1080.png";

const weightImage = new Image();
weightImage.src = "./weightlifting.png";

const nedImage = new Image();
nedImage.src = "./evil_ned.webp";

/** 
 * GET EXISTING HIGH SCORE FROM LOCAL STORAGE 
 */
let highScore = parseInt(localStorage.getItem("pizzaGameHighScore")) || 0;
let highScoreInitials =
  localStorage.getItem("pizzaGameHighScoreInitials") || "";

/** Create a new pizza */
function createPizza() {
  const size = 40;
  pizzas.push({
    x: Math.random() * (canvas.width - size),
    y: 0,
    width: size,
    height: size,
    speed: 1.5 + Math.random(),
  });
}

/** Create a new weight item */
function createWeight() {
  const size = 40;
  weights.push({
    x: Math.random() * (canvas.width - size),
    y: 0,
    width: size,
    height: size,
    speed: 1.5 + Math.random(),
  });
}

/** Create a new Ned item */
function createNed() {
  const size = 50;
  neds.push({
    x: Math.random() * (canvas.width - size),
    y: 0,
    width: size,
    height: size,
    speed: 1 + Math.random(), // might fall a bit slower
  });
}

// ----------------------------------------------------
//   LASER LOGIC (Now 2 lasers at random angles)
// ----------------------------------------------------
let lasers = [];

/**
 * Create TWO lasers, each at a random angle going *upwards*.
 * We'll pick a random angle in degrees or radians, then convert to dx/dy.
 * This version uses a "beam" approach (long rectangle with rotation).
 */
function createDoubleLaser() {
  // We create 2 lasers at random angles
  for (let i = 0; i < 2; i++) {
    // angle range: -20 to -160 degrees (in radians) => or pick your own range
    // Negative means up-left or up-right. We'll do random in -20°..-160°, in radians.
    const angleDeg = Math.random() * 140 + 20; // from 20°..160°
    const angleRad = (angleDeg * Math.PI) / 180;
    const speed = 6; // how fast the beam moves

    // dx, dy from angle (assuming 0° is to the right, 90° up, we want up-left or up-right)
    // We'll interpret angle from the horizontal. So let's rotate so 90° is up.
    // Actually let's do an offset: 90° - angleDeg => that might be simpler
    const realAngle = (90 - angleDeg) * (Math.PI / 180);

    const dx = speed * Math.cos(realAngle);
    const dy = -speed * Math.sin(realAngle); // negative because we want up

    lasers.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2, // from player's center
      width: 3,     // narrower but we'll use length property
      length: 25,   // how long the beam is
      angle: realAngle,
      dx,
      dy,
    });
  }
}

/**
 * Move each laser, check collisions with pizzas only. 
 * The laser is a "beam" we'll draw as a rotated rectangle of length "length" and width "3".
 */
function updateLasers() {
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    // Move the starting reference (x, y)
    laser.x += laser.dx;
    laser.y += laser.dy;

    // If out of bounds, remove it
    if (
      laser.x < -50 ||
      laser.y < -50 ||
      laser.x > canvas.width + 50 ||
      laser.y > canvas.height + 50
    ) {
      lasers.splice(i, 1);
      i--;
      continue;
    }

    // Build a bounding box for collisions
    // The laser is a line-like rectangle. We'll approximate it with a bounding rectangle
    // from (x, y) to the far end. Because it's angled, we'll do a small bounding rect for collisions.
    let collisionHappened = false;
    // We'll sample a few points along the beam or just approximate. For simplicity, let's do one bounding rect
    // the "far" end of the beam:
    const endX = laser.x + Math.cos(laser.angle) * laser.length;
    const endY = laser.y - Math.sin(laser.angle) * laser.length; // minus sin because angle is reversed above

    // bounding box of the beam
    const minBeamX = Math.min(laser.x, endX);
    const maxBeamX = Math.max(laser.x, endX);
    const minBeamY = Math.min(laser.y, endY);
    const maxBeamY = Math.max(laser.y, endY);

    for (let j = 0; j < pizzas.length; j++) {
      const p = pizzas[j];
      // Check if bounding boxes overlap
      if (
        maxBeamX >= p.x &&
        minBeamX <= p.x + p.width &&
        maxBeamY >= p.y &&
        minBeamY <= p.y + p.height
      ) {
        // They overlap => remove the pizza
        score++;
        pizzas.splice(j, 1);
        // remove laser for single hit or keep going if you want multi?
        lasers.splice(i, 1);
        i--;
        collisionHappened = true;
        break;
      }
    }
    if (collisionHappened) break;
  }
}

/**
 * Draw each laser as a "long rectangle" rotated at "angle".
 * We'll temporarily rotate the canvas to draw it.
 */
function drawLasers() {
  ctx.save();
  ctx.fillStyle = "lime"; // bright green laser
  ctx.globalAlpha = 0.8;  // slight transparency for effect

  lasers.forEach((laser) => {
    ctx.save();
    // translate to the laser's "base" point
    ctx.translate(laser.x, laser.y);
    // rotate
    ctx.rotate(-laser.angle); 
    // draw a rectangle of size length x width
    // (0, 0) is the "start" of the beam
    ctx.fillRect(0, -laser.width / 2, laser.length, laser.width);
    ctx.restore();
  });

  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// Draw background
function drawBackground() {
  if (backgroundImage.complete) {
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.globalAlpha = 0.6;
    tempCtx.drawImage(
      backgroundImage,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );
    tempCtx.globalAlpha = 1;
    ctx.drawImage(tempCanvas, 0, 0);
  }
}

// Draw the player
function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

// Draw pizzas
function drawPizzas() {
  pizzas.forEach((pizza) => {
    ctx.drawImage(pizzaImage, pizza.x, pizza.y, pizza.width, pizza.height);
  });
}

// Draw weights
function drawWeights() {
  weights.forEach((weight) => {
    ctx.drawImage(weightImage, weight.x, weight.y, weight.width, weight.height);
  });
}

// Draw neds
function drawNeds() {
  neds.forEach((ned) => {
    ctx.drawImage(nedImage, ned.x, ned.y, ned.width, ned.height);

    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    let textWidth = ctx.measureText("Ned").width;
    let textX = ned.x + (ned.width - textWidth) / 2;
    let textY = ned.y - 5;
    ctx.fillText("Ned", textX, textY);
  });
}

/** Update game state */
function update() {
  if (gameOver) return;

  // Update pizzas
  pizzas.forEach((pizza, index) => {
    pizza.y += pizza.speed;
    const caught =
      pizza.y + pizza.height >= player.y &&
      pizza.x + pizza.width >= player.x &&
      pizza.x <= player.x + player.width;

    if (caught) {
      // +1 to score
      score++;
      pizzas.splice(index, 1);
      player.width += 5;
      if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
      }
      if (health < maxHealth) health++;

      // Yummy
      const newSound = yummySound.cloneNode(true);
      newSound.play().catch(console.warn);
    } else if (pizza.y > canvas.height) {
      // missed pizza
      pizzas.splice(index, 1);
      health--;
      if (health <= 0 && !gameOver) {
        gameOver = true;
        onGameOver();
      }
    }
  });

  // Update weights
  weights.forEach((weight, wIndex) => {
    weight.y += weight.speed;
    const caughtWeight =
      weight.y + weight.height >= player.y &&
      weight.x + weight.width >= player.x &&
      weight.x <= player.x + player.width;

    if (caughtWeight) {
      weights.splice(wIndex, 1);
      player.width = Math.ceil(player.width * (2 / 3));
      if (player.width < 10) player.width = 10;
      health--;
      if (health <= 0 && !gameOver) {
        gameOver = true;
        onGameOver();
      }
      const newWeightSound = weightSound.cloneNode(true);
      newWeightSound.play().catch(console.warn);
    } else if (weight.y > canvas.height) {
      weights.splice(wIndex, 1);
    }
  });

  // Update neds
  neds.forEach((ned, nIndex) => {
    ned.y += ned.speed;
    const caughtNed =
      ned.y + ned.height >= player.y &&
      ned.x + ned.width >= player.x &&
      ned.x <= player.x + player.width;

    if (caughtNed) {
      // +10 points if you catch Ned
      score += 10;

      health--;
      neds.splice(nIndex, 1);

      // Play Ned sound
      const newNedSound = nedSound.cloneNode(true);
      newNedSound.play().catch(console.warn);

      // Fire TWO lasers at random angles
      createDoubleLaser();

      if (health <= 0 && !gameOver) {
        gameOver = true;
        onGameOver();
      }
    } else if (ned.y > canvas.height) {
      neds.splice(nIndex, 1);
    }
  });

  // Update lasers
  updateLasers();
}

/** Called once if gameOver = true */
function onGameOver() {
  playGameOverSound();

  if (score > highScore) {
    let initials = prompt("New High Score! Enter your initials:");
    if (!initials) initials = "???";
    initials = initials.trim().toUpperCase();
    localStorage.setItem("pizzaGameHighScore", score.toString());
    localStorage.setItem("pizzaGameHighScoreInitials", initials);
    highScore = score;
    highScoreInitials = initials;
  }
}

/** Draw everything */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  // UI
  ctx.fillStyle = "#fff";
  ctx.font = "30px Arial";
  ctx.fillText("Fong Bong Pizza Man", canvas.width / 2 - 150, 40);

  // Score
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
  const highScoreDisplay = `High Score: ${highScore} (${highScoreInitials})`;
  ctx.fillText(highScoreDisplay, canvas.width - 250, 30);

  // Draw game elements
  drawPlayer();
  drawPizzas();
  drawWeights();
  drawNeds();
  drawLasers(); // lasers on top

  drawHealthOrb();

  if (gameOver) {
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);
    restartBtn.style.display = "block";
  }

  // version
  ctx.font = "14px Arial";
  ctx.fillText(`Version: ${version}`, 10, canvas.height - 10);
}

function drawHealthOrb() {
  const orbX = 70;
  const orbY = canvas.height - 70;
  const radius = 40;

  ctx.beginPath();
  ctx.arc(orbX, orbY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#333";
  ctx.fill();

  const fillPercent = health / maxHealth;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + fillPercent * 2 * Math.PI;
  ctx.beginPath();
  ctx.moveTo(orbX, orbY);
  ctx.arc(orbX, orbY, radius, startAngle, endAngle, false);
  ctx.closePath();
  ctx.fillStyle = "red";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(orbX, orbY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Play the game over sound once */
function playGameOverSound() {
  const newGameOverSound = gameOverSound.cloneNode(true);
  newGameOverSound.play().catch((err) => {
    console.warn("Could not play game_over sound:", err);
  });
}

// Keyboard movement (arrows)
document.addEventListener("keydown", (e) => {
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(console.warn);
  }
  if (e.key === "ArrowLeft") movePlayer("left");
  else if (e.key === "ArrowRight") movePlayer("right");
});

function movePlayer(direction) {
  if (gameOver) return;
  if (direction === "left" && player.x > 0) {
    player.x -= player.speed;
  } else if (direction === "right" && player.x + player.width < canvas.width) {
    player.x += player.speed;
  }
}

// -------------------------------------------------
// DRAG / TOUCH + MOUSE LOGIC (MOVE & JUMP)
// -------------------------------------------------
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;
let jumpUsed = false;
let mouseDown = false;

// Helper: keep player.x in range
function clampPlayerX() {
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }
}

// Quick jump function (move up 50px, then back down)
function doJump() {
  if (player.y >= canvas.height - 150) {
    player.y -= 50;
    setTimeout(() => {
      player.y += 50;
    }, 200);
  }
}

// ------------------- TOUCH EVENTS -------------------
canvas.addEventListener(
  "touchstart",
  function (e) {
    if (backgroundMusic.paused) {
      backgroundMusic.play().catch(console.warn);
    }
    e.preventDefault();
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    dragStartX = (touch.clientX - rect.left) * scaleX;
    dragStartY = (touch.clientY - rect.top) * scaleY;
    isDragging = true;
    jumpUsed = false;
  },
  { passive: false }
);

canvas.addEventListener(
  "touchmove",
  function (e) {
    e.preventDefault();
    if (!isDragging || gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const currentX = (touch.clientX - rect.left) * scaleX;
    const currentY = (touch.clientY - rect.top) * scaleY;

    // DRAG UP DETECTION
    const deltaY = dragStartY - currentY;
    if (deltaY > 40 && !jumpUsed) {
      doJump();
      jumpUsed = true;
    } else {
      // Move horizontally, center player on finger
      player.x = currentX - player.width / 2;
      clampPlayerX();
    }
  },
  { passive: false }
);

canvas.addEventListener("touchend", function (e) {
  isDragging = false;
});

// ------------------- MOUSE EVENTS -------------------
canvas.addEventListener("mousedown", function (e) {
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(console.warn);
  }
  if (gameOver) return;

  mouseDown = true;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  dragStartX = (e.clientX - rect.left) * scaleX;
  dragStartY = (e.clientY - rect.top) * scaleY;
  isDragging = true;
  jumpUsed = false;
});

canvas.addEventListener("mousemove", function (e) {
  if (!mouseDown || !isDragging || gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const currentX = (e.clientX - rect.left) * scaleX;
  const currentY = (e.clientY - rect.top) * scaleY;

  const deltaY = dragStartY - currentY;
  if (deltaY > 40 && !jumpUsed) {
    doJump();
    jumpUsed = true;
  } else {
    player.x = currentX - player.width / 2;
    clampPlayerX();
  }
});

canvas.addEventListener("mouseup", function () {
  mouseDown = false;
  isDragging = false;
});

canvas.addEventListener("mouseleave", function () {
  mouseDown = false;
  isDragging = false;
});

// -------------------------------------------------

// RESTART
restartBtn.addEventListener("click", () => {
  location.reload();
});

// Main loop
function gameLoop() {
  update();
  draw();
  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

// Spawning intervals
setInterval(createPizza, 1000);
setInterval(createWeight, 3000);
setInterval(createNed, 5000);

// Start
gameLoop();
