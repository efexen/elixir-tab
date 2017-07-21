var ElixirTab = function() {
  var baseUrl = "https://hexdocs.pm/elixir/";

  function fetchResource(url, callback) {
    window.fetch(url).then(function(response) {
      return response.text();
    }).then(function(data) {
      callback(null, data);
    }).catch(handleError);
  }

  function handleError(err) {
    var container = createContainer();

    var errorTitle = document.createElement("h2");
    errorTitle.innerText = "Oh no something went wrong getting the docs :(";
    errorTitle.className = "error-title";

    console.log(err);

    container.append(errorTitle);

    document.body.append(container);
  }

  function fetchPage(url, callback) {
    var page = document.createElement("html");
    fetchResource(url, function(err, data) {
      page.innerHTML = data;
      callback(page);
    });
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

      if (cache.modules && !expired(cache.timestamp)) {
        return callback(cache.modules);
      }

      fetchPage(baseUrl + "Kernel.html", function(basePage) {
        var sidescript = basePage.querySelector("head script[src*=sidebar_items]");
        var side_url = baseUrl + sidescript.attributes["src"].value;

        fetchResource(side_url, function(err, data) {
          var sideitems = data.slice(13);
          var modules = JSON.parse(sideitems).modules;
          cacheModules(modules);
          callback(modules);
        });
      });
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

  function fetchFunctionDoc(modulefun, callback) {
    var pageurl = baseUrl + modulefun.module.id + ".html";

    fetchPage(pageurl, function(docpage) {
      var selector = modulefun.fun.anchor
        .replace("/", '\\\/')
        .replace("?", '\\\?')
        .replace("!", '\\\!');

      return callback(docpage.querySelector("#" + selector));
    });
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

  function createHexdocsLink(modulefun) {
    var link = document.createElement("a");
    link.innerText = "Open in hexdocs.pm";
    link.href = baseUrl + modulefun.module.id + ".html#" + modulefun.fun.anchor;
    link.className = "hexdocs-link";
    return link;
  }

  function renderFunction(modulefun) {
    fetchFunctionDoc(modulefun, function(docs) {
      var moduleTitle = createModuleTitle(modulefun.module);
      var functionTitle = createFunctionTitle(modulefun.fun);
      var hexdocsLink = createHexdocsLink(modulefun);

      var container = createContainer();

      container.append(moduleTitle);
      container.append(functionTitle);
      container.append(docs);
      container.append(hexdocsLink);

      document.body.append(container);
    });
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
