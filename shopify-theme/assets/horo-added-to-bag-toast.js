/**
 * Lightweight "Added to bag" toast — shown after add-to-cart instead of opening the cart drawer.
 */
(function () {
  'use strict';

  var DISMISS_MS = 5000;
  var host = null;
  var timer = null;

  function copy() {
    return window.horoAddedToBagCopy || {
      title: 'Added to bag',
      viewBag: 'View bag',
      continueShopping: 'Continue shopping',
      cartUrl: '/cart',
    };
  }

  function dismiss() {
    if (timer) window.clearTimeout(timer);
    timer = null;
    if (host) host.remove();
    host = null;
    document.documentElement.style.removeProperty('--horo-bottom-fab-offset');
  }

  function scheduleDismiss() {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(dismiss, DISMISS_MS);
  }

  function showToast() {
    dismiss();
    var labels = copy();
    host = document.createElement('div');
    host.className = 'horo-added-to-bag-toast-host';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    host.innerHTML =
      '<div class="horo-added-to-bag-toast">' +
      '<p class="horo-added-to-bag-toast__title"><span aria-hidden="true">✓</span> ' +
      labels.title +
      '</p>' +
      '<div class="horo-added-to-bag-toast__actions">' +
      '<a class="horo-added-to-bag-toast__cta horo-added-to-bag-toast__cta--primary" href="' +
      labels.cartUrl +
      '">' +
      labels.viewBag +
      '</a>' +
      '<button type="button" class="horo-added-to-bag-toast__cta horo-added-to-bag-toast__cta--ghost">' +
      labels.continueShopping +
      '</button>' +
      '</div></div>';

    var continueBtn = host.querySelector('button');
    if (continueBtn) continueBtn.addEventListener('click', dismiss);
    host.addEventListener('pointerenter', function () {
      if (timer) window.clearTimeout(timer);
    });
    host.addEventListener('pointerleave', scheduleDismiss);

    document.body.appendChild(host);
    document.documentElement.style.setProperty('--horo-bottom-fab-offset', '5.5rem');
    scheduleDismiss();
  }

  window.horoShowAddedToBagToast = showToast;
})();
