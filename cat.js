"use strict";

(() => {
  // The desk atlas uses 240 × 128 frames. Only this patch of the cat moves independently.
  const face = {x: 160, width: 52, height: 55};
  const sky = 28;
  const scenes = [...document.querySelectorAll(".cat-hit")].map(button => {
    const desk = button.closest(".pixel-writer");
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 128 + sky;
    canvas.className = "cat-scene";
    canvas.hidden = true;
    canvas.setAttribute("aria-hidden", "true");
    desk.insertBefore(canvas, button);
    return {desk, canvas, context: canvas.getContext("2d"), button};
  });

  const atlas = new Image();
  let openEyes, closedEyes;
  atlas.addEventListener("load", () => {
    openEyes = document.createElement("canvas");
    openEyes.width = face.width;
    openEyes.height = face.height;
    openEyes.getContext("2d").drawImage(atlas, face.x, 0, face.width, face.height, 0, 0, face.width, face.height);
    closedEyes = document.createElement("canvas");
    closedEyes.width = face.width;
    closedEyes.height = face.height;
    const ctx = closedEyes.getContext("2d");
    ctx.drawImage(openEyes, 0, 0);
    // Two small fur-colored lids sit inside the tabby's original eye markings.
    ctx.fillStyle = "#595959";
    ctx.fillRect(8, 25, 4, 4);
    ctx.fillRect(15, 26, 5, 4);
    ctx.fillStyle = "#242424";
    ctx.fillRect(8, 26, 1, 1);
    ctx.fillRect(9, 27, 3, 1);
    ctx.fillRect(15, 27, 1, 1);
    ctx.fillRect(16, 28, 4, 1);
  });
  atlas.src = "./assets/writing-studio.webp?v=charcoal-tabby";

  const heart = [".DD.DD.", "DPPDPPD", "DHLPPPD", ".DPPPD.", "..DPD..", "...D..."];
  const wingsOpen = ["DA...AD", "DAA.AAD", ".ALDLA.", "..ADA..", ".DA.AD."];
  const wingsFolded = ["..DA...", "..DLA..", "...DA..", "...DD..", "..AD..."];
  const sleepMark = ["LLLLL", "...LD", "..LD.", ".LD..", "LLLLL", ".DDDD"];
  const colors = {D:"#403047", P:"#fe889a", H:"#fff3d8", L:"#ffdbba", A:"#79ddc5"};
  const sleepColors = {L:"#a9d9ff", D:"#39465b"};

  function stamp(ctx, pattern, x, y, size, palette = colors) {
    const left = Math.round(x), top = Math.round(y);
    pattern.forEach((row, i) => {
      for (let j = 0; j < row.length; j++) {
        if (row[j] === ".") continue;
        ctx.fillStyle = palette[row[j]];
        ctx.fillRect(left + j * size, top + i * size, size, size);
      }
    });
  }

  // Blend the head's motion into the stationary shoulders at the bottom of the patch.
  function pose(ctx, dx, dy, blink) {
    const head = blink ? closedEyes : openEyes;
    if (!head) return;
    let top = Math.round(dy);
    for (let y = 0; y < face.height; y++) {
      const weight = Math.min(1, (face.height - y) / 27);
      const nextWeight = Math.min(1, (face.height - y - 1) / 27);
      const bottom = Math.round(y + 1 + dy * nextWeight);
      if (bottom > top) {
        ctx.drawImage(head, 0, y, face.width, 1, face.x + Math.round(dx * weight), top, face.width, bottom - top);
      }
      top = bottom;
    }
  }

  function floatMark(ctx, pattern, phase, x, y, drift, size, palette) {
    if (phase <= 0 || phase >= 1) return;
    ctx.globalAlpha = Math.min(1, phase * 7, (1 - phase) * 5);
    stamp(ctx, pattern, x + drift * phase, y - 14 * phase, size, palette);
    ctx.globalAlpha = 1;
  }

  const reactions = [
    {name:"nuzzle", duration:2150, message:"猫咪眯起眼睛，向你蹭了蹭。", draw(ctx, t, size) {
      const lean = Math.sin(Math.PI * t) ** 2;
      pose(ctx, -6 * lean, 3 * lean, t > .22 && t < .69);
      floatMark(ctx, heart, (t - .06) / .7, 171, 4, -8, size);
      floatMark(ctx, heart, (t - .34) / .65, 188, 3, 4, size);
    }},
    {name:"butterfly", duration:2700, message:"一只小蝴蝶飞过，猫咪抬头追着它看。", draw(ctx, t, size) {
      const lift = Math.sin(Math.PI * t);
      const swing = Math.cos(2 * Math.PI * t);
      pose(ctx, 6 * swing * lift, -5 * lift, false);
      ctx.globalAlpha = Math.min(1, t * 8, (1 - t) * 6);
      const wing = Math.floor(t * 18) % 2 ? wingsFolded : wingsOpen;
      stamp(ctx, wing, 179 + 23 * swing, -5 + 12 * lift + 4 * Math.sin(4 * Math.PI * t), size);
      ctx.globalAlpha = 1;
    }},
    {name:"snooze", duration:2900, message:"猫咪闭上眼睛，低下头打了个盹。", draw(ctx, t, size) {
      const dip = Math.min(1, t * 4, (1 - t) * 5);
      pose(ctx, 2 * dip, (8 + Math.sin(t * Math.PI * 3)) * dip, t > .14 && t < .86);
      floatMark(ctx, sleepMark, (t - .1) / .65, 190, 10, 6, size, sleepColors);
      floatMark(ctx, sleepMark, (t - .35) / .64, 198, 5, 7, size, sleepColors);
    }}
  ];

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let next = 0, timer = 0;
  function rest() {
    clearTimeout(timer);
    for (const {desk, canvas} of scenes) {
      delete desk.dataset.catPose;
      canvas.hidden = true;
    }
  }

  function play() {
    rest();
    const reaction = reactions[next];
    next = (next + 1) % reactions.length;
    document.querySelector(".cat-announcement").textContent = reaction.message;
    const start = performance.now();
    function paint() {
      const elapsed = performance.now() - start;
      if (elapsed >= reaction.duration) { rest(); return; }
      const progress = motion.matches ? .52 : elapsed / reaction.duration;
      for (const {desk, canvas, context} of scenes) {
        if (!context) continue;
        canvas.hidden = false;
        if (openEyes) desk.dataset.catPose = reaction.name;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.translate(0, sky);
        context.imageSmoothingEnabled = false;
        reaction.draw(context, progress, desk.clientWidth < 190 ? 3 : 2);
      }
      timer = motion.matches ? setTimeout(rest, 1450) : setTimeout(paint, 45);
    }
    paint();
  }

  for (const {button} of scenes) button.addEventListener("click", play);
  motion.addEventListener("change", rest);
  document.addEventListener("visibilitychange", () => { if (document.hidden) rest(); });
})();
