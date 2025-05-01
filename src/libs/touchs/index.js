const MobilePxToRem = {
  install(XRender) {
    XRender.pxToRem = function (value, base) {
      const baseFontSize = base || 16; // 默认基准字体大小为 16px
      if (typeof value === "string" && value.endsWith("px")) {
        const pxValue = parseFloat(value);
        return `${pxValue / baseFontSize}rem`;
      }
      return value;
    };
  },
};
// 新增移动端事件插件
const MobileEventsPlugin = {
  install(XRender) {
    // 设备检测函数
    const isMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    };
    const on = function (elem, eventName, handler) {
      if (isMobile()) {
        if (eventName === "tap") {
          // 处理 tap 事件
          let startTime, startX, startY;
          elem.addEventListener("touchstart", (e) => {
            startTime = Date.now();
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
          });
          elem.addEventListener("touchend", (e) => {
            const endTime = Date.now();
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            if (
              endTime - startTime < 300 &&
              Math.abs(endX - startX) < 10 &&
              Math.abs(endY - startY) < 10
            ) {
              handler(e);
            }
          });
        } else if (eventName === "longTap") {
          // 处理 longTap 事件
          let timeout;
          elem.addEventListener("touchstart", () => {
            timeout = setTimeout(() => handler(), 500);
          });
          elem.addEventListener("touchend", () => clearTimeout(timeout));
          elem.addEventListener("touchmove", () => clearTimeout(timeout));
        } else if (eventName === "swipe") {
          // 处理 swipe 事件
          let startX, startY;
          elem.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
          });
          elem.addEventListener("touchend", (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
              handler({
                direction:
                  Math.abs(deltaX) > Math.abs(deltaY)
                    ? deltaX > 0
                      ? "right"
                      : "left"
                    : deltaY > 0
                    ? "down"
                    : "up",
              });
            }
          });
        } else if (eventName === "pinched") {
          // 处理 pinched 事件
          let initialDistance;
          elem.addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) {
              initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
              );
            }
          });
          elem.addEventListener("touchmove", (e) => {
            if (e.touches.length === 2) {
              const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
              );
              if (Math.abs(currentDistance - initialDistance) > 10) {
                handler({ scale: currentDistance / initialDistance });
                initialDistance = currentDistance;
              }
            }
          });
        } else {
          // 默认事件处理
          elem.addEventListener(eventName, handler);
        }
      } else {
        // 桌面端事件处理
        if (eventName === "tap") {
          // 桌面端模拟 tap 事件（使用 click）
          elem.addEventListener("click", handler);
        } else if (eventName === "longTap") {
          // 桌面端模拟 longTap 事件（使用 mousedown 和 mouseup）
          let timeout;
          elem.addEventListener("mousedown", () => {
            timeout = setTimeout(() => handler(), 500);
          });
          elem.addEventListener("mouseup", () => clearTimeout(timeout));
          elem.addEventListener("mouseleave", () => clearTimeout(timeout));
        } else if (eventName === "swipe") {
          // 桌面端模拟 swipe 事件（使用 mousedown 和 mouseup）
          let startX, startY;
          elem.addEventListener("mousedown", (e) => {
            startX = e.clientX;
            startY = e.clientY;
          });
          elem.addEventListener("mouseup", (e) => {
            const endX = e.clientX;
            const endY = e.clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
              handler({
                direction:
                  Math.abs(deltaX) > Math.abs(deltaY)
                    ? deltaX > 0
                      ? "right"
                      : "left"
                    : deltaY > 0
                    ? "down"
                    : "up",
              });
            }
          });
        } else if (eventName === "pinched") {
          // 桌面端不支持 pinched 事件
          console.warn("pinched 事件不支持桌面端");
        } else {
          // 默认事件处理
          elem.addEventListener(eventName, handler);
        }
      }
    };

    // 覆盖默认的 on 方法
    XRender.on = on;
  },
};
$ && $.use(MobileEventsPlugin).use(MobilePxToRem); // 使用插件
