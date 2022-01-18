'use strict';

const BLOCK_DURATION = location.search.includes('test') ? 5 * 1000 : 5 * 60 * 1000;

const makeTimer = title => ({
  status: 'pending',
  elapsed: 0,
  total: BLOCK_DURATION,
  title
});

const DEFAULT_STATE = {
  status: 'initial',
  currentIndex: 0,
  timers: [makeTimer('SOUND'), makeTimer('PERFORMANCE'), makeTimer('ATTUNED Intonation'), makeTimer('RHYTHM'), makeTimer('KINETIC Integration'), makeTimer('PAUSE')]
};

function reducer(state, action) {
  switch (action.type) {
    case 'tick':
      return tickReducer(state, action);

    case 'control':
      return controlReducer(state, action);

    default:
      return state;
  }
}

function getCurrentTimer(state) {
  return state.timers[state.currentIndex];
}

function tickReducer(state, {
  delta
}) {
  const {
    status,
    currentIndex,
    timers
  } = state;
  if (status !== 'running') return state;
  const tickedState = updateState(state, timer => {
    const newElapsed = timer.elapsed + delta;
    return newElapsed < timer.total ? {
      elapsed: newElapsed
    } : {
      elapsed: timer.total,
      status: 'done'
    };
  }); // Timer still running.

  if (getCurrentTimer(tickedState).status === 'running') return tickedState; // Wait for next timer if possible.

  if (currentIndex < timers.length - 1) return updateState(tickedState, () => ({
    status: 'running'
  }), {
    status: 'running',
    currentIndex: currentIndex + 1
  }); // No next timer: end.

  return { ...tickedState,
    status: 'ended'
  };
}

function controlReducer(state, {
  control
}) {
  switch (control) {
    case 'start':
      return updateState(state, () => ({
        status: 'running'
      }), {
        status: 'running'
      });

    case 'pause':
      return updateState(state, undefined, {
        status: 'paused'
      });

    case 'resume':
      return updateState(state, undefined, {
        status: 'running'
      });

    case 'reset':
      return DEFAULT_STATE;

    default:
      return state;
  }
}

function updateState(state, timerUpdater, stateUpdate) {
  const updatedState = stateUpdate ? { ...state,
    ...stateUpdate
  } : state;
  const {
    timers,
    currentIndex
  } = updatedState;
  const currentTimer = getCurrentTimer(updatedState);
  const updatedTimer = timerUpdater ? { ...currentTimer,
    ...timerUpdater(currentTimer)
  } : currentTimer;
  const newTimers = timerUpdater ? [...timers.slice(0, currentIndex), updatedTimer, ...timers.slice(currentIndex + 1)] : timers;
  return { ...updatedState,
    timers: newTimers
  };
}

const SparkTimer = () => {
  const [state, dispatch] = React.useReducer(reducer, DEFAULT_STATE);
  const {
    timers,
    status,
    currentIndex
  } = state;
  const onControl = React.useCallback(control => dispatch({
    type: 'control',
    control
  }), []);
  const requestRef = React.useRef();
  const previousTimeRef = React.useRef();

  const animate = time => {
    if (previousTimeRef.current != undefined) {
      const delta = time - previousTimeRef.current;
      dispatch({
        type: 'tick',
        delta
      });
    }

    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // Make sure the effect runs only once

  return /*#__PURE__*/React.createElement("div", {
    className: "sparktimer"
  }, /*#__PURE__*/React.createElement(Header, null), /*#__PURE__*/React.createElement(Timers, {
    timers: timers,
    currentIndex: currentIndex,
    status: status
  }), /*#__PURE__*/React.createElement(Controls, {
    status: status,
    onControl: onControl
  }), /*#__PURE__*/React.createElement(Footer, null));
};

const Controls = ({
  status,
  onControl
}) => /*#__PURE__*/React.createElement("div", {
  className: "controls"
}, /*#__PURE__*/React.createElement(ControlButtons, {
  status: status,
  onControl: onControl
}));

const ControlButtons = ({
  status,
  onControl
}) => {
  switch (status) {
    case 'initial':
      return /*#__PURE__*/React.createElement("button", {
        className: "control",
        onClick: () => onControl('start')
      }, "Start");

    case 'running':
      return /*#__PURE__*/React.createElement("button", {
        className: "control",
        onClick: () => onControl('pause')
      }, "Stop");

    case 'waiting':
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        key: "resume",
        className: "control",
        onClick: () => onControl('resume')
      }, "Start next block"), ";", /*#__PURE__*/React.createElement("button", {
        key: "reset",
        className: "control",
        onClick: () => onControl('reset')
      }, "Reset"));

    case 'paused':
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        key: "resume",
        className: "control",
        onClick: () => onControl('resume')
      }, "Resume"), /*#__PURE__*/React.createElement("button", {
        key: "reset",
        className: "control",
        onClick: () => onControl('reset')
      }, "Reset"));

    case 'ended':
      return /*#__PURE__*/React.createElement("button", {
        className: "control",
        onClick: () => onControl('reset')
      }, "Reset");

    default:
      return null;
  }
};

const Header = () => /*#__PURE__*/React.createElement("div", {
  className: "header"
}, "\u26A1\uFE0F SPARK Practice Timer");

const Footer = () => /*#__PURE__*/React.createElement("div", {
  className: "footer"
}, "\u26A1\uFE0F ", /*#__PURE__*/React.createElement("a", {
  href: "http://sparkpractice.com",
  target: "_blank"
}, "www.sparkpractice.com"));

const Timers = ({
  timers,
  status
}) => /*#__PURE__*/React.createElement("div", {
  className: "timers"
}, timers.map(timer => /*#__PURE__*/React.createElement(Timer, {
  timer: timer,
  status: status,
  key: timer.title
})));

const Timer = ({
  timer,
  status
}) => /*#__PURE__*/React.createElement("div", {
  className: renderTimerClass(timer, status)
}, /*#__PURE__*/React.createElement("div", {
  className: "content"
}, /*#__PURE__*/React.createElement("div", {
  className: "title"
}, timer.title), timer.status === 'running' && status === 'running' && /*#__PURE__*/React.createElement("div", {
  className: "elapsed"
}, renderTimerRemaining(timer))), /*#__PURE__*/React.createElement("div", {
  className: "progress"
}, /*#__PURE__*/React.createElement("div", {
  className: "progress-bar",
  style: {
    width: computeProgress(timer)
  }
})));

function renderTimerClass(timer, globalStatus) {
  return globalStatus === 'initial' ? 'timer' : `timer ${timer.status}`;
}

function computeProgress(timer) {
  return `${100 * timer.elapsed / timer.total}%`;
}

function renderTimerRemaining(timer) {
  const remaining = Math.round((timer.total - timer.elapsed) / 1000);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining - minutes * 60);
  const secondsStr = seconds < 10 ? `0${seconds}` : seconds.toString();
  return minutes === 0 ? `${seconds}s` : `${minutes}:${secondsStr}`;
}

const domContainer = document.querySelector('#sparktimer-container');
ReactDOM.render(React.createElement(SparkTimer), domContainer);