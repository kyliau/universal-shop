declare namespace jsaction {
  export class EventContract {
    addContainer(docElem: HTMLElement);
    addEvent(e: string);
    dispatchTo(fn: () => void);
  }

  export class Dispatcher {
    dispatch(e: EventInfo);
    setEventReplayer(fn: (q: EventInfo[], d: Dispatcher) => void);
    canDispatch(info: EventInfo): boolean;
    registerGlobalHandler(t: string, h: (e: Event) => boolean);
    unregisterGlobalHandler(t: string, h: (e: Event) => boolean);
    registerHandlers(ns: string, obj: {}, map: Map<string, () => void>);
    unregisterHandler(ns: string, name: string);
  }

  export interface EventInfo {
    action: string;
  }
}

let eventContract: jsaction.EventContract | null = null;

export function initEventContract() {
  eventContract = new jsaction.EventContract();
  eventContract.addContainer(window.document.documentElement);
  eventContract.addEvent('click');
}

let dispatcher: jsaction.Dispatcher | null = null;

/**
 * Get the Event contract in a lazy loaded module.
 * 'initEventContract' should have been called in the base module.
 */
export function getDispatcher(): jsaction.Dispatcher | null {
  if (!eventContract) {
    return null;
  }
  return dispatcher || initDispatcher();
}

export function cleanupDispatcherGlobalClickHandler() {
  if (dispatcher) {
    dispatcher.unregisterGlobalHandler('click', buttonClickHandler);
  }
}

function initDispatcher() {
  dispatcher = new jsaction.Dispatcher();
  eventContract.dispatchTo(dispatcher.dispatch.bind(dispatcher));
  dispatcher.setEventReplayer(replay);
  dispatcher.registerGlobalHandler('click', buttonClickHandler);
  return dispatcher;
}

// Register the event replayer when creating the dispatcher for the first
// time.
function replay(queue: jsaction.EventInfo[], dispatcher: jsaction.Dispatcher) {
  const dedupedEvents = new Map<string, jsaction.EventInfo>();
  let i = 0;
  for (let j = 0; j < queue.length; ++j) {
    const eventInfo = queue[j];
    // An event can only be replayed and removed from the queue if there's
    // an action registered to process it.
    if (dispatcher.canDispatch(eventInfo)) {
      dedupedEvents.set(eventInfo.action, eventInfo);
    } else {
      // Otherwise, leave the event in the queue for future event replaying.
      // e.g. when new actions are registered on the dispatcher.
      queue[i] = eventInfo;
      ++i;
    }
  }
  queue.splice(i);
  // Replay deduped click events.
  for (const eventInfo of dedupedEvents.values()) {
    dispatcher.dispatch(eventInfo);
  }
}

function buttonClickHandler(event: Event) {
  let target = event.target as Element || null;
  while (target) {
    // If an anchor appears in the path before other click targets, exit
    // without preventing default.
    if (target.tagName === 'A') {
      break;
    }
    // Prevent default if a non-anchor jsaction is in the path.
    if (target.hasAttribute && target.hasAttribute('jsaction')) {
      event.preventDefault();
      return false;
    }
    target = target.parentElement;
  }
  return true;
}