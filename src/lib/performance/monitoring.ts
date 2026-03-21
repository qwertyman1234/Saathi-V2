/**
 * Performance Monitoring & Analytics
 * Track Core Web Vitals and user experience metrics
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number; // Largest Contentful Paint (< 2.5s)
  FID: number; // First Input Delay (< 100ms)
  CLS: number; // Cumulative Layout Shift (< 0.1)

  // Additional
  FCP: number; // First Contentful Paint (< 1.8s)
  TTFB: number; // Time to First Byte (< 600ms)
  TBT: number; // Total Blocking Time (< 300ms)
  INP: number; // Interaction to Next Paint (< 200ms)

  // Custom
  pageLoadTime: number;
  apiLatency: number;
  memoryCost: number;
}

/**
 * Initialize performance monitoring with Web Vitals
 */
export function initializePerformanceMonitoring() {
  // Dynamically import web-vitals to avoid blocking load
  import("web-vitals").then((webVitals: any) => {
    // Capture Core Web Vitals - handle different versions
    const { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } = webVitals;

    if (getCLS) getCLS(handleMetric);
    if (getLCP) getLCP(handleMetric);
    if (getFCP) getFCP(handleMetric);
    if (getTTFB) getTTFB(handleMetric);
    if (getFID) getFID(handleMetric);
    if (getINP) getINP(handleMetric);

    // Custom performance observer
    observeResourceTiming();
    observeNavigationTiming();
  });
}

/**
 * Handle metric callback
 */
function handleMetric(metric: any) {
  const perfData = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
  };

  // Send to analytics
  sendMetricToAnalytics(perfData);

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[${metric.name}]: ${metric.value.toFixed(2)}`);
  }
}

/**
 * Observe resource timing (API calls, assets)
 */
function observeResourceTiming() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes("/api/")) {
        const resourceEntry = entry as PerformanceResourceTiming;
        const latency = resourceEntry.responseEnd - resourceEntry.requestStart;
        sendMetricToAnalytics({
          name: "api_latency",
          value: latency,
          resource: entry.name,
        });
      }
    }
  });

  observer.observe({ entryTypes: ["resource"] });
}

/**
 * Observe navigation timing
 */
function observeNavigationTiming() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const navTiming = entry as PerformanceNavigationTiming;

      // Page load time
      const pageLoadTime = navTiming.loadEventEnd - navTiming.fetchStart;

      // DOM ready time
      const domReadyTime = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;

      sendMetricToAnalytics({
        name: "page_load",
        pageLoadTime,
        domReadyTime,
        dnsTime: navTiming.domainLookupEnd - navTiming.domainLookupStart,
        tcpTime: navTiming.connectEnd - navTiming.connectStart,
        ttfb: navTiming.responseStart - navTiming.fetchStart,
      });
    }
  });

  observer.observe({ entryTypes: ["navigation"] });
}

/**
 * Send metrics to analytics service (Google Analytics, Sentry, etc)
 */
function sendMetricToAnalytics(data: any) {
  // Send to Google Analytics
  if (window.gtag) {
    window.gtag("event", "performance_metric", data);
  }

  // Send to Sentry
  if (window.Sentry) {
    window.Sentry.captureMessage(`Performance: ${data.name}`, "info", {
      contexts: { performance: data },
    });
  }

  // Send to custom endpoint
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    navigator.sendBeacon(import.meta.env.VITE_ANALYTICS_ENDPOINT, JSON.stringify(data));
  }
}

/**
 * Mark and measure custom operations
 */
export function recordOperation(operationName: string, operation: () => Promise<any>) {
  return async () => {
    const startMark = `${operationName}-start`;
    const endMark = `${operationName}-end`;
    const measureName = `${operationName}`;

    performance.mark(startMark);

    try {
      const result = await operation();
      return result;
    } finally {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);

      const measure = performance.getEntriesByName(measureName)[0];
      sendMetricToAnalytics({
        name: operationName,
        duration: measure.duration,
      });
    }
  };
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): Partial<PerformanceMetrics> {
  const paint = performance.getEntriesByType("paint");
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

  return {
    FCP: paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0,
    TTFB: navigation?.responseStart - navigation?.fetchStart || 0,
    pageLoadTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
  };
}

/**
 * Log slow API calls
 */
export function logSlowAPI(name: string, duration: number, threshold: number = 1000) {
  if (duration > threshold) {
    console.warn(`Slow API detected: ${name} took ${duration}ms (threshold: ${threshold}ms)`);

    // Send to error tracking
    if (window.Sentry) {
      window.Sentry.captureMessage(`Slow API: ${name}`, "warning", {
        contexts: { api: { duration, threshold } },
      });
    }
  }
}

/**
 * Memory usage monitoring (if available)
 */
export function monitorMemoryUsage() {
  if ((performance as any).memory) {
    const mem = (performance as any).memory;
    const usagePercent = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;

    if (usagePercent > 80) {
      console.warn(`High memory usage: ${usagePercent.toFixed(2)}%`);
    }

    sendMetricToAnalytics({
      name: "memory_usage",
      usagePercent,
      usedJSHeapSize: mem.usedJSHeapSize,
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
    });
  }
}

declare global {
  interface Window {
    gtag?: (event: string, name: string, data: any) => void;
    Sentry?: any;
  }
}
