import { AjaxOptions, AjaxResponse, AjaxData } from "@/types";

/**
 * Sends an AJAX request with support for FormData and plain data, including progress tracking
 * @param url - Request URL
 * @param options - Request configuration
 * @returns Promise that resolves with the response data
 */
export function ajax<
  TResponse = unknown,
  TData extends AjaxData = AjaxData,
  THeaders extends Record<string, string> = Record<string, string>
>(
  url: string,
  options: AjaxOptions<TResponse, TData, THeaders> = {}
): Promise<AjaxResponse<TResponse>> {
  return new Promise((resolve, reject) => {
    const {
      method = "GET",
      data,
      headers = {} as THeaders,
      progress: onProgress,
      success: onSuccess,
      error: onError,
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

    // Progress tracking for upload (sending data to server)
    if (onProgress && method !== "GET" && data) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent, e.loaded, e.total);
        }
      });
    }

    // Progress tracking for download (receiving response from server)
    if (onProgress) {
      xhr.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent, e.loaded, e.total);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as TResponse;
          onSuccess?.(response);
          resolve(response);
        } catch {
          const response = xhr.responseText as TResponse;
          onSuccess?.(response);
          resolve(response);
        }
      } else {
        const error = new Error(`Request failed with status ${xhr.status}`);
        onError?.(error);
        reject(error);
      }
    };

    xhr.onerror = () => {
      const error = new Error("Network error");
      onError?.(error);
      reject(error);
    };

    xhr.ontimeout = () => {
      const error = new Error("Request timeout");
      onError?.(error);
      reject(error);
    };

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