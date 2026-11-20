import { expect, it } from "vitest";

import version5 from "../version5";

const input = {
  uid: "kbr8FeooHxWPfRlC5Rr6PeVOPQJ3",
  date: 1610319599999,
  blocks: [
    {
      data: [
        {
          detail:
            "> Culte à 10h en direct sur YouTube\n> pour venir sur place : inscription obligatoire sur egliselyongerland@gmail.com (nombre de places limité)",
          title: "Dimanche 17 janvier",
        },
        {
          title: "Groupes de maison",
          detail:
            "Interrompus en raison des restrictions actuelles\n>> remplacés par les groupes de vie sur WhatsApp",
        },
        {
          title: "Weekend d'église",
          detail: "Jeudi 13 mai à samedi 15 mai\n>> Voir Yvette pour les inscriptions",
        },
      ],
      type: "announcements",
      id: "6092919b-6fb1-4e7a-804e-9653e783c35b",
    },
    {
      type: "reading",
      id: "45cbd243-3a99-4786-bc54-0b782fa13de1",
      title: "Ouverture",
      data: {
        bibleRefs: [
          {
            ref: "Deutéronome 10.17-22",
            template: "leftRightCenter",
            excerpt:
              "Il est ta gloire, il est ton Dieu: c'est lui qui a fait au milieu de toi ces choses grandes et terribles que tes yeux ont vues. ",
          },
        ],
      },
    },
    {
      type: "songs",
      id: "e2112667-66b3-434b-9b67-47233b5f1598",
      data: [{ infos: "", repeat: false, id: "t58yKYltJAItuBInpjRW" }],
    },
    {
      id: "a5fec2bd-1db7-49a6-866f-60930d248db5",
      title: "Loi de Dieu",
      data: {
        bibleRefs: [
          {
            template: "leftRightCenter",
            ref: "Joël 2.1-2",
            excerpt:
              "Que tous les habitants du pays tremblent ! Car le jour de l'Éternel vient, car il est proche.",
          },
          {
            ref: "Joël 2.10-14",
            excerpt:
              "Revenez à moi de tout votre cœur, avec des jeûnes, avec des pleurs et des lamentations ! Déchirez vos cœurs et non vos vêtements, et revenez à l'Éternel, votre Dieu.",
          },
        ],
      },
      type: "reading",
    },
    {
      type: "reading",
      data: {
        bibleRefs: [
          {
            ref: "Luc 1.68-79",
            template: "leftRightCenter",
            excerpt:
              "Béni soit le Seigneur, le Dieu d'Israël, de ce qu'il a visité et racheté son peuple, et nous a suscité un puissant Sauveur.",
          },
        ],
      },
      title: "Grâce de Dieu",
      id: "b2601baf-b0b1-446d-abb7-acb1b7299236",
    },
    {
      data: [
        { repeat: false, id: "LGai2KBKUvpsKNe1fqKt", infos: "" },
        { repeat: false, id: "I1elQBKOBLldSOr7IIZZ", infos: "" },
      ],
      type: "songs",
      id: "64529ec3-5189-4649-85b0-5c3751b1eea0",
    },
    {
      type: "reading",
      id: "c681ec7e-b69e-48f1-a31d-35aa3b3f34b5",
      title: "Inter-chants",
      data: {
        bibleRefs: [
          {
            ref: "Joël 3.17-18",
            template: "leftRightCenter",
            excerpt:
              "Et vous saurez que je suis l’Éternel, votre Dieu, résidant à Sion, ma sainte montagne. ",
          },
        ],
      },
    },
    {
      type: "songs",
      data: [
        { repeat: false, infos: "", id: "V7FfcKmky34aSbVEzhgv" },
        { repeat: false, id: "5pBWLfKIhZAq9kfCYA6O", infos: "" },
      ],
      id: "bd59f2a2-f729-4e14-b08f-c4c1832f88f9",
    },
    {
      type: "sermon",
      data: {
        title: "Ferme la bouche et ouvre les yeux",
        plan: [
          "Remets-toi en question (20.1-11)",
          "Ne joue pas aux devinettes (20.12-21)",
          "Descends de tes grands chevaux (20.22-29)",
          "Arrête-toi et pleure (21.1-6)",
          "Regarde la réalité en face (21.7-34)",
        ],
        bibleRefs: ["Job 20-21"],
        author: "Alexandre Sarran",
      },
      id: "11e8df9b-5f69-478c-8559-454a44e75e53",
    },
    {
      type: "songs",
      data: [{ infos: "", id: "KEoQaNOMTbcxN4RN6DVb", repeat: false }],
      id: "50f18150-a7e8-4995-be8d-680d5501818b",
    },
    {
      type: "openDoors",
      id: "1ac7f341-8f9e-42e6-9751-c8f411b8abe5",
      data: {
        title: "Veille et lendemain de Noël meurtriers pour les chrétiens du Nigéria (#12)",
        detail:
          "Le groupe extrémiste islamique Boko Haram a attaqué plusieurs villages chrétiens la veille et le lendemain de Noël dans l'État de Borno.",
        prayerTopics: [
          "Prions que Dieu protège les chrétiens du Nigéria",
          "Prions que Dieu soutienne leur foi",
          "Prions que les terroristes de Boko Haram connaissent l'amour de Dieu ",
        ],
      },
    },
    {
      data: { title: "Prière" },
      type: "section",
      id: "a994ec40-413a-4744-a9f4-d9ba386c5e86",
    },
    {
      data: { infos: "", id: "AkZElhfXnxDaA3Z1AM3D" },
      type: "recitation",
      id: "3f99c32f-1920-42ae-bd93-aaf4fdd204c9",
    },
    {
      id: "dd034d79-48c3-45f2-853a-579a44eb2f63",
      type: "songs",
      data: [{ id: "Dztne1AYrDvUxf1imUu7", repeat: false, infos: "" }],
    },
    {
      type: "reading",
      data: {
        bibleRefs: [
          {
            template: "leftRightCenter",
            excerpt:
              "À lui soit la gloire dans l’Église et en Jésus-Christ, dans toutes les générations, aux siècles des siècles ! Amen !",
            ref: "Éphésiens 3.20-21",
          },
        ],
      },
      title: "Envoi",
      id: "c5e6f47e-987e-4736-b7c2-bf0df6ad20c4",
    },
  ],
};

