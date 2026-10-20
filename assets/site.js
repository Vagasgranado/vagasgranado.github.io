// Filtros da página inicial e botão "Copiar link" das vagas.
(function () {
  var busca = document.getElementById("f-busca");
  var pais = document.getElementById("f-pais");
  var area = document.getElementById("f-area");
  var lista = document.getElementById("lista");

  // Prazo vencido: a vaga sai da lista e a página mostra "encerrada" automaticamente,
  // mesmo que ninguém tenha aberto o painel desde o vencimento
  var d = new Date();
  var hoje = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  var vencido = function (p) { return /^\d{4}-\d{2}-\d{2}$/.test(p || "") && p < hoje; };
  var faixa = document.querySelector("[data-expira]");
  if (faixa && vencido(faixa.getAttribute("data-expira"))) {
    faixa.hidden = false;
    Array.prototype.forEach.call(document.querySelectorAll("[data-candidatura]"), function (el) { el.remove(); });
    var etq = document.querySelector(".etiqueta-aberta");
    if (etq) etq.remove();
  }
  if (lista) {
    Array.prototype.slice.call(lista.children).forEach(function (c) { if (vencido(c.dataset.prazo)) c.remove(); });
    var total = document.getElementById("total");
    if (total) total.textContent = lista.children.length;
  }

  if (lista && busca) {
    var norm = function (s) {
      return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    };
    var filtrar = function () {
      var t = norm(busca.value.trim()), p = pais.value, a = area.value, n = 0;
      Array.prototype.forEach.call(lista.children, function (c) {
        var ok = (!t || norm(c.dataset.busca).indexOf(t) > -1) && (!p || c.dataset.pais === p) && (!a || c.dataset.area === a);
        c.hidden = !ok;
        if (ok) n++;
      });
      document.getElementById("total").textContent = n;
      document.getElementById("vazio").hidden = n > 0;
    };
    busca.addEventListener("input", filtrar);
    pais.addEventListener("change", filtrar);
    area.addEventListener("change", filtrar);
  }

  // Tradução automática PT / EN / ES (Google Tradutor). A escolha fica num cookie e vale para
  // todas as páginas do site. Se a página já está no idioma escolhido, nada externo é carregado.
  var idiomaPagina = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
  var lerIdioma = function () {
    var m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/;]*\/([a-z]{2})/i);
    return m ? m[1].toLowerCase() : "";
  };
  // O Google também grava esse cookie em caminhos de páginas específicas; grava-se a escolha em
  // todos os níveis do endereço para que uma escolha antiga nunca prevaleça sobre a nova
  var gravarIdioma = function (lang) {
    var partes = location.pathname.split("/");
    var caminhos = ["/"];
    for (var i = 1, acc = ""; i < partes.length; i++) {
      acc += "/" + partes[i];
      caminhos.push(acc, acc + "/");
    }
    caminhos.forEach(function (p) {
      var valor = "googtrans=/auto/" + lang + "; path=" + p;
      document.cookie = valor;
      if (/\./.test(location.hostname)) document.cookie = valor + "; domain=" + location.hostname;
    });
  };
  var escolhido = lerIdioma();
  var ativo = escolhido || idiomaPagina || "pt";
  Array.prototype.forEach.call(document.querySelectorAll("[data-idioma]"), function (b) {
    var sim = b.getAttribute("data-idioma") === ativo;
    b.setAttribute("aria-current", String(sim));
    // o botão do topo mostra a bandeira e a sigla do idioma em uso
    var sel = document.querySelector(".idioma-sel");
    if (sim && sel) sel.innerHTML = b.querySelector("svg").outerHTML + b.getAttribute("data-sigla");
  });
  var botaoIdioma = document.querySelector(".idioma-atual");
  var menuIdioma = document.getElementById("idioma-menu");
  var abrirMenu = function (abrir) {
    if (!botaoIdioma || !menuIdioma) return;
    menuIdioma.hidden = !abrir;
    botaoIdioma.setAttribute("aria-expanded", String(abrir));
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") abrirMenu(false);
  });
  if (escolhido && escolhido !== idiomaPagina) {
    window.iniciarTradutor = function () {
      new google.translate.TranslateElement({ pageLanguage: "auto", includedLanguages: "pt,en,es", autoDisplay: false }, "tradutor");
    };
    var s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=iniciarTradutor";
    document.head.appendChild(s);
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest(".idioma-atual")) return abrirMenu(menuIdioma.hidden);
    if (!e.target.closest(".idioma-menu")) abrirMenu(false);
    var bi = e.target.closest("[data-idioma]");
    if (bi) {
      abrirMenu(false);
      var lang = bi.getAttribute("data-idioma");
      if (lang === ativo) return;
      gravarIdioma(lang);
      location.reload();
      return;
    }
    var b = e.target.closest("[data-copiar]");
    if (!b) return;
    // Copia o endereço em que a página está aberta: funciona em qualquer hospedagem, mesmo que o
    // endereço do site ainda não tenha sido configurado no painel
    var url = /^https?:$/.test(location.protocol) ? location.origin + location.pathname.replace(/index\.html$/, "") : b.getAttribute("data-copiar");
    var rotulo = b.querySelector("span");
    var feito = function () {
      if (!rotulo) return;
      var original = rotulo.getAttribute("data-rotulo") || rotulo.textContent;
      rotulo.setAttribute("data-rotulo", original);
      rotulo.textContent = b.getAttribute("data-copiado") || "Link copiado!";
      setTimeout(function () { rotulo.textContent = original; }, 2000);
    };
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ title: document.title, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(feito, function () { window.prompt("Copie o link:", url); });
    } else {
      window.prompt("Copie o link:", url);
    }
  });
})();
