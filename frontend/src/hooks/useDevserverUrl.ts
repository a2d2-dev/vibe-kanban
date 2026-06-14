import { useEffect, useRef, useState } from 'react';
import { stripAnsi } from 'fancy-ansi';

const urlPatterns = [
  /(https?:\/\/(?:\[[0-9a-f:]+\]|localhost|127\.0\.0\.1|0\.0\.0\.0|\d{1,3}(?:\.\d{1,3}){3})(?::\d{2,5})?(?:\/\S*)?)/i,
  /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[[0-9a-f:]+\]|(?:\d{1,3}\.){3}\d{1,3}):(\d{2,5})/i,
];

export type DevserverUrlInfo = {
  url: string;
  port?: number;
  scheme: 'http' | 'https';
};

// Get the hostname from the current browser location, falling back to 'localhost'
const getBrowserHostname = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'localhost';
};

export const detectDevserverUrl = (line: string): DevserverUrlInfo | null => {
  const cleaned = stripAnsi(line);
  const browserHostname = getBrowserHostname();

  const fullUrlMatch = urlPatterns[0].exec(cleaned);
  if (fullUrlMatch) {
    try {
      const parsed = new URL(fullUrlMatch[1]);
      if (
        parsed.hostname === '0.0.0.0' ||
        parsed.hostname === '::' ||
        parsed.hostname === '[::]'
      ) {
        parsed.hostname = browserHostname;
      }
      return {
        url: parsed.toString(),
        port: parsed.port ? Number(parsed.port) : undefined,
        scheme: parsed.protocol === 'https:' ? 'https' : 'http',
      };
    } catch {
      // Ignore invalid URLs and fall through to host:port detection.
    }
  }

  const hostPortMatch = urlPatterns[1].exec(cleaned);
  if (hostPortMatch) {
    const port = Number(hostPortMatch[1]);
    const scheme = /https/i.test(cleaned) ? 'https' : 'http';
    return {
      url: `${scheme}://${browserHostname}:${port}`,
      port,
      scheme: scheme as 'http' | 'https',
    };
  }

  return null;
};

/**
 * Collect all unique URLs from log entries.
 * Returns an array of all detected devserver URLs (deduplicated by URL string).
 *
 * @param logs - Array of log entries with content
 * @returns Array of unique DevserverUrlInfo objects
 */
export const collectAllDevserverUrls = (
  logs: Array<{ content: string }>
): DevserverUrlInfo[] => {
  const seenUrls = new Set<string>();
  const urls: DevserverUrlInfo[] = [];

  for (const entry of logs) {
    const detected = detectDevserverUrl(entry.content);
    if (detected && !seenUrls.has(detected.url)) {
      seenUrls.add(detected.url);
      urls.push(detected);
    }
  }

  return urls;
};

/**
 * Hook to collect all unique URLs from logs.
 * Updates when logs change.
 *
 * @param logs - Array of log entries with content
 * @returns Object containing all detected URLs and whether multiple URLs were found
 */
export const useAllDevserverUrls = (
  logs: Array<{ content: string }> | undefined
): {
  urls: DevserverUrlInfo[];
  hasMultiple: boolean;
} => {
  const [urls, setUrls] = useState<DevserverUrlInfo[]>([]);

  useEffect(() => {
    if (!logs || logs.length === 0) {
      setUrls([]);
      return;
    }

    const collected = collectAllDevserverUrls(logs);
    setUrls(collected);
  }, [logs]);

  return {
    urls,
    hasMultiple: urls.length > 1,
  };
};

export const useDevserverUrlFromLogs = (
  logs: Array<{ content: string }> | undefined
): DevserverUrlInfo | undefined => {
  const [urlInfo, setUrlInfo] = useState<DevserverUrlInfo | undefined>();
  const lastIndexRef = useRef(0);

  useEffect(() => {
    if (!logs) {
      setUrlInfo(undefined);
      lastIndexRef.current = 0;
      return;
    }

    if (logs.length < lastIndexRef.current) {
      lastIndexRef.current = 0;
      setUrlInfo(undefined);
    }

    if (urlInfo) {
      lastIndexRef.current = logs.length;
      return;
    }

    let detectedUrl: DevserverUrlInfo | undefined;
    const newEntries = logs.slice(lastIndexRef.current);
    newEntries.some((entry) => {
      const detected = detectDevserverUrl(entry.content);
      if (detected) {
        detectedUrl = detected;
        return true;
      }
      return false;
    });

    if (detectedUrl) {
      setUrlInfo((prev) => prev ?? detectedUrl);
    }

    lastIndexRef.current = logs.length;
  }, [logs, urlInfo]);

  return urlInfo;
};
