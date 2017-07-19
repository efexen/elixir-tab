var ElixirTab = function() {
  var baseUrl = "https://hexdocs.pm/elixir/";

  function fetchResource(url) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url, false);
    xhr.send();

    return xhr.responseText;
  }

  function fetchPage(url) {
    var page = document.createElement("html");
    page.innerHTML = fetchResource(url);
    return page;
  }

  function expired(timestamp) {
    return timestamp < (Date.now() - 1000 * 60 * 60 * 24);
  }

  function cacheModules(modules) {
    chrome.storage.local.set({
      timestamp: Date.now(),
      modules: modules
    });
  }

  function fetchModules(callback) {
    chrome.storage.local.get(function(cache) {
      var modules;

      if (cache.modules && !expired(cache.timestamp)) {
        modules = cache.modules;
      } else {
        var basePage = fetchPage(baseUrl + "Kernel.html");
        var sidescript = basePage.querySelector("head script[src*=sidebar_items]");
        var side_url = baseUrl + sidescript.attributes["src"].value;

        var sideitems = fetchResource(side_url).slice(13);
        modules = JSON.parse(sideitems).modules;
        cacheModules(modules);
      }

      callback(modules);
    });
  }

  function selectRandomElement(array) {
    var index = Math.ceil(Math.random() * array.length);
    return array[index];
  }

  function findRandomModuleFunction(modules) {
    var fun;
    var module;
    var counter = 0;

    while (!fun && counter < 50) {
      module = selectRandomElement(modules);

      if (module && module.functions) {
        fun = selectRandomElement(module.functions);
      }

      counter++;
    }

    renderFunction({
      module: module,
      fun: fun
    });
  }

  function fetchFunctionDoc(modulefun) {
    var pageurl = baseUrl + modulefun.module.id + ".html";

    var docpage = fetchPage(pageurl);

    var selector = modulefun.fun.anchor
      .replace("/", '\\\/')
      .replace("?", '\\\?')
      .replace("!", '\\\!');

    return docpage.querySelector("#" + selector);
  }

  function createModuleTitle(module) {
    var title = document.createElement("h1");
    title.innerHTML = module.title;
    return title;
  }

  function createFunctionTitle(fun) {
    var title = document.createElement("h2");
    title.className = "function-title";
    title.innerHTML = fun.id;
    return title;
  }

  function createContainer() {
    var container = document.createElement("div");
    container.className = "main";
    return container;
  }

  function renderFunction(modulefun) {
    var docs = fetchFunctionDoc(modulefun);

    var moduleTitle = createModuleTitle(modulefun.module);
    var functionTitle = createFunctionTitle(modulefun.fun);

    var container = createContainer();

    container.append(moduleTitle);
    container.append(functionTitle);
    container.append(docs);

    document.body.append(container);
  }

  function init() {
    fetchModules(findRandomModuleFunction);
  };

  return {
    init: init
  };

}();

document.addEventListener("DOMContentLoaded", function() {
  ElixirTab.init();
});
