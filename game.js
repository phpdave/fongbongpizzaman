// 1) Define your version somewhere near the top:
let version = "v1.0.7-harder-change weight";

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

// Pizzas array
let pizzas = [];
let score = 0;
let gameOver = false;

// Load pizza image
const pizzaImage = new Image();
pizzaImage.src =
  "https://134984376.cdn6.editmysite.com/uploads/1/3/4/9/134984376/s935319452332453897_p106_i1_w1080.png";

// Load weight image
const weightImage = new Image();
weightImage.src = "./weightlifting.png";

// Array to store weights
let weights = [];

/** 
 * 2) GET EXISTING HIGH SCORE FROM LOCAL STORAGE 
 *    If none found, default to 0 & empty initials
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

/** Update game state */
function update() {
  if (gameOver) return;

  // Update pizzas
  pizzas.forEach((pizza, index) => {
    pizza.y += pizza.speed;

    // Check if pizza is caught
    const caught =
      pizza.y + pizza.height >= player.y &&
      pizza.x + pizza.width >= player.x &&
      pizza.x <= player.x + player.width;

    if (caught) {
      score++;
      pizzas.splice(index, 1);

      // Make the player 5px wider
      player.width += 5;
      if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
      }

      // Increase health by 1 (max = maxHealth)
      if (health < maxHealth) {
        health++;
      }

      // "Yummy!" sound
      const newSound = yummySound.cloneNode(true);
      newSound.play().catch((err) => {
        console.warn("Could not play yummy sound:", err);
      });
    } else if (pizza.y > canvas.height) {
      // Missed pizza => lose 1 health
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

    // Check collision with player
    const caughtWeight =
      weight.y + weight.height >= player.y &&
      weight.x + weight.width >= player.x &&
      weight.x <= player.x + player.width;

    if (caughtWeight) {
      // Remove weight from array
      weights.splice(wIndex, 1);

      // *** CHANGED: Instead of -10px, shrink player by 33% (round up)
      player.width = Math.ceil(player.width * (2 / 3));
      if (player.width < 10) {
        player.width = 10;
      }

      // health goes down by 1
      health--;
      if (health <= 0 && !gameOver) {
        gameOver = true;
        onGameOver();
      }

      // Weight sound
      const newWeightSound = weightSound.cloneNode(true);
      newWeightSound.play().catch((err) => {
        console.warn("Could not play weight sound:", err);
      });
    } else if (weight.y > canvas.height) {
      // Weight hits ground => remove it
      weights.splice(wIndex, 1);
    }
  });
}

/** Called exactly once when gameOver becomes true */
function onGameOver() {
  playGameOverSound();

  // 3) Check if score is a new high score
  if (score > highScore) {
    // Prompt for initials
    let initials = prompt("New High Score! Enter your initials:");

    // If user canceled or empty, just store "???"
    if (!initials) initials = "???";
    initials = initials.trim().toUpperCase();

    // Update localStorage
    localStorage.setItem("pizzaGameHighScore", score.toString());
    localStorage.setItem("pizzaGameHighScoreInitials", initials);

    // Update our in-memory variables
    highScore = score;
    highScoreInitials = initials;
  }
}

/** Draw everything */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  // Title
  ctx.fillStyle = "#fff";
  ctx.font = "30px Arial";
  ctx.fillText("Fong Bong Pizza Man", canvas.width / 2 - 150, 40);

  // Score
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);

  // 4) Display High Score in top-right corner
  const highScoreDisplay = `High Score: ${highScore} (${highScoreInitials})`;
  ctx.fillText(highScoreDisplay, canvas.width - 250, 30);

  // Draw player & items
  drawPlayer();
  drawPizzas();
  drawWeights();

  // Draw health orb
  drawHealthOrb();

  // Game Over?
  if (gameOver) {
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);
    restartBtn.style.display = "block";
  }

  // Version in bottom-left
  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.fillText(`Version: ${version}`, 10, canvas.height - 10);
}

// Helper for drawing the health orb
function drawHealthOrb() {
  const orbX = 70;
  const orbY = canvas.height - 70;
  const radius = 40;

  // background circle
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

  // border
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

// Move player
function movePlayer(direction) {
  if (!gameOver) {
    if (direction === "left" && player.x > 0) {
      player.x -= player.speed;
    } else if (direction === "right" && player.x + player.width < canvas.width) {
      player.x += player.speed;
    }
  }
}

// START BACKGROUND MUSIC ON FIRST KEY PRESS
document.addEventListener("keydown", (e) => {
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch((err) => {
      console.warn("Audio play was prevented:", err);
    });
  }

  if (e.key === "ArrowLeft") {
    movePlayer("left");
  } else if (e.key === "ArrowRight") {
    movePlayer("right");
  }
});

// MOBILE TOUCH INPUT
canvas.addEventListener(
  "touchstart",
  function (e) {
    if (backgroundMusic.paused) {
      backgroundMusic.play().catch((err) => {
        console.warn("Audio play was prevented:", err);
      });
    }

    e.preventDefault();

    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    // Convert to internal coords
    const scaleX = canvas.width / rect.width;
    const touchX = (touch.clientX - rect.left) * scaleX;

    // Left half => left, right half => right
    if (touchX < canvas.width / 2) {
      movePlayer("left");
    } else {
      movePlayer("right");
    }
  },
  { passive: false }
);

// RESTART BUTTON
restartBtn.addEventListener("click", () => {
  location.reload();
});

// Main game loop
function gameLoop() {
  update();
  draw();
  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

// Spawn pizzas every second
setInterval(createPizza, 1000);

// Spawn weights every 3 seconds
setInterval(createWeight, 3000);

// Start the game
gameLoop();
