import { PrivBrowserApi } from '../preload/index';

declare global {
  interface Window {
    privbrowser: PrivBrowserApi;
  }
}
