export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: { [campo: string]: string };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}
