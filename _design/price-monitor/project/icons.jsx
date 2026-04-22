// Simple inline SVG icons — 18×18 default

const Icon = ({ name, size = 18, stroke = 1.8, ...rest }) => {
  const s = { width: size, height: size, strokeWidth: stroke, stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    bell: <><path d="M6 8a6 6 0 1 1 12 0c0 5 1.5 6 2 7H4c.5-1 2-2 2-7z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    arrowDown: <><path d="M12 5v14M5 12l7 7 7-7"/></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7"/></>,
    arrowRight: <><path d="M5 12h14M12 5l7 7-7 7"/></>,
    arrowLeft: <><path d="M19 12H5M12 19l-7-7 7-7"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
    external: <><path d="M7 17 17 7"/><path d="M8 7h9v9"/></>,
    check: <><path d="m4 12 5 5 11-12"/></>,
    x: <><path d="M18 6 6 18M6 6l18 18" transform="scale(0.67)"/><path d="M18 6 6 18M6 6l12 12"/></>,
    play: <><path d="M6 4v16l14-8z" fill="currentColor"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
    zap: <><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff: <><path d="m3 3 18 18"/><path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6.5 0 10 6 10 6a17.8 17.8 0 0 1-3.2 4M6.6 6.6A17.8 17.8 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    discord: <><path d="M8 7c-2 .5-3.5 1.5-3.5 1.5C3 11 2.5 15 3 18c1.5 1 3 1.5 4.5 2l1-2c-.5-.2-1-.5-1.5-1 2 1 5.5 1 8 0-.5.5-1 .8-1.5 1l1 2c1.5-.5 3-1 4.5-2 .5-3 0-7-1.5-9.5 0 0-1.5-1-3.5-1.5l-1 2c-1.5-.3-3-.3-4.5 0z"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/></>,
    link: <><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    flame: <><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3S8 8 8 12a4 4 0 0 0 8 0"/></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    more: <><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 15 4-5 4 3 5-7"/></>,
    filter: <><path d="M3 5h18M6 12h12M10 19h4"/></>,
  };
  return <svg viewBox="0 0 24 24" {...s} {...rest}>{paths[name]}</svg>;
};

Object.assign(window, { Icon });
