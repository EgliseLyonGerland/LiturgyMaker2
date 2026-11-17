import { format, toDate } from "date-fns";
import { fr as locale } from "date-fns/locale/fr";
import { diff as deepDiff } from "deep-diff";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { createTransport } from "nodemailer";

interface LiturgyDocument {
  uid: string;
  date: number;
}

const sender = defineString("GMAIL_SENDER_ADDRESS");
const recipient = defineString("GMAIL_RECIPIENT_ADDRESS");
const gmailUser = defineString("GMAIL_AUTH_USER");
const gmailPassword = defineSecret("GMAIL_AUTH_PASSWORD");

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 10,
});

initializeApp();
const db = getFirestore();

function formatDate(date: Date) {
  if (date.getDate() === 1) {
    return format(date, "'1er' MMMM y", { locale });
  }

  return format(date, "d MMMM y", { locale });
}

export const notifyChanges = onDocumentWritten(
  {
    document: "liturgies/{liturgyId}",
    secrets: [gmailPassword],
  },
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      console.log("No data");
      return;
    }

    // const original = snapshot.before.data();
    const created = !snapshot.before.exists;
    const data = snapshot.after.data() as LiturgyDocument;

    const date = toDate(data.date);
    const formattedDate = formatDate(date);
    const { uid } = data;

    const user = (await db.collection("users").doc(uid).get()).data();

    if (!user) {
      console.log(`User ${uid} not found`);
      return;
    }

    const from = `Église Lyon Gerland - Présidence <${sender.value()}>`;
    const to = recipient.value();

    let subject = `Présidence du ${formattedDate}`;
    if (!created) {
      subject = `Re: ${subject}`;
    }

    const diff = created ? deepDiff({}, data) : deepDiff(snapshot.before.data(), data);

    let verb = "modifier";
    if (created) {
      verb = "créer";
    }

    const html = `
Bonjour,
<br /><br />

${user.displayName} vient de ${verb} les informations sur le culte du ${formattedDate}.
<br /><br />

Rendez vous sur culte.egliselyongerland.org pour visualiser les informations.
<br /><br />

<details>
  <summary>
    Vous trouverez ci-dessous le rapport des changements effectués 👇
  </summary>
  <pre>${JSON.stringify(diff, null, "  ")}</pre>
</details>
<br /><br />

Cordialement,<br />
Église Lyon Gerland
    `.trim();

    const transporter = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser.value(),
        pass: gmailPassword.value(),
      },
    });

    await transporter.sendMail({ from, to, subject, html });
    console.log("Mail sent");
  },
);
