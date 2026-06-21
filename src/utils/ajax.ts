import { AjaxOptions, AjaxResponse, AjaxData } from '@/types';

/**
 * Sends an AJAX request with support for FormData and plain data, including progress tracking.
 * Always resolves with an AjaxResponse object, even on HTTP errors or network issues.
 * 
 * @param url - Request URL
 * @param options - Request configuration
 * @returns Promise that resolves with the full response object (data + status + error)
 */
export function ajax<
  TResponse = unknown,
  TData extends AjaxData = AjaxData,
  THeaders extends Record<string, string> = Record<string, string>,
>(url: string, options: AjaxOptions<TResponse, TData, THeaders> = {}): Promise<AjaxResponse<TResponse>> {
  return new Promise((resolve) => {
    const {
      method = 'GET',
      data,
      headers = {} as THeaders,
      progress: onProgress,
      success: onSuccess,
      error: onError,
      timeout = 30000,
    } = options;

    const xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.timeout = timeout;

    // Set default headers
    if (!(data instanceof FormData) && typeof data === 'object' && data !== null) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    // Custom headers
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    // Progress tracking for upload (sending data to server)
    if (onProgress && method !== 'GET' && data) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent, e.loaded, e.total);
        }
      });
    }

    // Progress tracking for download (receiving response from server)
    if (onProgress) {
      xhr.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent, e.loaded, e.total);
        }
      });
    }

    /**
     * Helper function to build and return a consistent AjaxResponse.
     */
    const buildResponse = (
      status: number,
      data: TResponse | null,
      errorMessage: string | null = null
    ): AjaxResponse<TResponse> => {
      const response: AjaxResponse<TResponse> = {
        status,
        data,
        error: errorMessage,
      };

      if (errorMessage) {
        onError?.(errorMessage, response);
      } else if (data !== null) {
        onSuccess?.(data);
      }

      return response;
    };

    xhr.onload = () => {
      let parsedData: TResponse | null;
      try {
        parsedData = JSON.parse(xhr.responseText) as TResponse;
      } catch {
        // If JSON parsing fails, use raw text if available
        parsedData = xhr.responseText as unknown as TResponse;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(buildResponse(xhr.status, parsedData));
      } else {
        const errorMsg = `Request failed with status ${xhr.status}`;
        resolve(buildResponse(xhr.status, parsedData, errorMsg));
      }
    };

    xhr.onerror = () => {
      resolve(buildResponse(0, null, 'Network error'));
    };

    xhr.ontimeout = () => {
      resolve(buildResponse(408, null, 'Request timeout'));
    };

    // Prepare body
    let body: FormData | string | undefined;
    if (data) {
      if (data instanceof FormData) {
        body = data;
      } else if (typeof data === 'object') {
        body = JSON.stringify(data);
      } else {
        body = String(data);
      }
    }

    xhr.send(body);
  });
}