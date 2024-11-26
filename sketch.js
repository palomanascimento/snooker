let balls = [];
let pockets = [];
let tableWidth = 800;
let tableHeight = 400;
let ballRadius = 15;
let friction = 0.98;

let cueBall;
let isAiming = false;
let aimStart = null;
let aimEnd = null;

let ballImages = [];
let tacoImage; // Imagem personalizada do taco
let players = [{ score: 0 }, { score: 0 }];
let currentPlayer = 0; // Jogador atual (0 ou 1)
let turnOver = false; // Controle de mudança de turno

function preload() {
  // Carregar imagens locais para as bolas (15 bolas diferentes)
  for (let i = 1; i <= 15; i++) {
    ballImages.push(loadImage(`assets/bola${i}.png`));
  }

  // Carregar imagem do taco
  tacoImage = loadImage(`assets/taco.png`);
}

function setup() {
  createCanvas(tableWidth, tableHeight);
  setupPockets();
  setupTable();
}

function draw() {
  background(0, 150, 0);
  drawTableEdges();

  // Desenhar caçapas
  for (let pocket of pockets) {
    pocket.draw();
  }

  // Atualizar e desenhar bolas
  for (let ball of balls) {
    ball.update();
    ball.draw();
  }

  // Detectar e resolver colisões
  resolveCollisions();

  // Verificar bolas nas caçapas
  checkPockets();

  // Desenhar o taco
  if (!cueBall.moving() && isAiming) {
    drawTaco();
  }

  // Trocar turno se necessário
  if (!cueBall.moving() && turnOver) {
    changeTurn();
  }

  // Exibir pontuação
  displayScores();
}

function mousePressed() {
  if (!cueBall.moving()) {
    isAiming = true;
    aimStart = createVector(mouseX, mouseY);
  }
}

function mouseReleased() {
  if (isAiming) {
    aimEnd = createVector(mouseX, mouseY);
    let force = p5.Vector.sub(aimStart, aimEnd);
    cueBall.applyForce(force.mult(0.2));
    isAiming = false;
    turnOver = true;
  }
}

function drawTableEdges() {
  noFill();
  stroke(255, 255, 0);
  strokeWeight(8);
  rect(0, 0, tableWidth, tableHeight);
}

function drawTaco() {
  let tacoDir = p5.Vector.sub(cueBall.pos, createVector(mouseX, mouseY)).normalize();
  let angle = atan2(tacoDir.y, tacoDir.x);

  push();
  translate(cueBall.pos.x, cueBall.pos.y);
  rotate(angle);
  imageMode(CENTER);
  image(tacoImage, -150, 0, 300, 30); // Ajuste o tamanho e posição do taco
  pop();
}

function setupPockets() {
  pockets.push(new Pocket(0, 0));
  pockets.push(new Pocket(width / 2, 0));
  pockets.push(new Pocket(width, 0));
  pockets.push(new Pocket(0, height));
  pockets.push(new Pocket(width / 2, height));
  pockets.push(new Pocket(width, height));
}

function setupTable() {
  balls = [];

  // Bola branca
  cueBall = new Ball(width / 4, height / 2, null);
  balls.push(cueBall);

  // Bolas coloridas (15 bolas)
  let rows = 5;
  let startX = width * 0.6;
  let startY = height / 2 - (rows * ballRadius);
  let imageIndex = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
      let x = startX + row * ballRadius * 2;
      let y = startY + col * ballRadius * 2;
      if (imageIndex < 15) {
        let img = ballImages[imageIndex]; // Imagem específica para cada bola
        balls.push(new Ball(x, y, img));
        imageIndex++;
      }
    }
  }
}

class Ball {
  constructor(x, y, img) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.img = img;
    this.isInPocket = false;
  }

  update() {
    if (this.isInPocket) return;

    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.vel.mult(friction);
    this.acc.set(0, 0);

    if (this.pos.x - ballRadius < 0 || this.pos.x + ballRadius > width) {
      this.vel.x *= -1;
      this.pos.x = constrain(this.pos.x, ballRadius, width - ballRadius);
    }
    if (this.pos.y - ballRadius < 0 || this.pos.y + ballRadius > height) {
      this.vel.y *= -1;
      this.pos.y = constrain(this.pos.y, ballRadius, height - ballRadius);
    }
  }

  draw() {
    if (this.isInPocket) return;

    if (this.img) {
      image(this.img, this.pos.x - ballRadius, this.pos.y - ballRadius, ballRadius * 2, ballRadius * 2);
    } else {
      fill(255);
      noStroke();
      ellipse(this.pos.x, this.pos.y, ballRadius * 2);
    }
  }

  applyForce(force) {
    this.acc.add(force);
  }

  moving() {
    return this.vel.mag() > 0.1;
  }
}

class Pocket {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.radius = ballRadius * 1.5;
  }

  draw() {
    fill(0);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }

  contains(ball) {
    return p5.Vector.dist(this.pos, ball.pos) < this.radius;
  }
}

function resolveCollisions() {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      let b1 = balls[i];
      let b2 = balls[j];

      if (b1.isInPocket || b2.isInPocket) continue;

      let distVec = p5.Vector.sub(b1.pos, b2.pos);
      let distance = distVec.mag();
      let overlap = ballRadius * 2 - distance;

      if (distance < ballRadius * 2) {
        let correction = distVec.copy().setMag(overlap / 2);
        b1.pos.add(correction);
        b2.pos.sub(correction);

        let collisionNormal = distVec.copy().normalize();
        let relativeVelocity = p5.Vector.sub(b1.vel, b2.vel);
        let speed = relativeVelocity.dot(collisionNormal);

        if (speed > 0) continue;

        let impulse = collisionNormal.mult(-speed);
        b1.vel.add(impulse);
        b2.vel.sub(impulse);
      }
    }
  }
}

function checkPockets() {
  let ballEncaçapada = false;

  for (let ball of balls) {
    if (ball === cueBall || ball.isInPocket) continue;

    for (let pocket of pockets) {
      if (pocket.contains(ball)) {
        ball.isInPocket = true;
        players[currentPlayer].score += 1; // Adiciona ponto para o jogador atual
        ballEncaçapada = true;
      }
    }
  }

  if (!ballEncaçapada && !cueBall.moving()) {
    turnOver = true; // Trocar turno se nenhuma bola for encaçapada
  }
}

function changeTurn() {
  currentPlayer = (currentPlayer + 1) % 2; // Alterna entre 0 e 1
  turnOver = false;
}

function displayScores() {
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text(`Jogador 1: ${players[0].score} pontos`, 10, 20);
  text(`Jogador 2: ${players[1].score} pontos`, 10, 40);
  textAlign(CENTER);
  textSize(20);
  text(`Turno do Jogador ${currentPlayer + 1}`, width / 2, 30);
}
