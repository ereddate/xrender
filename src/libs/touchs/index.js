const MobilePxToRem = {
  install(XRender) {
    XRender.pxToRem = function (value, base) {
      const baseFontSize = base || 16;
      if (typeof value === "string" && value.endsWith("px")) {
        const pxValue = parseFloat(value);
        return `${pxValue / baseFontSize}rem`;
      }
      return value;
    };
  },
};

const EVENT_CONFIG = {
  TAP_DURATION: 300,
  TAP_THRESHOLD: 10,
  LONG_TAP_DURATION: 500,
  SWIPE_THRESHOLD: 50,
  PINCH_THRESHOLD: 10
};

const MobileEventsPlugin = {
  version: '1.0.0',
  
  install(XRender) {
    const isMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    };

    const createTapHandler = (elem, handler, isDesktop) => {
      let startTime, startX, startY;
      const startEvent = isDesktop ? 'mousedown' : 'touchstart';
      const endEvent = isDesktop ? 'mouseup' : 'touchend';

      elem.addEventListener(startEvent, (e) => {
        const point = isDesktop ? e : e.touches[0];
        startTime = Date.now();
        startX = point.clientX;
        startY = point.clientY;
      });

      elem.addEventListener(endEvent, (e) => {
        const endTime = Date.now();
        const point = isDesktop ? e : e.changedTouches[0];
        const endX = point.clientX;
        const endY = point.clientY;

        if (
          endTime - startTime < EVENT_CONFIG.TAP_DURATION &&
          Math.abs(endX - startX) < EVENT_CONFIG.TAP_THRESHOLD &&
          Math.abs(endY - startY) < EVENT_CONFIG.TAP_THRESHOLD
        ) {
          handler(e);
        }
      });
    };

    const createLongTapHandler = (elem, handler, isDesktop) => {
      let timeout;
      const startEvent = isDesktop ? 'mousedown' : 'touchstart';
      const endEvents = isDesktop ? ['mouseup', 'mouseleave'] : ['touchend', 'touchmove'];

      elem.addEventListener(startEvent, () => {
        timeout = setTimeout(() => handler(), EVENT_CONFIG.LONG_TAP_DURATION);
      });

      endEvents.forEach(event => {
        elem.addEventListener(event, () => clearTimeout(timeout));
      });
    };

    const createSwipeHandler = (elem, handler, isDesktop) => {
      let startX, startY;
      const startEvent = isDesktop ? 'mousedown' : 'touchstart';
      const endEvent = isDesktop ? 'mouseup' : 'touchend';

      elem.addEventListener(startEvent, (e) => {
        const point = isDesktop ? e : e.touches[0];
        startX = point.clientX;
        startY = point.clientY;
      });

      elem.addEventListener(endEvent, (e) => {
        const point = isDesktop ? e : e.changedTouches[0];
        const endX = point.clientX;
        const endY = point.clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        if (Math.abs(deltaX) > EVENT_CONFIG.SWIPE_THRESHOLD || Math.abs(deltaY) > EVENT_CONFIG.SWIPE_THRESHOLD) {
          handler({
            direction: Math.abs(deltaX) > Math.abs(deltaY)
              ? deltaX > 0 ? 'right' : 'left'
              : deltaY > 0 ? 'down' : 'up'
          });
        }
      });
    };

    const createPinchHandler = (elem, handler) => {
      let initialDistance;

      elem.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          initialDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      });

      elem.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
          const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );

          if (Math.abs(currentDistance - initialDistance) > EVENT_CONFIG.PINCH_THRESHOLD) {
            handler({ scale: currentDistance / initialDistance });
            initialDistance = currentDistance;
          }
        }
      });
    };

    const on = function (elem, eventName, handler) {
      const mobile = isMobile();

      switch (eventName) {
        case 'tap':
          createTapHandler(elem, handler, !mobile);
          break;
        case 'longTap':
          createLongTapHandler(elem, handler, !mobile);
          break;
        case 'swipe':
          createSwipeHandler(elem, handler, !mobile);
          break;
        case 'pinched':
          if (mobile) {
            createPinchHandler(elem, handler);
          } else {
            console.warn('pinched 事件不支持桌面端');
          }
          break;
        default:
          elem.addEventListener(eventName, handler);
      }
    };

    XRender.on = on;
  },
};

$ && $.use(MobileEventsPlugin).use(MobilePxToRem);

export { MobileEventsPlugin, MobilePxToRem };
export default MobileEventsPlugin;
