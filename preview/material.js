// Material ripple: a ring of the content color spreads from where you touch.
;(function () {
  const RIPPLE = "button.btn, button.chip, button.icon-btn, button.dock-btn, button.family, button.listen-btn, button.mic, button.mini, button.looper-new"
  document.addEventListener("pointerdown", (event) => {
    const host = event.target.closest?.(RIPPLE)
    if (!host || host.disabled) return
    const target = host.matches("button.dock-btn") ? host.querySelector(".nav-pill") || host : host
    const box = target.getBoundingClientRect()
    const size = Math.max(box.width, box.height) * 2.2
    const dot = document.createElement("span")
    dot.className = "md-ripple"
    dot.style.width = dot.style.height = `${size}px`
    dot.style.left = `${event.clientX - box.left - size / 2}px`
    dot.style.top = `${event.clientY - box.top - size / 2}px`
    target.appendChild(dot)
    dot.addEventListener("animationend", () => dot.remove())
  }, { passive: true })
})()
