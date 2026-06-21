const canvas = document.querySelector("#badge");
const ctx = canvas.getContext("2d");
const form = document.querySelector("#employee-form");
const nameInput = document.querySelector("#name");
const positionInput = document.querySelector("#position");
const branchInput = document.querySelector("#branch");
const photoInput = document.querySelector("#photo");
const statusEl = document.querySelector("#status");
const downloadButton = document.querySelector("#download");
const shareStoryButton = document.querySelector("#share-story");
const successModal = document.querySelector("#success-modal");
const closeSuccessButton = document.querySelector("#close-success");
const confettiStage = document.querySelector(".confetti-stage");
const successOpenLink = document.querySelector("#success-open");
const instagramUrl = "https://instagram.com/partyvorous";

let employeePhoto = null;

function fitText(text, maxWidth, startingSize, weight = "700") {
  let size = startingSize;
  do {
    ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  } while (size > 20);
  return size;
}

function drawRoundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawLogo(x, y, width) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 72px Arial Black, Impact, Arial, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("DUNDER", x, y);
  ctx.fillText("MIFFLIN", x, y + 70);

  ctx.save();
  ctx.translate(x + width - 54, y + 75);
  ctx.rotate(-Math.PI / 2);
  ctx.font = "900 35px Arial Black, Impact, Arial, sans-serif";
  ctx.fillText("INC.", 0, 0);
  ctx.restore();

  ctx.font = "700 18px Arial, Helvetica, sans-serif";
  ctx.letterSpacing = "0px";
  ctx.fillText("P A P E R   C O M P A N Y", x + 3, y + 154);
  ctx.restore();
}

function drawPlaceholder(x, y, width, height) {
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#78909c";
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 92, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + 222, 93, 76, 0, Math.PI, Math.PI * 2, true);
  ctx.fill();
}

function drawImageCover(image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function employeeNumber(name) {
  let total = 10485931;
  for (const character of name) {
    total = (total + character.charCodeAt(0) * 97) % 90000000;
  }
  return String(total + 10000000).slice(0, 8);
}

function drawBarcode(x, y, width, height, value) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#111111";

  let cursor = x + 4;
  for (let i = 0; i < 80 && cursor < x + width - 4; i += 1) {
    const digit = Number(value[i % value.length]);
    const barWidth = 1 + ((digit + i) % 4);
    if ((digit + i) % 2 === 0) {
      ctx.fillRect(cursor, y, barWidth, height - 20);
    }
    cursor += barWidth + 2;
  }

  ctx.font = "500 16px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(value, x + width / 2, y + height - 3);
}

