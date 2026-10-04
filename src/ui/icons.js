const PATHS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  camera: '<path d="M4 8.5h3.2L9 6h6l1.8 2.5H20V19H4z"/><circle cx="12" cy="13.5" r="3.4"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M6 12v8h12v-8"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  cancel: '<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V4.5h-11v11h4"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  scan: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><path d="M7.5 12h9"/>',
  keyboard: '<rect x="3" y="6.5" width="18" height="11" rx="2"/><path d="M7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17 10.5h.01M8 14h8"/>',
  offline: '<path d="M4 4l16 16"/><path d="M9.5 9.6A8.5 8.5 0 0 0 5 12M2 8.5a13 13 0 0 1 4.6-2.9M12 5a13 13 0 0 1 10 3.5M15.5 10.4A8.5 8.5 0 0 1 19 12M8.5 15.5a5 5 0 0 1 7 0M12 19h.01"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  cloud: '<path d="M7.5 18.5h9.25a4.25 4.25 0 0 0 .55-8.46A5.75 5.75 0 0 0 6.6 9.4a4.6 4.6 0 0 0 .9 9.1z"/>',
  cloudCheck: '<path d="M7.5 18.5h9.25a4.25 4.25 0 0 0 .55-8.46A5.75 5.75 0 0 0 6.6 9.4a4.6 4.6 0 0 0 .9 9.1z"/><path d="M9.6 13.9l1.9 1.9 3.4-3.6"/>',
  sync: '<path d="M19.5 12a7.5 7.5 0 0 1-13.4 4.6M4.5 12a7.5 7.5 0 0 1 13.4-4.6"/><path d="M18.4 3.6v4h-4M5.6 20.4v-4h4"/>',
  install: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M12 8v6M9.5 11.5L12 14l2.5-2.5"/>'
};

export function icon(name, { size = 22, label } = {}) {
  const span = document.createElement("span");
  span.className = "icon";
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${PATHS[name] || ""}</svg>`;
  return span;
}
