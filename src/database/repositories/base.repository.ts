import { Injectable } from "@nestjs/common";
import { FilterQuery, Model } from "mongoose";
import {
  buildPaginationMeta,
  Pagination,
} from "src/common/interfaces/pagination.interface";

@Injectable()
export class BaseRepository<T> {
  constructor() {}

  /** Paginate a Mongoose model with optional post-map. */
  async mongoPaginate<M>(
    model: Model<M>,
    filter: FilterQuery<M>,
    page: number,
    limit: number,
    options?: {
      sort?: Record<string, 1 | -1>;
      populate?: string | object | (string | object)[];
      select?: string;
      leanMap?: (doc: unknown) => unknown;
    },
  ): Promise<Pagination<M>> {
    const skip = (page - 1) * limit;
    const sort = options?.sort ?? { createdAt: -1 };
    let q = model.find(filter).sort(sort).skip(skip).limit(limit);
    if (options?.select) q = q.select(options.select);
    if (options?.populate) q = q.populate(options.populate as any);
    const [itemsRaw, totalItems] = await Promise.all([
      q.lean().exec(),
      model.countDocuments(filter),
    ]);
    const items = options?.leanMap
      ? (itemsRaw as unknown[]).map((d) => options.leanMap!(d) as M)
      : (itemsRaw as M[]);
    return {
      items,
      meta: buildPaginationMeta(totalItems, page, limit),
    };
  }
}