function drawBadge() {
  const name = nameInput.value.trim() || "Employee Name";
  const position = positionInput.value;
  const branch = branchInput.value.toUpperCase();
  const number = employeeNumber(name);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  drawRoundRect(25, 20, 625, 1010, 34);
  ctx.clip();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#082f49";
  ctx.fillRect(25, 20, 625, 250);
  drawLogo(88, 62, 500);

  ctx.fillStyle = "#f4f8fb";
  ctx.fillRect(25, 270, 625, 760);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(175, 330, 325, 325);
  ctx.strokeStyle = "#b8c0ca";
  ctx.lineWidth = 8;
  ctx.strokeRect(175, 330, 325, 325);

  if (employeePhoto) {
    drawImageCover(employeePhoto, 179, 334, 317, 317);
  } else {
    drawPlaceholder(179, 334, 317, 317);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#082f49";
  const nameSize = fitText(name, 520, 54, "900");
  ctx.font = `900 ${nameSize}px Arial, Helvetica, sans-serif`;
  ctx.fillText(name, 337, 735);

  ctx.fillStyle = "#1f2937";
  const titleSize = fitText(position, 500, 34, "500");
  ctx.font = `italic ${titleSize}px Arial, Helvetica, sans-serif`;
  ctx.fillText(position, 337, 790);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(220, 815, 235, 38);
  ctx.fillStyle = "#082f49";
  ctx.font = "800 22px Arial, Helvetica, sans-serif";
  ctx.fillText(branch, 337, 842);

  drawBarcode(168, 890, 340, 92, number);

  ctx.fillStyle = "#082f49";
  drawRoundRect(105, 987, 465, 34, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 21px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PARTYVOROUS  |  @partyvorous", 337, 1012);
  ctx.restore();

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 4;
  drawRoundRect(25, 20, 625, 1010, 34);
  ctx.stroke();

  ctx.fillStyle = "#f7f8fa";
  drawRoundRect(277, 34, 120, 32, 15);
  ctx.fill();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function downloadCurrentBadge() {
  const link = document.createElement("a");
  const fileName = `${(nameInput.value.trim() || "employee").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-dunder-mifflin-id.png`;
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function canvasToBlob() {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

function launchConfetti() {
  const colors = ["#082f49", "#0e6c9f", "#1f7a4d", "#f4b942", "#ffffff", "#d92d20"];
  confettiStage.innerHTML = "";

  for (let index = 0; index < 90; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--x", `${Math.random() * 100}%`);
    piece.style.setProperty("--w", `${6 + Math.random() * 8}px`);
    piece.style.setProperty("--h", `${10 + Math.random() * 16}px`);
    piece.style.setProperty("--c", colors[index % colors.length]);
    piece.style.setProperty("--r", `${Math.random() * 360}deg`);
    piece.style.setProperty("--d", `${2.2 + Math.random() * 1.8}s`);
    piece.style.setProperty("--delay", `${Math.random() * 0.25}s`);
    piece.style.setProperty("--drift", `${-120 + Math.random() * 240}px`);
    confettiStage.appendChild(piece);
  }
}

function showSuccessModal(savedHref) {
  successOpenLink.href = savedHref;
  successModal.classList.add("is-open");
  successModal.setAttribute("aria-hidden", "false");
  launchConfetti();
}

function closeSuccessModal() {
  successModal.classList.remove("is-open");
  successModal.setAttribute("aria-hidden", "true");
}

async function shareToStory() {
  statusEl.textContent = "Preparing your badge for Instagram...";

  const fileName = `${(nameInput.value.trim() || "employee").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-dunder-mifflin-id.png`;
  const blob = await canvasToBlob();

  if (!blob) {
    statusEl.textContent = "Could not prepare the badge image. Please try downloading it instead.";
    return;
  }

  const file = new File([blob], fileName, { type: "image/png" });
  const shareData = {
    title: "My Dunder Mifflin Employee ID",
    text: "Made with Partyvorous. Follow @partyvorous for more cool stuff.",
    files: [file]
  };

  if (navigator.canShare && navigator.canShare(shareData) && navigator.share) {
    try {
      await navigator.share(shareData);
      statusEl.innerHTML = `Badge ready for your story. Tag <a href="${instagramUrl}" target="_blank" rel="noreferrer">@partyvorous</a> so we can see it.`;
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        statusEl.textContent = "Story share cancelled.";
        return;
      }
    }
  }

  downloadCurrentBadge();
  window.open(instagramUrl, "_blank", "noopener,noreferrer");
  statusEl.innerHTML = `Your badge was downloaded. Upload it to your Instagram Story and tag <a href="${instagramUrl}" target="_blank" rel="noreferrer">@partyvorous</a>.`;
}

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) {
    employeePhoto = null;
    drawBadge();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      employeePhoto = image;
      drawBadge();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

form.addEventListener("input", drawBadge);
downloadButton.addEventListener("click", downloadCurrentBadge);
shareStoryButton.addEventListener("click", shareToStory);
closeSuccessButton.addEventListener("click", closeSuccessModal);
successModal.addEventListener("click", (event) => {
  if (event.target === successModal) closeSuccessModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && successModal.classList.contains("is-open")) {
    closeSuccessModal();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "Sending employee ID...";

  try {
    const response = await fetch("/api/ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        position: positionInput.value,
        branch: branchInput.value,
        image: canvas.toDataURL("image/png")
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save employee ID.");
    statusEl.innerHTML = `Saved. Follow <a href="${instagramUrl}" target="_blank" rel="noreferrer">Partyvorous on Instagram</a> for more cool stuff.`;
    showSuccessModal(data.href);
  } catch (error) {
    statusEl.textContent = error.message;
  }
});

drawBadge();
