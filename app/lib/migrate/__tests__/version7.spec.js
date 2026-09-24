import { expect } from "vitest";

import version7 from "../version7";

const input = {
  id: "20220102",
  uid: "bwz1t2xiOUdodt9p0gz6NGoTMRr2",
  date: 1641114000000,
  version: 6,
  blocks: [
    {
      data: {
        bibleRefs: [
          {
            ref: "Malachie 3.6",
            excerpt: "« Car je suis l’Éternel, je ne change pas »",
            template: "bottomTopCenter",
          },
          {
            ref: "Galates 1.3-5",
            excerpt:
              "Que la grâce et la paix vous soient données de la part de Dieu le Père et de notre Seigneur Jésus-Christ",
            template: "bottomTopCenter",
          },
        ],
      },
      title: "Ouverture",
      type: "reading",
    },
  ],
};

const output = {
  id: "20220102",
  uid: "bwz1t2xiOUdodt9p0gz6NGoTMRr2",
  date: 1641114000000,
  version: 6,
  blocks: [
    {
      data: {
        bibleRefs: [
          {
            ref: "Malachie 3.6",
            excerpt: "« Car je suis l’Éternel, je ne change pas »",
          },
          {
            ref: "Galates 1.3-5",
            excerpt:
              "Que la grâce et la paix vous soient données de la part de Dieu le Père et de notre Seigneur Jésus-Christ",
          },
        ],
      },
      title: "Ouverture",
      type: "reading",
    },
  ],
};

it("version7()", () => {
  expect(version7(input)).toEqual(output);
});
