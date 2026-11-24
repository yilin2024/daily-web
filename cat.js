"use strict";

(() => {
  // The desk atlas uses 240 × 128 frames. Only this patch of the cat moves independently.
  const face = {x: 160, width: 52, height: 55};
  // Keep four display samples per sprite pixel so the outline can move between pixels.
  const scale = 4, crop = {x:144, y:-26, width:90, height:81};
  const scenes = [...document.querySelectorAll(".cat-hit")].map(button => {
    const desk = button.closest(".pixel-writer");
    const canvas = document.createElement("canvas");
    canvas.width = crop.width * scale;
    canvas.height = crop.height * scale;
    canvas.className = "cat-scene";
    canvas.hidden = true;
    canvas.setAttribute("aria-hidden", "true");
    desk.insertBefore(canvas, button);
    return {desk, canvas, context: canvas.getContext("2d"), button};
  });

  const atlas = new Image();
  let openEyes, closedEyes, head;
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
    head = document.createElement("canvas");
    head.width = face.width;
    head.height = face.height;
  });
  atlas.src = "./assets/writing-studio.webp?v=charcoal-tabby";

  const heart = [".DD.DD.", "DPPDPPD", "DHLPPPD", ".DPPPD.", "..DPD..", "...D..."];
  const wingsOpen = ["DA...AD", "DAA.AAD", ".ALDLA.", "..ADA..", ".DA.AD."];
  const sleepMark = ["LLLLL", "...LD", "..LD.", ".LD..", "LLLLL", ".DDDD"];
  const colors = {D:"#403047", P:"#fe889a", H:"#fff3d8", L:"#ffdbba", A:"#79ddc5"};
  const sleepColors = {L:"#a9d9ff", D:"#39465b"};

  function stamp(ctx, pattern, x, y, size, palette = colors) {
    pattern.forEach((row, i) => {
      for (let j = 0; j < row.length; j++) {
        if (row[j] === ".") continue;
        ctx.fillStyle = palette[row[j]];
        ctx.fillRect(x + j * size, y + i * size, size, size);
      }
    });
  }

  const smooth = value => {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  };
  const envelope = (t, enter, leave, finish) => smooth(t / enter) * (1 - smooth((t - leave) / (finish - leave)));
  const snap = value => Math.round(value * scale) / scale;

  function prepareEyes(lid) {
    if (!head) return;
    const ctx = head.getContext("2d");
    ctx.clearRect(0, 0, head.width, head.height);
    ctx.drawImage(openEyes, 0, 0);
    ctx.globalAlpha = Math.max(0, Math.min(1, lid));
    ctx.drawImage(closedEyes, 8, 25, 12, 5, 8, 25, 12, 5);
    ctx.globalAlpha = 1;
  }

  function pose(ctx, dx, dy) {
    if (!head) return;
    let top = snap(dy);
    for (let y = 0; y < face.height; y++) {
      const weight = smooth((face.height - y) / 27);
      const bottom = snap(y + 1 + dy * smooth((face.height - y - 1) / 27));
      ctx.drawImage(head, 0, y, face.width, 1, face.x + snap(dx * weight), top, face.width, bottom - top);
      top = bottom;
    }
  }

  function floatMark(ctx, pattern, phase, x, y, drift, size, palette) {
    if (phase <= 0 || phase >= 1) return;
    ctx.save();
    ctx.globalAlpha *= envelope(phase, .15, .78, 1);
    stamp(ctx, pattern, x + drift * phase, y - 14 * phase, size, palette);
    ctx.restore();
  }

  const reactions = [
    {name:"nuzzle", duration:2150, message:"猫咪眯起眼睛，向你蹭了蹭。",
      target(t) {
        const lean = Math.sin(Math.PI * t) ** 2;
        return [-6 * lean, 3 * lean, envelope(t, .27, .63, .79)];
      },
      draw(ctx, t, size) {
        floatMark(ctx, heart, (t - .06) / .7, 171, 4, -8, size);
        floatMark(ctx, heart, (t - .34) / .65, 188, 3, 4, size);
      }},
    {name:"butterfly", duration:2700, message:"一只小蝴蝶飞过，猫咪抬头追着它看。",
      target(t) {
        const lift = Math.sin(Math.PI * t);
        return [6 * Math.cos(2 * Math.PI * t) * lift, -5 * lift, 0];
      },
      draw(ctx, t, size) {
        const flap = .3 + .7 * (.5 + .5 * Math.cos(18 * Math.PI * t));
        ctx.globalAlpha *= envelope(t, .14, .8, 1);
        ctx.translate(179 + 3.5 * size + 23 * Math.cos(2 * Math.PI * t),
          -5 + 12 * Math.sin(Math.PI * t) + 4 * Math.sin(4 * Math.PI * t));
        ctx.scale(flap, 1);
        stamp(ctx, wingsOpen, -3.5 * size, 0, size);
      }},
    {name:"snooze", duration:2900, message:"猫咪闭上眼睛，低下头打了个盹。",
      target(t) {
        const dip = envelope(t, .28, .75, 1);
        return [2 * dip, (8 + Math.sin(t * Math.PI * 3)) * dip, envelope(t, .18, .8, .96)];
      },
      draw(ctx, t, size) {
        floatMark(ctx, sleepMark, (t - .1) / .65, 190, 10, 6, size, sleepColors);
        floatMark(ctx, sleepMark, (t - .35) / .64, 198, 5, 7, size, sleepColors);
      }}
  ];

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const position = [0, 0, 0], velocity = [0, 0, 0];
  let next = 0, frame = 0, timer = 0, previous = 0, current = null, effects = [];

  function rest() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    current = null;
    effects = [];
    position.fill(0);
    velocity.fill(0);
    for (const {desk, canvas} of scenes) {
      delete desk.dataset.catPose;
      canvas.hidden = true;
    }
  }

  // A damped spring keeps both position and velocity when a new interaction interrupts a pose.
  function approach(target, seconds) {
    const rate = 24, decay = Math.exp(-rate * seconds);
    for (let i = 0; i < position.length; i++) {
      const offset = position[i] - target[i];
      const impulse = velocity[i] + rate * offset;
      position[i] = target[i] + (offset + impulse * seconds) * decay;
      velocity[i] = (velocity[i] - rate * impulse * seconds) * decay;
    }
  }

  function paint(now) {
    now = Math.max(now, previous);
    const progress = effect => motion.matches ? .52 : Math.min(1, (now - effect.start) / effect.reaction.duration);
    const t = progress(current);
    const target = current.reaction.target(t);
    if (motion.matches) position.splice(0, 3, ...target);
    else approach(target, Math.max(0, now - previous) / 1000);
    previous = now;
    if (t === 1 && position.every(v => Math.abs(v) < .025) && velocity.every(v => Math.abs(v) < .2)) {
      rest();
      return;
    }
    effects = effects.filter(effect => progress(effect) < 1 && (effect.released == null || now - effect.released < 200));
    prepareEyes(position[2]);
    for (const {desk, canvas, context:ctx} of scenes) {
      if (!ctx) continue;
      canvas.hidden = false;
      if (head) desk.dataset.catPose = current.reaction.name;
      ctx.setTransform(scale, 0, 0, scale, -crop.x * scale, -crop.y * scale);
      ctx.clearRect(crop.x, crop.y, crop.width, crop.height);
      ctx.imageSmoothingEnabled = false;
      pose(ctx, position[0], position[1]);
      const size = desk.clientWidth < 190 ? 3 : 2;
      for (const effect of effects) {
        ctx.save();
        ctx.globalAlpha = effect.released == null ? 1 : 1 - smooth((now - effect.released) / 200);
        effect.reaction.draw(ctx, progress(effect), size);
        ctx.restore();
      }
    }
    if (motion.matches) timer = setTimeout(rest, 1450);
    else frame = requestAnimationFrame(paint);
  }

  function play() {
    const now = performance.now();
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    if (current) current.released = now;
    else previous = now;
    if (motion.matches) effects = [];
    current = {reaction:reactions[next], start:now};
    effects.push(current);
    next = (next + 1) % reactions.length;
    document.querySelector(".cat-announcement").textContent = current.reaction.message;
    paint(now);
  }

  for (const {button} of scenes) button.addEventListener("click", play);
  motion.addEventListener("change", rest);
  document.addEventListener("visibilitychange", () => { if (document.hidden) rest(); });
})();
