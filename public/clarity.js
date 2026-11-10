// Microsoft Clarity: heatmaps and session recordings (project zbew0yw9wk,
// clarity.microsoft.com). A separate file because the site's
// Content-Security-Policy blocks inline scripts; amplify.yml allows clarity.ms.
// Records the live website only: whogotwho.club, which the Android app also
// shows. Not the iPhone app (its own bundled copy, capacitor://localhost), a
// local copy, a test build or an Amplify preview address.
(function () {
  var host = window.location.hostname;
  if (host !== 'whogotwho.club' && host !== 'www.whogotwho.club') return;

  // Microsoft's install code, unchanged.
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', 'zbew0yw9wk');
})();
