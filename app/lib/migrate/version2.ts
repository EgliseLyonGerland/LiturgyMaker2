export default function version2(doc: any) {
  return {
    ...doc,
    version: 2,
    blocks: doc.blocks.map((block: any) => {
      if (block.title) {
        return block;
      }

      let title;
      switch (block.type) {
        case "announcements":
          title = "Annonces";
          break;
        case "reading":
          title = block.data.title;
          break;
        case "songs":
          title = "Chants";
          break;
        case "sermon":
          title = "Prédication";
          break;
        case "section":
          title = null;
          break;
        default:
          title = "";
      }

      return { ...block, title };
    }),
  };
}
