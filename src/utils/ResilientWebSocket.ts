/**
 * Robust Auto-Reconnecting WebSocket Class with Exponential Backoff
 * Drop connection hone par automatic reconnect karta hai aur task crash hone se bachata hai.
 * Complies with Pdfsun.in Enterprise Real-Time Architecture.
 */

export type WebSocketEventListener = (event: any) => void;

export class ResilientWebSocket {
  public url: string;
  public protocols: string | string[];
  public ws: WebSocket | null = null;

  // Auto-reconnect configurations
  public maxReconnectAttempts: number = 10;
  public reconnectAttempt: number = 0;
  public baseDelay: number = 1000; // 1 second
  public maxDelay: number = 30000; // 30 seconds

  public isExplicitlyClosed: boolean = false;
  private eventListeners: Map<string, WebSocketEventListener[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string, protocols: string | string[] = []) {
    this.url = url;
    this.protocols = protocols;
    this.connect();
  }

  public connect(): void {
    this.isExplicitlyClosed = false;

    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      return;
    }

    try {
      this.ws = new WebSocket(this.url, this.protocols);
      this.attachEventListeners();
    } catch {
      this.handleReconnect();
    }
  }

  private attachEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = (event: Event) => {
      console.log("[Pdfsun WS] Connection established successfully.");
      this.reconnectAttempt = 0; // Reset attempts on successful connection
      this.triggerEvent("open", event);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.triggerEvent("message", event);
    };

    this.ws.onerror = (error: Event) => {
      console.warn("[Pdfsun WS] Socket encountered an error:", error);
      this.triggerEvent("error", error);
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.triggerEvent("close", event);

      // Attempt reconnect only if close was not initiated intentionally
      if (!this.isExplicitlyClosed) {
        this.handleReconnect();
      }
    };
  }

  private handleReconnect(): void {
    if (this.isExplicitlyClosed) return;

    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      console.error("[Pdfsun WS] Max reconnection limit reached. Giving up.");
      return;
    }

    this.reconnectAttempt++;

    // Calculate Exponential Backoff Delay with Jitter
    const delay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(2, this.reconnectAttempt) + Math.random() * 1000
    );

    console.log(
      `[Pdfsun WS] Reconnecting in ${(delay / 1000).toFixed(1)} seconds... (Attempt ${this.reconnectAttempt})`
    );

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }

  // Event Subscription System
  public on(eventType: string, callback: WebSocketEventListener): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);

    // Return unbind handler
    return () => {
      this.off(eventType, callback);
    };
  }

  public off(eventType: string, callback: WebSocketEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      this.eventListeners.set(
        eventType,
        listeners.filter((cb) => cb !== callback)
      );
    }
  }

  public triggerEvent(eventType: string, eventData: any): void {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType)!.forEach((callback) => {
        try {
          callback(eventData);
        } catch (cbErr) {
          console.warn(`[Pdfsun WS] Error in ${eventType} handler:`, cbErr);
        }
      });
    }
  }

  // Safe Send Method
  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.warn("[Pdfsun WS] Cannot send data. Socket is not OPEN.");
    }
  }

  // Explicit Close
  public close(code: number = 1000, reason: string = "Client closed connection"): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close(code, reason);
      } catch {
        // ignore close errors
      }
      this.ws = null;
    }
  }

  public get readyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}
