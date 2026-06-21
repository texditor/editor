/** HTTP method types for AJAX requests */
export type AjaxMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** Supported data types for request body */
export type AjaxData = FormData | Record<string, unknown> | string;

/** Standardized AJAX response structure */
export interface AjaxResponse<T = unknown> {
  /** HTTP status code (0 for network errors, 408 for timeout) */
  status: number;
  /** Parsed response data (null if unavailable) */
  data: T | null;
  /** Error message if request failed, null otherwise */
  error: string | null;
}

/** Configuration options for AJAX request */
export interface AjaxOptions<
  TResponse = unknown,
  TData extends AjaxData = AjaxData,
  THeaders extends Record<string, string> = Record<string, string>,
> {
  /** HTTP method (default: GET) */
  method?: AjaxMethod;
  /** Request body data */
  data?: TData;
  /** Custom HTTP headers */
  headers?: THeaders;
  /** Progress callback for upload tracking */
  progress?: (percent: number, loaded: number, total: number) => void;
  /** Success callback (called only when status is 2xx and no error) */
  success?: (data: TResponse) => void;
  /** Error callback (called when request fails, receives error message and full response) */
  error?: (errorMessage: string, response: AjaxResponse<TResponse>) => void;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/** Complete AJAX configuration with URL */
export interface AjaxConfig<
  TResponse = unknown,
  TData extends AjaxData = AjaxData,
  THeaders extends Record<string, string> = Record<string, string>,
> {
  /** Target URL for the request */
  url: string;
  /** Request options */
  options?: AjaxOptions<TResponse, TData, THeaders>;
}