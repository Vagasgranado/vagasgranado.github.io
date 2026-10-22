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

  // Tradução automática da página inteira (Google Tradutor) para PT / EN / ES / FR / IT.
  // - Página de vaga: abre sempre no idioma em que a vaga foi divulgada. Se o candidato escolher
  //   outro idioma nessa vaga, a escolha vale para ela durante a visita.
  // - Página inicial: usa o último idioma escolhido pelo candidato ou, na primeira visita, o idioma
  //   do navegador dele.
  // Se a página já está no idioma desejado, nada externo é carregado.
  var IDIOMAS = ["pt", "en", "es", "fr", "it"];
  var idiomaPagina = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
  var ehVaga = /\/jobs\/[^/]+\/?(index\.html)?$/.test(location.pathname);
  var guardar = function (onde, chave, valor) { try { window[onde].setItem(chave, valor); } catch (e) {} };
  var ler = function (onde, chave) { try { return window[onde].getItem(chave) || ""; } catch (e) { return ""; } };
  var chaveVaga = "idioma:" + location.pathname.replace(/index\.html$/, "");
  var lerIdioma = function () {
    if (ehVaga) return ler("sessionStorage", chaveVaga);
    var pref = ler("localStorage", "idioma");
    if (pref) return pref;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    nav = nav.slice(0, 2).toLowerCase();
    return IDIOMAS.indexOf(nav) > -1 ? nav : "";
  };
  // Idioma original da página, informado ao tradutor: na página inicial os títulos das vagas estão
  // em vários idiomas e a detecção automática do Google erra (e não traduz nada)
  var origem = IDIOMAS.indexOf(idiomaPagina) > -1 ? idiomaPagina : "auto";
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
      var valor = "googtrans=/" + origem + "/" + lang + "; path=" + p;
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
    var flags = b.querySelector(".bandeiras");
    if (sim && sel && flags) sel.innerHTML = flags.innerHTML + b.getAttribute("data-sigla");
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
  // Textos fixos (títulos, botões, filtros, avisos e datas): trocados na hora pelo dicionário
  // gerado em assets/textos.js, sem depender de serviço externo
  var trocarRotulos = function (lang) {
    var d = (window.TEXTOS_SITE || {})[lang];
    if (!d) return;
    var cada = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };
    cada("[data-t]", function (el) { var v = d[el.getAttribute("data-t")]; if (v) el.textContent = v; });
    cada("[data-t-ph]", function (el) { var v = d[el.getAttribute("data-t-ph")]; if (v) el.setAttribute("placeholder", v); });
    cada("[data-copiado]", function (el) { if (d.copiado) el.setAttribute("data-copiado", d.copiado); });
    cada("[data-data]", function (el) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(el.getAttribute("data-data") || "");
      if (!m) return;
      try {
        el.textContent = new Intl.DateTimeFormat(d.locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
      } catch (e) {}
    });
    cada("[data-t-modelo]", function (el) {
      var fixos = el.querySelectorAll(".fixo");
      var modelo = d[el.getAttribute("data-t-modelo")];
      if (!modelo || fixos.length < 2) return;
      el.innerHTML = modelo.replace("{e}", fixos[0].outerHTML).replace("{a}", fixos[1].outerHTML);
    });
  };
  if (escolhido && escolhido !== idiomaPagina) trocarRotulos(escolhido);

  // Descritivo e título da vaga (texto livre do analista): tradução automática do Google, só nas
  // páginas de vaga. Na página inicial os títulos ficam no idioma original de cada vaga.
  if (ehVaga && escolhido && escolhido !== idiomaPagina) {
    gravarIdioma(escolhido); // o Google Tradutor lê o idioma de destino deste cookie
    window.iniciarTradutor = function () {
      new google.translate.TranslateElement({ pageLanguage: origem, includedLanguages: IDIOMAS.join(","), autoDisplay: false }, "tradutor");
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
      guardar("localStorage", "idioma", lang);
      if (ehVaga) guardar("sessionStorage", chaveVaga, lang);
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
