const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartButton");

/* 1) Internal (logical) resolution remains 800x600 for your game logic.
      We'll letterbox it on any screen size below. */
canvas.width = 800;
canvas.height = 600;

/* 2) Letterbox resizing: keep 4:3 aspect ratio so no sides get cut off. */
function resizeCanvas() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const targetAspect = 800 / 600; // 4:3
  const windowAspect = windowWidth / windowHeight;

  let finalWidth, finalHeight;
  if (windowAspect < targetAspect) {
    // Window is relatively tall/narrow -> match full width, reduce height
    finalWidth = windowWidth;
    finalHeight = windowWidth / targetAspect;
  } else {
    // Window is relatively wide -> match full height, reduce width
    finalHeight = windowHeight;
    finalWidth = windowHeight * targetAspect;
  }

  // Center the canvas in the window
  canvas.style.width = finalWidth + "px";
  canvas.style.height = finalHeight + "px";
  canvas.style.left = (windowWidth - finalWidth) / 2 + "px";
  canvas.style.top = (windowHeight - finalHeight) / 2 + "px";
}

// Listen to browser resizing/orientation changes
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
// Call once at start
resizeCanvas();

// BACKGROUND MUSIC
const backgroundMusic = new Audio(
  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bit%20Quest.mp3"
);
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// YUMMY SOUND
const yummySound = new Audio("./yummy.mp3");
yummySound.volume = 1.0;

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

// Load player image
const playerImage = new Image();
playerImage.src = "https://banner2.cleanpng.com/20180217/zjw/av14rma49.webp";

// Player object
let player = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 150,
  width: 100,
  height: 150,
  speed: 30,
};

let pizzas = [];
let score = 0;
let gameOver = false;

// Load pizza image
const pizzaImage = new Image();
pizzaImage.src =
  "https://134984376.cdn6.editmysite.com/uploads/1/3/4/9/134984376/s935319452332453897_p106_i1_w1080.png";

// Create a new pizza
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

// Draw the background with transparency
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

// Update game state
function update() {
  if (gameOver) return;

  pizzas.forEach((pizza, index) => {
    pizza.y += pizza.speed;

    // Check if pizza is caught
    if (
      pizza.y + pizza.height >= player.y &&
      pizza.x + pizza.width >= player.x &&
      pizza.x <= player.x + player.width
    ) {
      score++;
      pizzas.splice(index, 1);

      // Make player 5 pixels wider
      player.width += 5;
      if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
      }

      // "Yummy!" sound (cloned so multiple catches overlap)
      const newSound = yummySound.cloneNode(true);
      newSound.volume = yummySound.volume;
      newSound.play().catch((err) => {
        console.warn("Could not play yummy sound:", err);
      });
    }

    // End game if pizza hits the ground
    if (pizza.y > canvas.height) {
      gameOver = true;
    }
  });
}

// Draw game elements
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

  drawPlayer();
  drawPizzas();

  // Game Over
  if (gameOver) {
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);

    // Show restart button
    restartBtn.style.display = "block";
  }
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
  // If music is paused, try playing it.
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

    // Prevent default so iOS Safari doesn’t treat it as scroll
    e.preventDefault();

    // If game is over, taps won't do anything
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    // Because the canvas is letterboxed, we map the touch coordinate
    // to the 800x600 space
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

// RESTART BUTTON LOGIC
restartBtn.addEventListener("click", () => {
  location.reload(); // simple page reload
});

// Main game loop
function gameLoop() {
  update();
  draw();
  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

// Spawn pizzas at intervals
setInterval(createPizza, 1000);

// Start the game loop now; music & movement start on user interaction
gameLoop();
