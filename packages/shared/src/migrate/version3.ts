import { cluster } from "radashi";

export default function migrate(doc: any) {
  return {
    ...doc,
    blocks: doc.blocks.map((block: any) => {
      if (block.type !== "announcements") {
        return block;
      }

      let { data = [] }: { data: any[] } = block;

      data = cluster(data, 2);
      data = data.reduce<any[]>(
        (acc, curr) => {
          acc[0].push(curr[0]);

          if (curr[1]) {
            acc[1].push(curr[1]);
          }

          return acc;
        },
        [[], []],
      );
      data = [...data[0], ...data[1]];

      return { ...block, data };
    }),
  };
}
