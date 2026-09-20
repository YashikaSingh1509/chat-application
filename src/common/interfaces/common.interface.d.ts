declare interface LocationI {
  fullAddress?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  country?: string;
  type?: string;
  coordinates?: [number, number];
}

declare interface Pagination {
  pageNo?: number;
  limit?: number;
}

declare interface Filter {
  searchKey?: string;
  sortBy?: string;
  sortOrder?: number | string;
  status?: string | string[];
  filterBy?: string;
  fromDate?: number | Date;
  toDate?: number | Date;
}

declare interface ListingRequest extends Pagination, Filter {
  timezone?: string;
}
declare interface RecommendationListingByCategoryRequest
  extends Pagination, Filter {
  id?: string;
}

declare interface RecommendationHome {
  searchKey?: string;
  categoryId?: string;
}

declare interface DataI {
  [key: string]: any;
}

declare interface UserId {
  userId: string;
}
declare interface filterProfile {
  minDistance?: number;
  maxDistance?: number;
  minAge?: number;
  maxAge?: number;
  gender?: string[];
  minHandicapRange?: number;
  maxHandicapRange?: number;
  myLat: number;
  myLng: number;
  interests?: string[];
  unit: string;
  pageNo?: number;
  limit?: number;
}

declare interface DeeplinkRequest {
  android?: string;
  ios?: string;
  fallback?: string;
  token?: string;
  name?: string;
  type?: string;
  userType?: string;
  jwt?: string;
}

declare interface PrescriptionItem {
  link: string;
  location?: string;
  medicineName: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  additionalInstruction?: string;
}

declare interface ResponseObject<T> {
  statusCode?: number;
  message: string;
  data: T;
  code: string;
}

declare interface CommonEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedBy: string;
  status: string;
}
