import { Dialog as DialogPrimitive } from "@base-ui/react";
import { useFormContext } from "react-hook-form";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";
import { generateCode } from "@/lib/code";
import type { Liturgy, RecitationWithId, SongWithId } from "@/lib/schemas";

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "../ui/code-block";

export const codeDialogHandle = DialogPrimitive.createHandle();

interface CodeDialogProps {
  date: Date;
  songs: SongWithId[];
  recitations: RecitationWithId[];
}

export function CodeDialog(props: CodeDialogProps) {
  return (
    <Dialog handle={codeDialogHandle}>
      <DialogContent className="sm:max-w-300" keepMounted={false}>
        <DialogHeader>
          <DialogTitle>Code de génération des slides</DialogTitle>
        </DialogHeader>

        <Content {...props} />
      </DialogContent>
    </Dialog>
  );
}

function Content({ date, songs, recitations }: CodeDialogProps) {
  const { getValues } = useFormContext<Liturgy>();
  const liturgy = getValues();

  const code = generateCode({ date, liturgy, songs, recitations });
  const lines = useHighlightedCode(code, "json");

  return (
    <div className="no-scrollbar max-h-[80svh] overflow-y-auto">
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTitle></CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton value={code} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent wrap={false}>
          {lines.map((line, index) => (
            <CodeBlockLine key={index}>{line}</CodeBlockLine>
          ))}
        </CodeBlockContent>
      </CodeBlock>
    </div>
  );
}
