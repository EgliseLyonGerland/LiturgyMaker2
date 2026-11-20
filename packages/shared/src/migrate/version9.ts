import { uid } from "uid";

export default function migrate(doc: any) {
  return {
    ...doc,
    blocks: doc.blocks.map((block: any) => {
      block.id = uid();
      return block;
    }),
  };
}
