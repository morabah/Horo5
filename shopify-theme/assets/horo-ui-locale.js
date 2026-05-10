document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  let uiLocale = urlParams.get('uiLocale');

  if (uiLocale) {
    localStorage.setItem('horo-ui-locale', uiLocale);
  } else {
    uiLocale = localStorage.getItem('horo-ui-locale') || 'en';
  }

  const isAr = uiLocale === 'ar';
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';

  // Apply data-horo-i18n strings if the dictionary exists
  const dictScript = document.getElementById('horo-ui-i18n');
  if (dictScript) {
    try {
      const dictionary = JSON.parse(dictScript.textContent);
      const activeDict = dictionary[uiLocale];
      
      if (activeDict) {
        document.querySelectorAll('[data-horo-i18n]').forEach((el) => {
          const keyPath = el.getAttribute('data-horo-i18n');
          if (!keyPath) return;
          
          const keys = keyPath.split('.');
          let val = activeDict;
          for (const k of keys) {
            val = val[k];
            if (!val) break;
          }
          if (val && typeof val === 'string') {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
              el.placeholder = val;
            } else {
              el.textContent = val;
            }
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse horo-ui-i18n dictionary', e);
    }
  }

  // Bind toggle buttons
  document.querySelectorAll('[data-horo-locale]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetLocale = e.currentTarget.getAttribute('data-horo-locale');
      if (targetLocale) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('uiLocale', targetLocale);
        window.location.href = currentUrl.toString();
      }
    });
  });
});
