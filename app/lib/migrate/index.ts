import { liturgyDocumentVersion } from "@/config";

import type { Liturgy } from "../schemas";
import version2 from "./version2";
import version3 from "./version3";
import version4 from "./version4";
import version5 from "./version5";
import version6 from "./version6";
import version7 from "./version7";
import version8 from "./version8";
import version9 from "./version9";

function toVersion(version: number, data: any) {
  switch (version) {
    case 2:
      return version2(data);
    case 3:
      return version3(data);
    case 4:
      return version4(data);
    case 5:
      return version5(data);
    case 6:
      return version6(data);
    case 7:
      return version7(data);
    case 8:
      return version8(data);
    case 9:
      return version9(data);
    default:
      return data;
  }
}

export default function migrate(doc: any) {
  const { version = 1 } = doc;

  if (version >= liturgyDocumentVersion) {
    return doc;
  }

  const result = [...Array(liturgyDocumentVersion - version)].reduce((acc, curr) => {
    return toVersion(curr + version + 1, acc);
  }, doc);

  result.version = liturgyDocumentVersion;

  return result;
}
