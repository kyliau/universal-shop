import { JsActionServerModule } from './js-action-server.module';

describe('JsActionServerModule', () => {
  let jsActionServerModule: JsActionServerModule;

  beforeEach(() => {
    jsActionServerModule = new JsActionServerModule();
  });

  it('should create an instance', () => {
    expect(jsActionServerModule).toBeTruthy();
  });
});
