/* NEXTIER clay crew rig: the real clay figures, cut at the hips (and the analyst's neck,
   the operator's elbow), assembled here so clay-crew.css can walk them and make them work.
   Markup: <span class="nxc" data-role="scout|analyst|operator" data-act="walk scan|build|tag|push|idle|step"></span> */
(() => {
  const PROPS = {
    scan: '<i class="nxc-beam"></i>',
    build: '<i class="nxc-card nxc-c1"></i><i class="nxc-card nxc-c2"></i><i class="nxc-card nxc-c3"></i>',
    tag: '<i class="nxc-tagfly nxc-c1">✓</i><i class="nxc-tagfly nxc-c2">✓</i><i class="nxc-tagfly nxc-c3">✓</i>'
  };
  function build(el) {
    const role = el.dataset.role, acts = (el.dataset.act || '').split(/\s+/);
    let body = '<i class="nxc-p nxc-body">';
    if (role === 'analyst') body += '<i class="nxc-p nxc-head"></i>';
    if (role === 'operator') body += '<i class="nxc-p nxc-fore"></i>';
    acts.forEach(a => { if (PROPS[a]) body += PROPS[a]; });
    body += '</i>';
    el.classList.add('nxc-' + role);
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i class="nxc-shadow"></i><i class="nxc-fig"><i class="nxc-p nxc-leg-b"></i><i class="nxc-p nxc-leg-f"></i>' + body + '</i>';
    el.dataset.built = '1';
  }
  function mount(root) {
    (root || document).querySelectorAll('.nxc[data-role]:not([data-built])').forEach(build);
  }
  window.NXClay = { mount };
  mount();
  document.addEventListener('DOMContentLoaded', () => mount());
})();
