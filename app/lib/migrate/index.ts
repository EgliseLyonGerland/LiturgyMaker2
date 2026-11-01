import { liturgyDocumentVersion } from "@/config";

import version2 from "./version2";
import version3 from "./version3";
import version4 from "./version4";
import version5 from "./version5";
import version6 from "./version6";
import version7 from "./version7";
import version8 from "./version8";
import version9 from "./version9";

const versions: Record<`version${number}`, (data: any) => any> = {
  version2,
  version3,
  version4,
  version5,
  version6,
  version7,
  version8,
  version9,
} as const;

function toVersion(version: number, data: any) {
  const key = `version${version}` as const;

  if (key in versions) {
    return versions[key](data);
  }

  return data;
}

export default function migrate(doc: any) {
  const { version = 1 } = doc;

  if (version >= liturgyDocumentVersion) {
    return doc;
  }

  const result = [...Array(liturgyDocumentVersion - version).keys()].reduce((acc, curr) => {
    return toVersion(curr + version + 1, acc);
  }, doc);

  result.version = liturgyDocumentVersion;

  return result;
}
