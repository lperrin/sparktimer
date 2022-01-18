'use strict';

const BLOCK_DURATION = location.search.includes('test') ? 5 * 1000 : 5 * 60 * 1000;

const makeTimer = (title) => ({
  status: 'pending',
  elapsed: 0,
  total: BLOCK_DURATION,
  title
});

const DEFAULT_STATE = {
  status: 'initial',
  currentIndex: 0,
  timers: [
    makeTimer('SOUND'),
    makeTimer('PERFORMANCE'),
    makeTimer('ATTUNED Intonation'),
    makeTimer('RHYTHM'),
    makeTimer('KINETIC Integration'),
    makeTimer('PAUSE')
  ]
}

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

function tickReducer(state, {delta}) {
  const {status, currentIndex, timers} = state;

  if (status !== 'running')
    return state;

  const tickedState = updateState(state, timer => {
    const newElapsed = timer.elapsed + delta;

    return newElapsed < timer.total
      ? {elapsed: newElapsed}
      : {elapsed: timer.total, status: 'done'};
  });

  // Timer still running.
  if (getCurrentTimer(tickedState).status === 'running')
    return tickedState;

  // Wait for next timer if possible.
  if (currentIndex < timers.length - 1)
  return updateState(
    tickedState,
    () => ({status: 'running'}),
    {status: 'running', currentIndex: currentIndex + 1}
  );

  // No next timer: end.
  return {
    ...tickedState,
    status: 'ended'
  };
}

function controlReducer(state, {control}) {
  switch (control) {
    case 'start':
      return updateState(state, () => ({status: 'running'}), {status: 'running'});

    case 'pause':
      return updateState(state, undefined, {status: 'paused'});

    case 'resume':
      return updateState(state, undefined, {status: 'running'});

    case 'reset':
      return DEFAULT_STATE;

    default:
      return state;
  }
}

function updateState(state, timerUpdater, stateUpdate) {
  const updatedState = stateUpdate ? {...state, ...stateUpdate} : state;
  const {timers, currentIndex} = updatedState;

  const currentTimer = getCurrentTimer(updatedState);
  const updatedTimer = timerUpdater ? {...currentTimer, ...timerUpdater(currentTimer)} : currentTimer;

  const newTimers = timerUpdater ? [
    ...timers.slice(0, currentIndex),
    updatedTimer,
    ...timers.slice(currentIndex + 1)
  ] : timers;

  return {
    ...updatedState,
    timers: newTimers,
  };
}

const SparkTimer = () => {
  const [state, dispatch] = React.useReducer(reducer, DEFAULT_STATE);
  const {timers, status, currentIndex} = state;

  const onControl = React.useCallback((control) => dispatch({type: 'control', control}), []);

  const requestRef = React.useRef();
  const previousTimeRef = React.useRef();

  const animate = time => {
    if (previousTimeRef.current != undefined) {
      const delta = time - previousTimeRef.current;
      dispatch({type: 'tick', delta});
    }

    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // Make sure the effect runs only once

  return (
    <div className="sparktimer">
      <Header />
      <Timers timers={timers} currentIndex={currentIndex} status={status} />
      <Controls status={status} onControl={onControl} />
      <Footer />
    </div>
  );
};

const Controls = ({status, onControl}) => (
  <div className="controls"><ControlButtons status={status} onControl={onControl} /></div>
);

const ControlButtons = ({status, onControl}) => {
  switch (status) {
    case 'initial':
      return <button className="control" onClick={() => onControl('start')}>Start</button>;

    case 'running':
      return <button className="control" onClick={() => onControl('pause')}>Stop</button>;

    case 'waiting':
      return (
        <React.Fragment>
          <button key="resume" className="control" onClick={() => onControl('resume')}>Start next block</button>;
          <button key="reset" className="control" onClick={() => onControl('reset')}>Reset</button>
        </React.Fragment>
        );


    case 'paused':
      return (
        <React.Fragment>
          <button key="resume" className="control" onClick={() => onControl('resume')}>Resume</button>
          <button key="reset" className="control" onClick={() => onControl('reset')}>Reset</button>
        </React.Fragment>
      );

    case 'ended':
      return <button className="control" onClick={() => onControl('reset')}>Reset</button>;

    default:
      return null;
  }
};

const Header = () => (
  <div className="header">
    ⚡️ SPARK Practice Timer
  </div>
);

const Footer = () => (
  <div className="footer">
    ⚡️ <a href="http://sparkpractice.com" target="_blank">www.sparkpractice.com</a>
  </div>
)

const Timers = ({timers, status}) => (
  <div className="timers">
    {timers.map((timer) => <Timer timer={timer} status={status} key={timer.title} />)}
  </div>
);

const Timer = ({timer, status}) => (
  <div className={renderTimerClass(timer, status)}>
    <div className="content">
      <div className="title">{timer.title}</div>
      {timer.status === 'running' && status === 'running' && <div className="elapsed">{renderTimerRemaining(timer)}</div>}
    </div>
    <div className="progress">
      <div className="progress-bar" style={{width: computeProgress(timer)}} />
    </div>
  </div>
)

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