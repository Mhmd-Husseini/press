1) pnpm install
2) npx prisma generate
3) npx prisma migrate dev
4) pnpm dev

## Database Migrations

To manage your database:

1) Create a migration from schema changes:
```
npx prisma migrate dev --name your_migration_name
```

2) Apply migrations in production:
```
npx prisma migrate deploy
```

3) Reset database (caution: deletes all data):
```
npx prisma migrate reset
```

4) View database with Prisma Studio:
```
npx prisma studio
```