export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
  nextHit: number;
}

export interface Pagination<T> {
  items: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(
  totalItems: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPage = Math.max(1, Math.ceil(totalItems / limit) || 1);
  const nextHit = page < totalPage ? page + 1 : 0;

  return {
    total: totalItems,
    page: page,
    limit: limit,
    totalPage: totalPage,
    nextHit: nextHit,
  };
}
