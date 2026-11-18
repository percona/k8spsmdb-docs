// Opens Mermaid diagrams in GLightbox.
// Material renders the SVG inside a closed shadow root, so it is not visible
// to querySelector. Capture the root when it is attached, then move the live
// diagram into the lightbox so the drawing comes with it.
(function () {
  var observer = null;
  var lightboxOpen = false;
  var attachShadow = Element.prototype.attachShadow;

  Element.prototype.attachShadow = function (init) {
    var root = attachShadow.call(this, init);
    if (this.classList && this.classList.contains("mermaid")) {
      this.__diagramRoot = root;
    }
    return root;
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function diagramReady(diagram) {
    if (diagram.__diagramRoot && diagram.__diagramRoot.querySelector("svg")) return true;
    if (diagram.shadowRoot && diagram.shadowRoot.querySelector("svg")) return true;
    return !!diagram.querySelector("svg");
  }

  function button(label, zoom, ariaLabel) {
    var el = document.createElement("button");
    el.type = "button";
    el.dataset.zoom = zoom;
    el.textContent = label;
    el.setAttribute("aria-label", ariaLabel);
    return el;
  }

  function attachZoom(stage, diagram) {
    var scale = 1;
    var x = 0;
    var y = 0;
    var pointers = new Map();
    var pan = null;
    var pinch = null;

    function apply() {
      diagram.style.transform = "translate(" + x + "px, " + y + "px) scale(" + scale + ")";
      diagram.style.transformOrigin = "center center";
    }

    function zoomAt(clientX, clientY, next) {
      var rect = stage.getBoundingClientRect();
      var cx = clientX - (rect.left + rect.width / 2);
      var cy = clientY - (rect.top + rect.height / 2);
      next = clamp(next, 0.4, 8);
      var localX = (cx - x) / scale;
      var localY = (cy - y) / scale;
      scale = next;
      x = cx - localX * scale;
      y = cy - localY * scale;
      apply();
    }

    function zoomCenter(factor) {
      var rect = stage.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, scale * factor);
    }

    function reset() {
      scale = 1;
      x = 0;
      y = 0;
      apply();
    }

    stage.addEventListener("wheel", function (event) {
      event.preventDefault();
      var factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAt(event.clientX, event.clientY, scale * factor);
    }, { passive: false });

    stage.addEventListener("pointerdown", function (event) {
      if (event.target.closest(".diagram-zoom-toolbar")) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) {
        pan = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          originX: x,
          originY: y
        };
        stage.classList.add("is-dragging");
      } else if (pointers.size >= 2) {
        pan = null;
        var pts = Array.from(pointers.values());
        pinch = {
          distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
          scale: scale,
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2
        };
      }
      stage.setPointerCapture(event.pointerId);
    });

    stage.addEventListener("pointermove", function (event) {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pan && pan.id === event.pointerId && pointers.size === 1) {
        x = pan.originX + (event.clientX - pan.x);
        y = pan.originY + (event.clientY - pan.y);
        apply();
        return;
      }
      if (pinch && pointers.size >= 2) {
        var pts = Array.from(pointers.values());
        var distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        zoomAt(pinch.x, pinch.y, pinch.scale * (distance / pinch.distance));
      }
    });

    function endPointer(event) {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        pan = null;
        stage.classList.remove("is-dragging");
        return;
      }
      if (pointers.size === 1) {
        pointers.forEach(function (point, id) {
          pan = { id: id, x: point.x, y: point.y, originX: x, originY: y };
        });
      }
    }

    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);
    stage.addEventListener("dblclick", function (event) {
      if (event.target.closest(".diagram-zoom-toolbar")) return;
      event.preventDefault();
      reset();
    });

    stage.querySelector("[data-zoom='in']").addEventListener("click", function (event) {
      event.stopPropagation();
      zoomCenter(1.25);
    });
    stage.querySelector("[data-zoom='out']").addEventListener("click", function (event) {
      event.stopPropagation();
      zoomCenter(1 / 1.25);
    });
    stage.querySelector("[data-zoom='reset']").addEventListener("click", function (event) {
      event.stopPropagation();
      reset();
    });

    requestAnimationFrame(function () {
      var rect = stage.getBoundingClientRect();
      var box = diagram.getBoundingClientRect();
      if (!box.width || !box.height) return;
      var fit = Math.min((rect.width - 48) / box.width, (rect.height - 72) / box.height);
      if (fit > 0 && Math.abs(fit - 1) > 0.05) {
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, fit);
      }
    });
  }

  function openDiagram(diagram) {
    if (lightboxOpen || typeof GLightbox !== "function") return;
    if (!diagramReady(diagram) || !diagram.parentNode) return;

    var parent = diagram.parentNode;
    var marker = document.createComment("diagram-zoom");
    parent.insertBefore(marker, diagram);

    var previousStyle = diagram.getAttribute("style");
    var stage = document.createElement("div");
    stage.className = "diagram-zoom-stage";
    stage.appendChild(diagram);

    var toolbar = document.createElement("div");
    toolbar.className = "diagram-zoom-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Diagram zoom");
    var hint = document.createElement("span");
    hint.className = "diagram-zoom-hint";
    hint.textContent = "Scroll to zoom. Drag to move.";
    toolbar.appendChild(hint);
    toolbar.appendChild(button("+", "in", "Zoom in"));
    toolbar.appendChild(button("\u2212", "out", "Zoom out"));
    toolbar.appendChild(button("Reset", "reset", "Reset zoom"));
    stage.appendChild(toolbar);

    var restored = false;
    function restore() {
      if (restored) return;
      restored = true;
      diagram.style.transform = "";
      diagram.style.transformOrigin = "";
      if (previousStyle === null) diagram.removeAttribute("style");
      else diagram.setAttribute("style", previousStyle);
      if (marker.parentNode) marker.parentNode.insertBefore(diagram, marker);
      else if (parent) parent.appendChild(diagram);
      if (marker.parentNode) marker.parentNode.removeChild(marker);
      lightboxOpen = false;
    }

    lightboxOpen = true;
    try {
      var lightbox = GLightbox({
        elements: [{
          content: stage,
          width: "96vw",
          height: "92vh",
          draggable: false,
          zoomable: false
        }],
        touchNavigation: false,
        loop: false,
        draggable: false,
        zoomable: true,
        autoplayVideos: false
      });
      lightbox.on("open", function () {
        attachZoom(stage, diagram);
      });
      lightbox.on("close", restore);
      lightbox.open();
    } catch (error) {
      restore();
    }
  }

  function bind(diagram) {
    if (diagram.dataset.zoomBound === "true" || !diagramReady(diagram)) return;
    diagram.dataset.zoomBound = "true";
    diagram.classList.add("diagram-zoom");
    if (!diagram.hasAttribute("tabindex")) diagram.setAttribute("tabindex", "0");
    diagram.setAttribute("role", "button");
    diagram.setAttribute("title", "Zoom diagram");
    diagram.setAttribute("aria-label", "Zoom diagram");

    diagram.addEventListener("click", function (event) {
      var target = event.target && event.target.nodeType === 1 ? event.target : event.target.parentElement;
      if (target && target.closest && target.closest("a, button")) return;
      event.preventDefault();
      openDiagram(diagram);
    });
    diagram.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openDiagram(diagram);
    });
  }

  function scan() {
    document.querySelectorAll(".mermaid").forEach(bind);
  }

  var poll = null;

  function boot() {
    scan();
    if (observer) observer.disconnect();
    if (poll) clearInterval(poll);
    var root = document.querySelector(".md-content") || document.body;
    observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true });
    var tries = 0;
    poll = setInterval(function () {
      scan();
      tries += 1;
      var pending = document.querySelector(".mermaid:not([data-zoom-bound='true'])");
      if (tries > 40 || (!pending && tries > 4)) clearInterval(poll);
    }, 250);
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(boot);
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})();
