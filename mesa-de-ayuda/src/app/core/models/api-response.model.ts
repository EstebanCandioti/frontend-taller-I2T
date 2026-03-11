export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: { [campo: string]: string };
  timestamp: string;
}
