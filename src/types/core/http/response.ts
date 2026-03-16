export interface Response<T = unknown> {
  data: T;
  success: boolean;
  [key: string]: unknown;
}
