# Soft Removable Repository

Soft-delete (soft-remove) extensions for `@mojsoski/ormm`, built on top of `@silyze/batch-repository`. Automatically filters out records marked as removed and provides batch soft-delete support.

## Installation

```bash
npm install @silyze/soft-removable-repository
```

## Usage

Extend `SoftRemovableRepository` for your model to inherit soft-delete behavior:

```ts
import SoftRemovableRepository, {
  SoftRemovable,
} from "@silyze/soft-removable-repository";

interface UserModel extends SoftRemovable {
  name: string;
  email: string;
}

class UserRepository extends SoftRemovableRepository<"users", UserModel> {}

const repo = new UserRepository();
```

All standard repository methods (`getById`, `list`, `count`, `update`, `remove`) will now automatically exclude records where `removed === true`.

## API Reference

### Model Interface

```ts
export interface SoftRemovable<T extends object = object>
  extends IBaseModel<T> {
  removed?: boolean;
}
```

- **removed**: Optional flag indicating soft deletion.

### `class SoftRemovableRepository<Table extends string, T extends SoftRemovable>`

Extends `BatchRepository<Table, T>` and overrides core methods to respect the `removed` flag.

#### `getById(id: string): Promise<T | null>`

Fetch a record by `id`. Returns `null` if the record is marked as removed or does not exist.

#### `list(where: WhereFilter<T>, pagination?: PaginationFilter, order?: OrderFilter<T>): Promise<T[]>`

List records matching the `where` filter, automatically adding `removed: false` to the criteria.

- **where**: Conditions to filter records (excluding removed ones).
- **pagination**: Optional pagination (`limit`, `offset`).
- **order**: Optional ordering.

#### `count(where: WhereFilter<T>): Promise<number>`

Count records matching the `where` filter, excluding removed ones.

#### `update(update: UpdateFilter<T>, where: WhereFilter<T>): Promise<string[]>`

Update records matching `where`, excluding those marked as removed. Returns updated IDs.

#### `remove(where: WhereFilter<T>): Promise<string[]>`

Soft-delete matching records by setting `removed = true`. Returns the affected record IDs.

#### `removeBatch(ids: string[]): Promise<string[]>`

Batch soft-delete by IDs, issuing a single `UPDATE ... WHERE id IN (...)`. Returns the list of IDs that were flagged removed.

#### `createBatch`, `updateBatch`

Inherited from `BatchRepository`, unaffected by the `removed` flag.

## Examples

```ts
// Soft-delete a single record
const deletedIds = await repo.remove({ id: "123" });
console.log(deletedIds); // ["123"]

// Attempt to fetch a removed record
const user = await repo.getById("123");
console.log(user); // null

// List active users only
const users = await repo.list({});

// Restore or update non-removed records
await repo.update({ email: "new@example.com" }, { id: "456" });

// Batch soft-delete
const batchDeleted = await repo.removeBatch(["123", "456", "789"]);
console.log(batchDeleted); // ["123", "456", "789"]
```
