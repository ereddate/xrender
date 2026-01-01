const customDirectives = {
  model: {
    bind(el, binding, vm) {
      if (vm && vm.data) {
        const value = binding.value;
        const updateEvent = el.type === "checkbox" ? "change" : "input";
        const prop = el.type === "checkbox" ? "checked" : "value";
        el[prop] = vm.data[value];
        el.addEventListener(updateEvent, (e) => {
          vm.data[value] = el[prop];
        });
      }
    },
    update(el, binding, vm) {
      if (vm && vm.data) {
        const value = binding.value;
        const prop = el.type === "checkbox" ? "checked" : "value";
        el[prop] = vm.data[value];
      }
    },
  },
  show: {
    bind(el, binding, vm) {
      if (vm && vm.data) {
        el.style.display = vm.data[binding.value] ? "" : "none";
      }
    },
    update(el, binding, vm) {
      if (vm && vm.data) {
        el.style.display = vm.data[binding.value] ? "" : "none";
      }
    },
  },
  if: {
    bind(el, binding, vm) {
      if (vm && vm.data) {
        const condition = vm.data[binding.value];
        el.style.display = condition ? "" : "none";
      }
    },
    update(el, binding, vm) {
      if (vm && vm.data) {
        const condition = vm.data[binding.value];
        el.style.display = condition ? "" : "none";
      }
    },
  },
  html: {
    bind(el, binding, vm) {
      if (vm && vm.data) {
        el.innerHTML = vm.data[binding.value];
      }
    },
    update(el, binding, vm) {
      if (vm && vm.data) {
        el.innerHTML = vm.data[binding.value];
      }
    },
  },
  text: {
    bind(el, binding, vm) {
      if (vm && vm.data) {
        el.textContent = vm.data[binding.value];
      }
    },
    update(el, binding, vm) {
      if (vm && vm.data) {
        el.textContent = vm.data[binding.value];
      }
    },
  },
  on: {
    bind(el, binding, vm) {
      if (vm && vm.methods) {
        const eventName = binding.arg;
        const handler = vm.methods[binding.value];
        el.addEventListener(eventName, handler.bind(vm));
      }
    },
    unbind(el, binding, vm) {
      if (vm && vm.methods) {
        const eventName = binding.arg;
        const handler = vm.methods[binding.value];
        el.removeEventListener(eventName, handler.bind(vm));
      }
    },
  },
  debounce: {
    bind(el, binding, vm) {
      let timer;
      const [eventName, delay = 300] = binding.arg.split(":");
      const handler = vm.methods[binding.value];
      el.addEventListener(eventName, () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          handler.call(vm);
        }, parseInt(delay));
      });
    },
  },
  focus: {
    inserted(el, binding, vm) {
      if (binding.value) {
        el.focus();
      }
    },
  },
  pre: {
    bind(el, binding, vm) {
      el.setAttribute("v-pre", "");
    },
  },
  cloak: {
    bind(el, binding, vm) {
      el.style.display = "none";
    },
    inserted(el, binding, vm) {
      el.style.display = "";
    },
  },
  once: {
    bind(el, binding, vm) {
      el.setAttribute("v-once", "");
    },
  },
  for: {
    bind(el, binding, vm) {
      const [item, list] = binding.value.match(/(\w+)\s+in\s+(\w+)/).slice(1);
      const items = vm.data[list];
      const parent = el.parentNode;
      const fragment = document.createDocumentFragment();
      if (Array.isArray(items)) {
        items.forEach((value, index) => {
          const clone = el.cloneNode(true);
          vm.data[item] = value;
          vm.data["index"] = index;
          fragment.appendChild(clone);
        });
      } else if (typeof items === "object") {
        for (const key in items) {
          const clone = el.cloneNode(true);
          vm.data[item] = items[key];
          vm.data["key"] = key;
          fragment.appendChild(clone);
        }
      }
      parent.replaceChild(fragment, el);
    },
  },
  throttle: {
    bind(el, binding, vm) {
      let lastTime = 0;
      const [eventName, interval = 300] = binding.arg.split(":");
      const handler = vm.methods[binding.value];
      el.addEventListener(eventName, () => {
        const now = Date.now();
        if (now - lastTime >= parseInt(interval)) {
          handler.call(vm);
          lastTime = now;
        }
      });
    },
  },
  copy: {
    bind(el, binding, vm) {
      el.addEventListener("click", () => {
        const text = binding.value;
        copyToClipboard(text);
      });
    },
  },
  permission: {
    bind(el, binding, vm) {
      const requiredPermission = binding.value;
      const userPermissions = vm.data.userPermissions || [];
      if (!userPermissions.includes(requiredPermission) && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    },
  },
  drag: {
    bind(el, binding, vm) {
      el.style.cursor = "move";
      let isDragging = false;
      let offsetX, offsetY;

      el.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        el.style.userSelect = "none";
      });

      document.addEventListener("mousemove", (e) => {
        if (isDragging) {
          el.style.left = `${e.clientX - offsetX}px`;
          el.style.top = `${e.clientY - offsetY}px`;
        }
      });

      document.addEventListener("mouseup", () => {
        isDragging = false;
        el.style.userSelect = "";
      });
    },
  },
  hover: {
    bind(el, binding, vm) {
      const hoverClass = binding.value;
      el.addEventListener("mouseenter", () => {
        el.classList.add(hoverClass);
      });
      el.addEventListener("mouseleave", () => {
        el.classList.remove(hoverClass);
      });
    },
  },
  infiniteScroll: {
    bind(el, binding, vm) {
      const loadMore = vm.methods[binding.value];
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
          loadMore.call(vm);
        }
      };
      el.addEventListener("scroll", handleScroll);
      el.__infiniteScrollHandler = handleScroll;
    },
    unbind(el) {
      if (el.__infiniteScrollHandler) {
        el.removeEventListener("scroll", el.__infiniteScrollHandler);
        delete el.__infiniteScrollHandler;
      }
    },
  },
  tooltip: {
    bind(el, binding, vm) {
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = binding.value;
      tooltip.style.position = "absolute";
      tooltip.style.display = "none";
      document.body.appendChild(tooltip);

      el.addEventListener("mouseenter", () => {
        const rect = el.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom}px`;
        tooltip.style.display = "block";
      });

      el.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
    },
    unbind(el) {
      const tooltip = document.querySelector(".tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    },
  },
  lazy: {
    bind(el, binding, vm) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.src = binding.value;
            observer.unobserve(el);
          }
        });
      });
      observer.observe(el);
    },
  },
  ripple: {
    bind(el, binding, vm) {
      el.style.position = "relative";
      el.style.overflow = "hidden";

      el.addEventListener("click", (e) => {
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        el.appendChild(ripple);

        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.backgroundColor = binding.value || "rgba(0, 0, 0, 0.1)";

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    },
  },
  shake: {
    bind(el, binding, vm) {
      const shakeClass = "shake";
      const watcher = (vm.watch[binding.value] = function (newVal) {
        if (!newVal) {
          el.classList.add(shakeClass);
          setTimeout(() => {
            el.classList.remove(shakeClass);
          }, 500);
        }
      });
      watcher.call(vm, vm.data[binding.value]);
    },
    unbind(el, binding, vm) {
      if (vm && vm.watch && vm.watch[binding.value]) {
        delete vm.watch[binding.value];
      }
    },
  },
  clickOutside: {
    bind(el, binding, vm) {
      el.clickOutsideEvent = function (event) {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value.call(vm, event);
        }
      };
      document.body.addEventListener("click", el.clickOutsideEvent);
    },
    unbind(el) {
      document.body.removeEventListener("click", el.clickOutsideEvent);
    },
  },
  resize: {
    bind(el, binding, vm) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          binding.value.call(vm, entry.contentRect);
        }
      });
      observer.observe(el);
      el.resizeObserver = observer;
    },
    unbind(el) {
      if (el.resizeObserver) {
        el.resizeObserver.disconnect();
      }
    },
  },
  loading: {
    bind(el, binding, vm) {
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "loading";
      loadingDiv.style.display = "none";
      loadingDiv.textContent = "加载中...";
      el.appendChild(loadingDiv);
      el.loadingDiv = loadingDiv;
    },
    update(el, binding) {
      el.loadingDiv &&
        (el.loadingDiv.style.display = binding.value ? "block" : "none");
      el.style.pointerEvents = binding.value ? "none" : "auto";
    },
    unbind(el) {
      if (el.loadingDiv && el.contains(el.loadingDiv)) {
        el.removeChild(el.loadingDiv);
      }
    },
  },
  scrollTo: {
    bind(el, binding, vm) {
      el.addEventListener("click", () => {
        const target = document.querySelector(binding.value);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    },
  },
  ellipsis: {
    bind(el, binding) {
      el.style.overflow = "hidden";
      el.style.textOverflow = "ellipsis";
      el.style.whiteSpace = "nowrap";
      if (binding.arg === "multiline") {
        el.style.display = "-webkit-box";
        el.style.webkitBoxOrient = "vertical";
        el.style.webkitLineClamp = binding.value || 2;
        el.style.whiteSpace = "normal";
      }
    },
  },
  zoom: {
    bind(el, binding) {
      let scale = 1;
      const ZOOM_STEP = 0.1;

      el.style.transformOrigin = "center center";
      el.style.transition = "transform 0.3s ease";

      el.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        scale += delta * ZOOM_STEP;
        scale = Math.max(0.5, Math.min(3, scale));
        el.style.transform = `scale(${scale})`;
      });
    },
  },
  passwordStrength: {
    bind(el, binding, vm) {
      if (!el.parentNode) return;
      
      const strengthElement = document.createElement("div");
      strengthElement.className = "password-strength";
      el.parentNode.insertBefore(strengthElement, el.nextSibling);

      const calculateStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
      };

      const updateStrength = () => {
        const password = el.value;
        const strength = calculateStrength(password);
        let message;
        switch (strength) {
          case 0:
          case 1:
            message = "弱";
            strengthElement.style.color = "red";
            break;
          case 2:
          case 3:
            message = "中";
            strengthElement.style.color = "orange";
            break;
          case 4:
          case 5:
            message = "强";
            strengthElement.style.color = "green";
            break;
        }
        strengthElement.textContent = `密码强度: ${message}`;
      };

      el.addEventListener("input", updateStrength);
    },
    unbind(el) {
      if (el.parentNode) {
        const strengthElement = el.parentNode.querySelector(".password-strength");
        if (strengthElement) {
          strengthElement.remove();
        }
      }
    },
  },
  doubleClick: {
    bind(el, binding, vm) {
      let clickCount = 0;
      let timer;

      el.addEventListener("click", () => {
        clickCount++;
        if (clickCount === 1) {
          timer = setTimeout(() => {
            clickCount = 0;
          }, 300);
        } else if (clickCount === 2) {
          clearTimeout(timer);
          clickCount = 0;
          binding.value.call(vm);
        }
      });
    },
  },
  autoHeight: {
    bind(el) {
      el.style.overflow = "hidden";
      el.style.resize = "none";

      const adjustHeight = () => {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      };

      el.addEventListener("input", adjustHeight);
      adjustHeight();
    },
  },
  highlight: {
    bind(el, binding) {
      const updateHighlight = () => {
        const text = el.textContent;
        const keyword = binding.value;
        if (keyword) {
          const regex = new RegExp(`(${keyword})`, "gi");
          el.innerHTML = text.replace(
            regex,
            '<span class="highlight">$1</span>'
          );
        } else {
          el.textContent = text;
        }
      };

      updateHighlight();
    },
  },
  preventDefault: {
    bind(el, binding, vm) {
      const eventName = binding.arg || "submit";
      el.addEventListener(eventName, (e) => {
        e.preventDefault();
        if (binding.value) {
          binding.value.call(vm, e);
        }
      });
    },
  },
  visibilityChange: {
    bind(el, binding, vm) {
      const handleVisibilityChange = () => {
        binding.value.call(vm, document.hidden);
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      el._visibilityChangeHandler = handleVisibilityChange;
    },
    unbind(el) {
      if (el._visibilityChangeHandler) {
        document.removeEventListener("visibilitychange", el._visibilityChangeHandler);
        el._visibilityChangeHandler = null;
      }
    },
  },
  blur: {
    bind(el, binding, vm) {
      el.addEventListener("blur", () => {
        binding.value.call(vm, el.value);
      });
    },
  },
  enter: {
    bind(el, binding, vm) {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          binding.value.call(vm, el.value);
        }
      });
    },
  },
  maxlength: {
    bind(el, binding, vm) {
      const maxLength = parseInt(binding.value);
      el.addEventListener("input", (e) => {
        if (el.value.length > maxLength) {
          el.value = el.value.slice(0, maxLength);
          vm.data[binding.arg] = el.value;
        }
      });
    },
  },
  readonly: {
    bind(el, binding) {
      this.data && (el.readOnly = this.data[binding.value]);
    },
    update(el, binding) {
      this.data && (el.readOnly = this.data[binding.value]);
    },
  },
  disabled: {
    bind(el, binding) {
      this.data && (el.disabled = this.data[binding.value]);
    },
    update(el, binding) {
      this.data && (el.disabled = this.data[binding.value]);
    },
  },
  copyToClipboard: {
    bind(el, binding, vm) {
      el.addEventListener("click", () => {
        const text = el.textContent;
        copyToClipboard(text);
      });
    },
  },
  touchSwipe: {
    bind(el, binding, vm) {
      let startX, startY;
      const THRESHOLD = 50;

      el.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      });

      el.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > THRESHOLD) {
            binding.value.call(vm, "right");
          } else if (diffX < -THRESHOLD) {
            binding.value.call(vm, "left");
          }
        } else {
          if (diffY > THRESHOLD) {
            binding.value.call(vm, "down");
          } else if (diffY < -THRESHOLD) {
            binding.value.call(vm, "up");
          }
        }
      });
    },
  },
  draggable: {
    bind(el, binding, vm) {
      el.draggable = true;

      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", el.id);
        e.target.style.opacity = "0.5";
      });

      el.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      el.addEventListener("drop", (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        const draggedElement = document.getElementById(data);
        if (binding.value) {
          binding.value.call(vm, draggedElement, el);
        }
      });

      el.addEventListener("dragend", () => {
        el.style.opacity = "1";
      });
    },
  },
  localStorage: {
    bind(el, binding, vm) {
      const key = binding.value;
      const savedValue = localStorage.getItem(key);
      if (savedValue) {
        el.value = savedValue;
        vm.data[key] = savedValue;
      }

      el.addEventListener("input", (e) => {
        const value = e.target.value;
        localStorage.setItem(key, value);
        vm.data[key] = value;
      });
    },
  },
  class: {
    bind(el, binding, vm) {
      const updateClasses = (value) => {
        if (Array.isArray(value)) {
          value.forEach((cls) => el.classList.add(cls));
        } else if (typeof value === "object") {
          Object.entries(value).forEach(([cls, shouldAdd]) => {
            if (shouldAdd) {
              el.classList.add(cls);
            } else {
              el.classList.remove(cls);
            }
          });
        } else if (typeof value === "string") {
          value.split(" ").forEach((cls) => el.classList.add(cls));
        }
      };
      const initialValue =
        typeof binding.value === "string"
          ? vm.data[binding.value]
          : binding.value;
      updateClasses(initialValue);
      if (typeof binding.value === "string") {
        vm.watch[binding.value] = function (newVal, oldVal) {
          if (Array.isArray(oldVal)) {
            oldVal.forEach((cls) => el.classList.remove(cls));
          } else if (typeof oldVal === "object") {
            Object.keys(oldVal).forEach((cls) => el.classList.remove(cls));
          } else if (typeof oldVal === "string") {
            oldVal.split(" ").forEach((cls) => el.classList.remove(cls));
          }
          updateClasses(newVal);
        };
      }
    },
    update(el, binding, vm) {
      const value =
        typeof binding.value === "string"
          ? vm.data[binding.value]
          : binding.value;
      const updateClasses = (value) => {
        if (Array.isArray(value)) {
          value.forEach((cls) => el.classList.add(cls));
        } else if (typeof value === "object") {
          Object.entries(value).forEach(([cls, shouldAdd]) => {
            if (shouldAdd) {
              el.classList.add(cls);
            } else {
              el.classList.remove(cls);
            }
          });
        } else if (typeof value === "string") {
          value.split(" ").forEach((cls) => el.classList.add(cls));
        }
      };
      updateClasses(value);
    },
  },
  style: {
    bind(el, binding, vm) {
      const updateStyles = (value) => {
        if (typeof value === "object") {
          Object.entries(value).forEach(([styleName, styleVal]) => {
            el.style[styleName] = styleVal;
          });
        }
      };
      const initialValue =
        typeof binding.value === "string"
          ? vm.data[binding.value]
          : binding.value;
      updateStyles(initialValue);
      if (typeof binding.value === "string") {
        vm.watch[binding.value] = function (newVal) {
          updateStyles(newVal);
        };
      }
    },
    update(el, binding, vm) {
      const value =
        typeof binding.value === "string"
          ? vm.data[binding.value]
          : binding.value;
      if (typeof value === "object") {
        Object.entries(value).forEach(([styleName, styleVal]) => {
          el.style[styleName] = styleVal;
        });
      }
    },
  },
};

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("复制成功");
      })
      .catch((err) => {
        console.error("复制失败", err);
      });
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    console.log("复制成功");
  }
}

export default customDirectives;
