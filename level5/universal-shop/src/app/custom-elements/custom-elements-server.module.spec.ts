import { CustomElementsServerModule } from './custom-elements-server.module';

describe('CustomElementsServerModule', () => {
  let customElementsServerModule: CustomElementsServerModule;

  beforeEach(() => {
    customElementsServerModule = new CustomElementsServerModule();
  });

  it('should create an instance', () => {
    expect(customElementsServerModule).toBeTruthy();
  });
});
