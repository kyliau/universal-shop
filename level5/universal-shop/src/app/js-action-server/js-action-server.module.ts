import { NgModule, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { Injectable } from '@angular/core';
import { EVENT_MANAGER_PLUGINS, EventManager, ɵgetDOM } from '@angular/platform-browser';

export abstract class EventManagerPlugin {
  constructor(private _doc: any) { }

  // TODO(issue/24571): remove '!'.
  manager !: EventManager;

  abstract supports(eventName: string): boolean;

  abstract addEventListener(element: HTMLElement, eventName: string, handler: Function): Function;

  addGlobalEventListener(element: string, eventName: string, handler: Function): Function {
    const target: HTMLElement = ɵgetDOM().getGlobalEventTarget(this._doc, element);
    if (!target) {
      throw new Error(`Unsupported event target ${target} for event ${eventName}`);
    }
    return this.addEventListener(target, eventName, handler);
  }
}

/**
 * An 'EventManager' plugin that sets up JsAction attributes on the server so
 * that they can be buffered till the client code bootstraps.
 */
@Injectable()
export class JsActionServerPlugin extends EventManagerPlugin {
  static ACTION_PREFIX = 'ng.';
  private counter = 0;

  constructor(@Inject(DOCUMENT) doc: {}) {
    super(doc);
  }

  /**
   * Return 'true' for events that are supported by this plugin.
   */
  supports(eventName: string) {
    // Only support click events for now
    return eventName === 'click';
  }

  /**
   * Add an event handler for the given 'element'.
   * This plugin adds a 'jsaction' attribute on the server instead of actually
   * setting up an event handler.
   */
  addEventListener(element: HTMLElement) {
    if (element.tagName === 'A') {
      // Clicks on all anchor elements will be intercepted by the global handler
      // that will decide what to do with it.
      element.setAttribute('jsaction', this.addPrefix('anchor'));
    } else {
      this.counter++;
      element.setAttribute('jsaction', this.addPrefix(`js${this.counter}`));
    }
    // no-op cancellation callback.
    return () => { };
  }

  private addPrefix(value: string) {
    return `${JsActionServerPlugin.ACTION_PREFIX}${value}`;
  }
}


@NgModule({
  providers: [
    {
      provide: EVENT_MANAGER_PLUGINS,
      useClass: JsActionServerPlugin,
      multi: true,
    },
  ],
})
export class JsActionServerModule { }
