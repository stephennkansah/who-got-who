// whogotwho.club/get: one link for adverts and posts. iPhones and iPads go to
// the App Store, Android phones to Google Play; computers stay on this page,
// which shows both badges. A separate file because the site's
// Content-Security-Policy blocks inline scripts.
(function () {
  var APP_STORE = 'https://apps.apple.com/app/id6826935487';
  var PLAY = 'https://play.google.com/store/apps/details?id=club.whogotwho.twa';

  // ?from=tiktok (letters, numbers, - and _ only) tells Google Play's stats where the install came from.
  var from = (new URLSearchParams(window.location.search).get('from') || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
  var playLink = from ? PLAY + '&referrer=' + encodeURIComponent('utm_source=' + from + '&utm_medium=get_link') : PLAY;

  document.getElementById('app-store').href = APP_STORE;
  document.getElementById('google-play').href = playLink;

  var ua = navigator.userAgent || '';
  // iPadOS reports itself as a Mac; touch support gives it away.
  var apple = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/i.test(ua);
  if (apple) window.location.replace(APP_STORE);
  else if (android) window.location.replace(playLink);
})();
