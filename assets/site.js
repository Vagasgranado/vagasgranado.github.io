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

  document.addEventListener("click", function (e) {
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
