import { NgModule } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS, patchDocument } from './index';

export function customElementFactory(doc: Document) {
  console.log("CUSTOM ELEMENTS FACTORY CALLED");
  if (!(doc as any).__ce__) {
    patchDocument(doc);
  }
  return (doc as any).__ce__;
}

@NgModule({
  providers: [{
    provide: CUSTOM_ELEMENTS,
    useFactory: customElementFactory,
    deps: [DOCUMENT],
  }],
})
export class CustomElementsServerModule { }
