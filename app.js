"use strict";
const shortDescription = "A monster-raising autobattler where you hatch, feed, and train your monsters, shape their builds, and discover powerful team synergies.";
const contactEmail = "rigelrivaldo.rr@gmail.com";
const box = document.querySelector("#lightbox");
let previousFocus = null;
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function link(text, url) {
  const node = el("a", "", text);
  node.href = url;
  node.download = "";
  return node;
}
function openScreenshot(shot, opener) {
  previousFocus = opener;
  document.querySelector("#lightbox-title").textContent = shot.title;
  const image = document.querySelector("#lightbox-image");
  image.src = shot.url;
  image.alt = shot.alt;
  document.querySelector("#lightbox-size").textContent = shot.dimensions + " · PNG · " + shot.size;
  document.querySelector("#lightbox-download").href = shot.url;
  box.showModal();
}
document.querySelector("#close-lightbox").addEventListener("click", () => box.close());
box.addEventListener("click", event => {
  if (event.target === box) {
    const rect = box.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) box.close();
  }
});
box.addEventListener("close", () => { if (previousFocus) previousFocus.focus(); });
const tabs = Array.from(document.querySelectorAll("[data-tab]"));
function selectTab(tab, focus) {
  tabs.forEach(button => {
    const selected = button === tab;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    document.querySelector("#panel-" + button.dataset.tab).hidden = !selected;
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab, false));
  tab.addEventListener("keydown", event => {
    let next = null;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== null) { event.preventDefault(); selectTab(tabs[next], true); }
  });
});
const characterGroups = Array.from(document.querySelectorAll("[data-character-group]"));
characterGroups.forEach(button => {
  button.addEventListener("click", () => {
    const portraits = button.dataset.characterGroup === "portraits";
    characterGroups.forEach(option => option.setAttribute("aria-pressed", String(option === button)));
    document.querySelector("#npc-portraits").hidden = !portraits;
    document.querySelector("#monster-reactions").hidden = portraits;
  });
});
if (location.hash === "#npc-portraits") {
  selectTab(document.querySelector('[data-tab="monsters"]'), false);
}
document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", async () => {
    const text = button.dataset.copy === "email" ? contactEmail : shortDescription;
    const status = button.querySelector(".copy-status");
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      status.textContent = "Copied";
    } catch (_) {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      status.textContent = copied ? "Copied" : "Select and copy the text above";
    }
    setTimeout(() => { status.textContent = ""; }, 3500);
  });
});
async function renderAssets() {
  const response = await fetch("assets.json");
  if (!response.ok) throw new Error("Asset list could not load");
  const data = await response.json();
  document.querySelectorAll("[data-pack]").forEach(anchor => {
    const pack = data.packs[anchor.dataset.pack];
    if (pack) anchor.href = pack.url;
  });
  document.querySelectorAll("[data-size]").forEach(label => {
    const pack = data.packs[label.dataset.size];
    if (pack) label.textContent = pack.size;
  });
  document.querySelector("#trailer-size").textContent = data.trailerSize;
  const grid = document.querySelector("#screenshot-grid");
  data.screenshots.forEach(shot => {
    const card = el("article", "screenshot-card");
    const button = el("button", "screenshot-open");
    button.setAttribute("aria-label", "View " + shot.title + " at full resolution");
    const image = el("img");
    image.src = shot.preview;
    image.alt = shot.alt;
    image.loading = "lazy";
    image.width = 1000;
    image.height = 563;
    button.append(image);
    button.addEventListener("click", () => openScreenshot(shot, button));
    const caption = el("div", "screenshot-caption");
    caption.append(el("h3", "", shot.title), link("PNG", shot.url));
    card.append(button, caption, el("span", "shot-meta", shot.dimensions));
    grid.append(card);
  });
  const cutouts = document.querySelector("#cutout-grid");
  (data.npcPortraits || []).forEach(portrait => {
    const card = el("article", "asset-card cutout-card portrait-card");
    card.dataset.npc = portrait.id;
    const preview = el("div", "asset-preview portrait-preview checker");
    const image = el("img");
    image.loading = "lazy";
    const [width, height] = portrait.dimensions.split(" × ").map(Number);
    image.width = width;
    image.height = height;
    preview.append(image);
    const info = el("div", "asset-card-info");
    const current = el("span", "portrait-current");
    const download = link("", "");
    const choices = el("div", "expression-choices");
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", portrait.name + " expression");
    const buttons = [];
    function selectExpression(frame, index) {
      image.src = frame.png;
      image.alt = frame.alt;
      current.textContent = frame.expression + " · " + portrait.dimensions + " · Transparent PNG";
      download.href = frame.png;
      download.textContent = "Download " + frame.expression.toLowerCase() + " PNG";
      download.setAttribute("aria-label", "Download " + portrait.name + ", " + frame.expression.toLowerCase() + " portrait");
      buttons.forEach((button, at) => button.setAttribute("aria-pressed", String(at === index)));
    }
    portrait.expressions.forEach((frame, index) => {
      const button = el("button", "", frame.expression);
      button.type = "button";
      button.setAttribute("aria-label", portrait.name + ": " + frame.expression);
      button.addEventListener("click", () => selectExpression(frame, index));
      buttons.push(button);
      choices.append(button);
    });
    selectExpression(portrait.expressions[0], 0);
    info.append(el("h3", "", portrait.name), current, choices, download);
    card.append(preview, info);
    document.querySelector("#portrait-" + portrait.group).append(card);
  });
  (data.cutouts || []).forEach(cutout => {
    const card = el("article", "asset-card cutout-card");
    const preview = el("div", "asset-preview reaction-preview checker");
    const image = el("img");
    image.src = cutout.png;
    image.alt = cutout.alt;
    image.loading = "lazy";
    if (cutout.kind === "original") image.className = "pixel";
    preview.append(image);
    const info = el("div", "asset-card-info");
    info.append(el("span", "character-name", cutout.name), el("h3", "", cutout.title),
                el("span", "", cutout.dimensions + " · Transparent PNG"),
                link("Download PNG", cutout.png));
    card.append(preview, info);
    cutouts.append(card);
  });
  (data.sceneBackgrounds || []).forEach(scene => {
    const card = el("article", "screenshot-card");
    const button = el("button", "screenshot-open");
    button.setAttribute("aria-label", "Preview " + scene.title + " background");
    const image = el("img");
    image.src = scene.preview;
    image.alt = scene.alt;
    image.loading = "lazy";
    image.width = 1000;
    image.height = 563;
    button.append(image);
    button.addEventListener("click", () => openScreenshot(scene, button));
    const caption = el("div", "screenshot-caption");
    caption.append(el("h3", "", scene.title), link("PNG", scene.url));
    card.append(button, caption, el("span", "shot-meta", scene.dimensions + " · UI-free"));
    document.querySelector("#scene-grid").append(card);
  });
  (data.components || []).forEach(component => {
    const card = el("article", "asset-card");
    const preview = el("div", "asset-preview overlay-preview checker");
    const image = el("img");
    image.src = component.png;
    image.alt = component.alt;
    image.loading = "lazy";
    preview.append(image);
    const info = el("div", "asset-card-info");
    info.append(el("h3", "", component.title), el("span", "", component.dimensions + " · Transparent PNG"),
                el("p", "component-note", component.note));
    const downloads = el("div", "asset-downloads");
    downloads.append(link("Download PNG", component.png));
    if (component.svg) downloads.append(link("Editable SVG", component.svg));
    info.append(downloads);
    card.append(preview, info);
    document.querySelector("#component-grid").append(card);
  });
}
renderAssets().catch(error => {
  document.querySelector("#screenshot-grid").append(el("p", "", "Screenshots could not load. Please refresh the page."));
  console.error(error);
});
