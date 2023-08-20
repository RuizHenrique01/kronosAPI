import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const promises = [];
  const boards = await prisma.boards.findMany();

  for (const board of boards) {
    promises.push(
      prisma.tasks
        .findMany({
          where: {
            boardId: board.id,
          },
        })
        .then((result) =>
          result.forEach(
            async (r, i) =>
              await prisma.tasks.update({
                where: {
                  id: r.id,
                },
                data: {
                  position: i,
                },
              }),
          ),
        ),
    );
  }

  await Promise.all(promises);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
