import { AjaxOptions, AjaxResponse, AjaxData, ApiResponse } from '@/types';

/**
 * Sends an AJAX request with support for FormData and plain data, including progress tracking.
 * Uses callbacks instead of Promise for response handling.
 *
 * @param url - Request URL
 * @param options - Request configuration (must include success and error callbacks)
 */
export function ajax<
  TResponse = ApiResponse,
  TData extends AjaxData = AjaxData,
  THeaders extends Record<string, string> = Record<string, string>,
>(url: string, options: AjaxOptions<TResponse, TData, THeaders> = {}): XMLHttpRequest {
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
   * Calls appropriate callback based on success/error state.
   */
  const handleResponse = (status: number, data: TResponse | null, errorMessage: string | null = null): void => {
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
      handleResponse(xhr.status, parsedData);
    } else {
      let errorMsg = `Request failed with status ${xhr.status}`;

      if (typeof parsedData === 'object') {
        const jsonData = parsedData as ApiResponse;
        errorMsg = jsonData?.message || jsonData?.errors?.[0] || errorMsg;
      }

      handleResponse(xhr.status, parsedData, errorMsg);
    }
  };

  xhr.onerror = () => {
    handleResponse(0, null, 'Network error');
  };

  xhr.ontimeout = () => {
    handleResponse(408, null, 'Request timeout');
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

  return xhr;
}
