/* Typeset the LaTeX stored directly in each marked element. */
document.querySelectorAll("[data-math]").forEach(element => {
  katex.render(element.textContent, element, {
    displayMode: element.classList.contains("metric-formula"),
    throwOnError: false
  });
});
