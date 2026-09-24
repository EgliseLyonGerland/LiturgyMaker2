export default function migrate(doc: any) {
  return {
    ...doc,
    blocks: doc.blocks.map((block: any) => {
      switch (block.type) {
        case "announcements":
        case "songs":
          block.data = {
            items: block.data,
          };
          break;

        default:
      }

      return block;
    }),
  };
}