const output = {
  uid: "kbr8FeooHxWPfRlC5Rr6PeVOPQJ3",
  date: 1610319599999,
  blocks: [
    {
      type: "announcements",
      title: "",
      data: [
        {
          detail:
            "> Culte à 10h en direct sur YouTube\n> pour venir sur place : inscription obligatoire sur egliselyongerland@gmail.com (nombre de places limité)",
          title: "Dimanche 17 janvier",
        },
        {
          title: "Groupes de maison",
          detail:
            "Interrompus en raison des restrictions actuelles\n>> remplacés par les groupes de vie sur WhatsApp",
        },
        {
          title: "Weekend d'église",
          detail: "Jeudi 13 mai à samedi 15 mai\n>> Voir Yvette pour les inscriptions",
        },
      ],
    },
    {
      type: "reading",
      title: "Ouverture",
      data: {
        bibleRefs: [
          {
            ref: "Deutéronome 10.17-22",
            template: "leftRightCenter",
            excerpt:
              "Il est ta gloire, il est ton Dieu: c'est lui qui a fait au milieu de toi ces choses grandes et terribles que tes yeux ont vues. ",
          },
        ],
      },
    },
    {
      type: "songs",
      title: "",
      data: [{ infos: "", repeat: false, id: "t58yKYltJAItuBInpjRW" }],
    },
    {
      type: "reading",
      title: "Loi de Dieu",
      data: {
        bibleRefs: [
          {
            template: "leftRightCenter",
            ref: "Joël 2.1-2",
            excerpt:
              "Que tous les habitants du pays tremblent ! Car le jour de l'Éternel vient, car il est proche.",
          },
          {
            ref: "Joël 2.10-14",
            excerpt:
              "Revenez à moi de tout votre cœur, avec des jeûnes, avec des pleurs et des lamentations ! Déchirez vos cœurs et non vos vêtements, et revenez à l'Éternel, votre Dieu.",
          },
        ],
      },
    },
    {
      type: "reading",
      title: "Grâce de Dieu",
      data: {
        bibleRefs: [
          {
            ref: "Luc 1.68-79",
            template: "leftRightCenter",
            excerpt:
              "Béni soit le Seigneur, le Dieu d'Israël, de ce qu'il a visité et racheté son peuple, et nous a suscité un puissant Sauveur.",
          },
        ],
      },
    },
    {
      type: "songs",
      title: "",
      data: [
        { repeat: false, id: "LGai2KBKUvpsKNe1fqKt", infos: "" },
        { repeat: false, id: "I1elQBKOBLldSOr7IIZZ", infos: "" },
      ],
    },
    {
      type: "reading",
      title: "Inter-chants",
      data: {
        bibleRefs: [
          {
            ref: "Joël 3.17-18",
            template: "leftRightCenter",
            excerpt:
              "Et vous saurez que je suis l’Éternel, votre Dieu, résidant à Sion, ma sainte montagne. ",
          },
        ],
      },
    },
    {
      type: "songs",
      title: "",
      data: [
        { repeat: false, infos: "", id: "V7FfcKmky34aSbVEzhgv" },
        { repeat: false, id: "5pBWLfKIhZAq9kfCYA6O", infos: "" },
      ],
    },
    {
      type: "sermon",
      title: "",
      data: {
        title: "Ferme la bouche et ouvre les yeux",
        plan: [
          { text: "Remets-toi en question (20.1-11)" },
          { text: "Ne joue pas aux devinettes (20.12-21)" },
          { text: "Descends de tes grands chevaux (20.22-29)" },
          { text: "Arrête-toi et pleure (21.1-6)" },
          { text: "Regarde la réalité en face (21.7-34)" },
        ],
        bibleRefs: [{ ref: "Job 20-21" }],
        author: "Alexandre Sarran",
      },
    },
    {
      type: "songs",
      title: "",
      data: [{ infos: "", id: "KEoQaNOMTbcxN4RN6DVb", repeat: false }],
    },
    {
      type: "openDoors",
      title: "",
      data: {
        title: "Veille et lendemain de Noël meurtriers pour les chrétiens du Nigéria (#12)",
        detail:
          "Le groupe extrémiste islamique Boko Haram a attaqué plusieurs villages chrétiens la veille et le lendemain de Noël dans l'État de Borno.",
        prayerTopics: [
          { text: "Prions que Dieu protège les chrétiens du Nigéria" },
          { text: "Prions que Dieu soutienne leur foi" },
          {
            text: "Prions que les terroristes de Boko Haram connaissent l'amour de Dieu ",
          },
        ],
      },
    },
    {
      type: "section",
      title: "",
      data: { title: "Prière" },
    },
    {
      type: "recitation",
      title: "",
      data: { infos: "", id: "AkZElhfXnxDaA3Z1AM3D" },
    },
    {
      type: "songs",
      title: "",
      data: [{ id: "Dztne1AYrDvUxf1imUu7", repeat: false, infos: "" }],
    },
    {
      type: "reading",
      title: "Envoi",
      data: {
        bibleRefs: [
          {
            template: "leftRightCenter",
            excerpt:
              "À lui soit la gloire dans l’Église et en Jésus-Christ, dans toutes les générations, aux siècles des siècles ! Amen !",
            ref: "Éphésiens 3.20-21",
          },
        ],
      },
    },
  ],
};

it("version5()", () => {
  expect(version5(input)).toEqual(output);
});
