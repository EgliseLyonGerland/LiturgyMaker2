import { omit } from "radashi";

export default function migrate(doc: any) {
  return {
    ...doc,
    blocks: doc.blocks.map((block: any) => {
      const result = omit(block, ["id"]);

      if (!result.title) {
        result.title = "";
      }
      switch (block.type) {
        case "sermon":
          result.data.plan = result.data.plan.map((text: string) => ({ text }));
          result.data.bibleRefs = result.data.bibleRefs.map((ref: string) => ({
            ref,
          }));
          break;
        case "openDoors":
          result.data.prayerTopics = result.data.prayerTopics.map((text: string) => ({
            text,
          }));
          break;
        default:
      }

      return result;
    }),
  };
}
