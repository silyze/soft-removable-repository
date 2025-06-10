import { IBaseModel } from "@mojsoski/ormm";
import type {
  WhereFilter,
  PaginationFilter,
  OrderFilter,
  UpdateFilter,
} from "@mojsoski/ormm/dist/lib/base/filters";
import BatchRepository from "@silyze/batch-repository";
import { createIdentifier, Index } from "@mojsoski/ormm/dist/lib/base";

export interface SoftRemovable<T extends object = object>
  extends IBaseModel<T> {
  removed?: boolean;
}

export default abstract class SoftRemovableRepository<
  Table extends string,
  T extends SoftRemovable
> extends BatchRepository<Table, T> {
  override async getById(id: string): Promise<T | null> {
    const result = await super.getById(id);
    if (result?.removed) {
      return null;
    }
    return result;
  }

  override remove(where: WhereFilter<T>): Promise<string[]> {
    return super.update({ removed: true } as UpdateFilter<T>, {
      ...where,
      ...{ removed: false },
    });
  }

  override count(where: WhereFilter<T>): Promise<number> {
    return super.count({ ...where, ...{ removed: false } });
  }

  override list(
    where: WhereFilter<T>,
    pagination?: PaginationFilter,
    order?: OrderFilter<T>
  ): Promise<T[]> {
    return super.list({ ...where, ...{ removed: false } }, pagination, order);
  }

  override update(
    update: UpdateFilter<T>,
    where: WhereFilter<T>
  ): Promise<string[]> {
    return super.update(update, { ...where, ...{ removed: false } });
  }

  async removeBatch(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];

    const SQL = this.SQL;

    const query = this.debugQuery(
      SQL`UPDATE `
        .append(createIdentifier(this.tableName))
        .append(SQL` SET "removed" = true WHERE "id" IN (`)
        .append(
          ids.reduce(
            (prev, idSql, idx) =>
              prev.append(idx === 0 ? SQL`` : SQL`, `).append(SQL`${idSql}`),
            SQL``
          )
        )
        .append(SQL`) RETURNING "id"`)
    );

    const result = await this.client.query<Index>(query);
    return result.rows.map((row) => row.id);
  }
}
