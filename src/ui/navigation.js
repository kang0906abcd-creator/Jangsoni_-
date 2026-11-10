export function createNavigation({ showScreen, tour, tourButton, reduce, onViewChange, onExitAttempt }) {
  let nextVisit = 0;
  const newVisit = () => `${performance.timeOrigin}:${nextVisit++}`;
  let current = { visit: newVisit(), screen: 'intro' };
  const views = new Map();

  let leaving = false;

  history.scrollRestoration = 'manual';
  // 첫 화면 뒤에 '나가기' 표식을 하나 깔아 두어, 사이트를 떠나는 뒤로 가기를 알아챈다.
  // 새로고침할 때는 표식이 이미 뒤에 있으므로 다시 만들지 않는다.
  if (history.state?.jangsoni) {
    history.replaceState({ jangsoni: current }, '');
  } else {
    history.replaceState({ jangsoniExit: true }, '');
    history.pushState({ jangsoni: current }, '');
  }

  function leave() {
    leaving = true;
    history.go(-2);
    // 이전 사이트가 없으면(새 탭) 그대로 머문다.
    setTimeout(() => { leaving = false; }, 1000);
  }

  function rememberView() {
    views.set(current.visit, { scrollY: window.scrollY, tourOpen: !tour.hidden });
  }

  function setTourOpen(open) {
    tour.hidden = !open;
    tourButton.setAttribute('aria-expanded', String(open));
  }

  function goToTarget(target) {
    const destination = document.getElementById(target);
    if (tour.contains(destination)) setTourOpen(true);
    destination.querySelector('[tabindex="-1"]').focus({ preventScroll: true });
    const instant = target === 'analysis-workbench' || reduce.matches;
    destination.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'start' });
  }

  window.addEventListener('popstate', event => {
    if (event.state?.jangsoniExit) {
      if (leaving) return;
      history.pushState({ jangsoni: current }, '');
      if (!onExitAttempt?.(leave)) leave();
      return;
    }
    const entry = event.state?.jangsoni;
    if (!entry) return;
    rememberView();
    current = entry;
    const view = views.get(entry.visit);
    if (view) setTourOpen(view.tourOpen);
    showScreen(entry.screen);
    if (view) {
      window.scrollTo({ top: view.scrollY, behavior: 'instant' });
    } else if (entry.target) {
      goToTarget(entry.target);
    }
    onViewChange(current.screen);
  });

  return function navigate(screen, target) {
    const previous = current;
    if (screen !== previous.screen || target !== previous.target) {
      rememberView();
      current = { visit: newVisit(), screen, target };
      history.pushState({ jangsoni: current }, '');
    }

    if (!target || screen !== previous.screen) showScreen(screen);
    if (target) goToTarget(target);
    onViewChange(current.screen);
  };
}
