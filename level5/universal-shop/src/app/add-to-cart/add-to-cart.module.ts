import { NgModule, Injector, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createCustomElement, NgElementConstructor } from '@angular/elements';
import { AddToCartComponent } from './add-to-cart.component';
import { CartBadgeComponent } from './cart-badge.component';
import { MatBadgeModule } from '@angular/material/badge';
import { getDispatcher } from '../js-action-server';

class JsActionCustomElement extends HTMLElement {
  connectedCallback(): void {}
}

function wrapJsAction(ngElementCtor: NgElementConstructor<{}>) {
  // Define a new class that extends NgElement
  return class JsActionNgElement extends (ngElementCtor as {} as typeof JsActionCustomElement) {
    static readonly['observedAttributes'] = (ngElementCtor as any)['observedAttributes'];
    private jsActionToNodePaths: Map<string, number[]>;

    connectedCallback() {
      // If using the document-register-elements polyfill the constructor might
      // not have been called before connectedCallback.
      if (!this.jsActionToNodePaths) {
        this.jsActionToNodePaths = new Map();
      }
      this.saveJsActionNodePaths();
      // bootstrap the actual Angular Element
      super.connectedCallback();
      this.replayJsActionEvents();
      this.unregisterJsActionHandlers();
    }

    private saveJsActionNodePaths() {
      const jsActionNodes = Array.from(this.querySelectorAll('[jsaction]'));
      for (const node of jsActionNodes) {
        const jsActionHandler = node.getAttribute('jsaction');
        if (jsActionHandler.startsWith('ng.js')) {
          // Remove 'ng.' prefix
          const handler = jsActionHandler.substr(3);
          this.jsActionToNodePaths.set(handler, this.getNodePath(node));
        }
      }
    }

    private replayJsActionEvents() {
      const dispatcher = getDispatcher();
      if (!dispatcher) {
        throw new Error('Dispatcher has not been initialized.');
      }
      const actionsMap = new Map<string, () => void>();
      for (const [action, nodePath] of this.jsActionToNodePaths) {
        const node = this.getNode(nodePath);
        if (!node || !(node instanceof HTMLElement)) {
          continue;
        }
        actionsMap.set(action, () => node.click());
      }

      // Register handlers for the jsActions seen on this component.
      // Will replay any buffered events.
      dispatcher.registerHandlers(
        'ng', // the namespace
        null, // handler object
        actionsMap,
      );
    }

    private unregisterJsActionHandlers() {
      Promise.resolve().then(() => {
        const dispatcher = getDispatcher();
        const actions = this.jsActionToNodePaths.keys();
        for (const action of actions) {
          dispatcher.unregisterHandler('ng', action);
        }
      });
    }

    private getNodePath(node: Element) {
      const root = this;
      const paths = [];  // path from node -> root
      while (node && node !== root) {
        let index = 0;
        const parent = node.parentElement;
        if (parent) {
          index = Array.from(parent.children).indexOf(node);
        }
        paths.push(index);
        node = parent;
      }
      // Reverse the paths, so it's from root -> node
      return paths;
    }

    private getNode(nodePath: number[]) {
      let node: Element = this;
      for (let i = 0; i < nodePath.length && node; ++i) {
        const index = nodePath[i];
        node = node.children.item(index);
      }
      return node;
    }
  }
}

@NgModule({
  imports: [
    CommonModule,
    MatBadgeModule,
  ],
  declarations: [AddToCartComponent, CartBadgeComponent],
  entryComponents: [AddToCartComponent, CartBadgeComponent],
})
export class AddToCartModule {
  constructor(injector: Injector) {
    console.log("ADD TO CART MODULE CONSTRUCTOR CALLED")
    const components = {
      'add-to-cart': AddToCartComponent,
      'cart-badge': CartBadgeComponent,
    };
    const isBrowserEnv = !!window;
    const isDispatcherInitialized = !!getDispatcher();
    console.error(`browser? ${isBrowserEnv}, dispatcher? ${isDispatcherInitialized}`);
    for (const tagName of Object.keys(components)) {
      const comp = components[tagName];
      // Wrap the Component in NgElement
      const ngElementCtor = createCustomElement(comp, { injector });
      // Now wire up JS Action hooks to the NgElement
      // ... but only do this on the browser and when the dispatcher
      // (i.e. the event contract) is initialized.
      if (isBrowserEnv && isDispatcherInitialized) {
        customElements.define(tagName, wrapJsAction(ngElementCtor));
      } else {
        customElements.define(tagName, ngElementCtor);
      }
    }
  }
}
