import { omit } from "radashi";

export default function migrate(doc: any) {
  return {
    ...doc,
    blocks: doc.blocks.map((block: any) => {
      switch (block.type) {
        case "reading":
          block.data.bibleRefs = block.data.bibleRefs.map((ref: any) => omit(ref, ["template"]));
          break;

        default:
      }

      return block;
    }),
  };
}
