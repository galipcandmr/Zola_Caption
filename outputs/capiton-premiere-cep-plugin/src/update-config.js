(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search || "");
  var isMock = params.has("mock");

  window.CAPITON_UPDATE_URL = isMock
    ? "./updates/update.json"
    : "";
})();
