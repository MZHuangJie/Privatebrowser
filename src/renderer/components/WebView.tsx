import React, { useRef, useEffect } from 'react';
import './WebView.css';

interface Props {
  tabId: string;
  src: string;
  partition: string;
  active: boolean;
  preloadPath: string;
  onTitleChange: (title: string) => void;
  onFaviconChange: (favicon: string) => void;
  onUrlChange: (url: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onNavigateStateChange: (canBack: boolean, canForward: boolean) => void;
  onNewWindow: (url: string) => void;
}

export interface WebViewHandle {
  loadURL: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
}

const WebViewComponent = React.forwardRef<WebViewHandle, Props>(function WebViewComponent(props, ref) {
  const { tabId, src, partition, active, preloadPath, onTitleChange, onFaviconChange, onUrlChange, onLoadingChange, onNavigateStateChange, onNewWindow } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const wvRef = useRef<any>(null);
  const listenersRef = useRef<[string, EventListener][]>([]);

  // Create webview element
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wv = document.createElement('webview') as any;
    wv.setAttribute('partition', partition);
    if (src) {
      wv.setAttribute('src', src);
    }
    wv.setAttribute('allowpopups', '');
    wv.style.width = '100%';
    wv.style.height = '100%';

    // Set preload via property (not attribute)
    if (preloadPath) {
      try { wv.setAttribute('preload', preloadPath); } catch(e) {}
    }

    // Attach listeners
    const add = (event: string, handler: EventListener) => {
      wv.addEventListener(event, handler);
      listenersRef.current.push([event, handler]);
    };

    add('did-start-loading', () => onLoadingChange(true));

    add('did-stop-loading', () => {
      onLoadingChange(false);
      try { onUrlChange(wv.getURL()); onNavigateStateChange(wv.canGoBack(), wv.canGoForward()); } catch(e) {}
    });

    add('page-title-updated', (e: any) => { if (e.title) onTitleChange(e.title); });

    add('page-favicon-updated', (e: any) => { if (e.favicons?.length) onFaviconChange(e.favicons[0]); });

    add('did-navigate', (e: any) => onUrlChange(e.url));

    add('did-navigate-in-page', (e: any) => {
      if (e.isMainFrame) { onUrlChange(e.url); onNavigateStateChange(wv.canGoBack(), wv.canGoForward()); }
    });

    // Handle new window requests
    wv.addEventListener('new-window', (e: any) => {
      onNewWindow(e.url);
    });
    listenersRef.current.push(['new-window', () => {}]);

    wvRef.current = wv;
    container.appendChild(wv);

    return () => {
      // Cleanup listeners
      for (const [event, handler] of listenersRef.current) {
        wv.removeEventListener(event, handler);
      }
      listenersRef.current = [];
      if (wv.parentNode) wv.parentNode.removeChild(wv);
      wvRef.current = null;
    };
  }, [tabId]); // recreate on tabId change

  // Handle src changes
  useEffect(() => {
    const wv = wvRef.current;
    if (wv && src && wv.getAttribute('src') !== src) {
      try { wv.loadURL(src); } catch(e) {}
    }
  }, [src]);

  // Handle active state
  useEffect(() => {
    if (wvRef.current) {
      wvRef.current.style.display = active ? 'flex' : 'none';
    }
  }, [active]);

  React.useImperativeHandle(ref, () => ({
    loadURL: (url: string) => { try { wvRef.current?.loadURL(url); } catch(e) {} },
    goBack: () => { try { wvRef.current?.goBack(); } catch(e) {} },
    goForward: () => { try { wvRef.current?.goForward(); } catch(e) {} },
    reload: () => { try { wvRef.current?.reload(); } catch(e) {} },
    stop: () => { try { wvRef.current?.stop(); } catch(e) {} },
  }), []);

  return <div ref={containerRef} className={`webview-container ${active ? 'active' : ''}`} data-tab-id={tabId} />;
});

export default WebViewComponent;
