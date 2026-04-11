/**
 * Sends an AJAX request with support for FormData and plain data, including progress tracking
 * @param url - Request URL
 * @param options - Request configuration
 * @returns Promise that resolves with the response data
 */
export function ajax(
  url: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: FormData | Record<string, unknown> | string;
    headers?: Record<string, string>;
    onProgress?: (percent: number, loaded: number, total: number) => void;
    timeout?: number;
  } = {}
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const {
      method = "GET",
      data,
      headers = {},
      onProgress,
      timeout = 30000
    } = options;

    const xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.timeout = timeout;

    // Set default headers
    if (!(data instanceof FormData) && typeof data === "object" && data !== null) {
      xhr.setRequestHeader("Content-Type", "application/json");
    }

    // Custom headers
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    // Progress tracking
    if (onProgress && method !== "GET") {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent, e.loaded, e.total);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`Request failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.ontimeout = () => reject(new Error("Request timeout"));

    // Prepare body
    let body: FormData | string | undefined;
    if (data) {
      if (data instanceof FormData) {
        body = data;
      } else if (typeof data === "object") {
        body = JSON.stringify(data);
      } else {
        body = String(data);
      }
    }

    xhr.send(body);
  });
}