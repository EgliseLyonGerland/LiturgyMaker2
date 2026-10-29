import { Popover as PopoverPrimitive } from "@base-ui/react";
import { addDays, format, subDays } from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeIcon,
  EllipsisVerticalIcon,
  SaveIcon,
} from "lucide-react";
import { fr } from "react-day-picker/locale";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { convertToId } from "@/lib/liturgy-utils";

import { DialogTrigger } from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { codeDialogHandle } from "./code-dialog";

const datePickerHandle = PopoverPrimitive.createHandle();

interface LiturgyHeaderProps {
  date: Date;
  disabled?: boolean;
  loading?: boolean;
}

export function LiturgyHeader({ date, disabled, loading }: LiturgyHeaderProps) {
  const navigate = useNavigate();

  const previousDate = subDays(date, 7);
  const nextDate = addDays(date, 7);

  return (
    <div className="flex items-center">
      <Button
        size="icon-sm"
        variant="ghost"
        title={`Aller à la la liturgie du ${format(previousDate, "do MMMM y")}`}
        onClick={() => {
          navigate(`/liturgies/${convertToId(previousDate)}`);
        }}
      >
        <ChevronLeftIcon />
      </Button>
      <Popover handle={datePickerHandle}>
        <PopoverTrigger
          render={
            <Button type="button" variant="ghost" className="group" title="Sélectionner une date">
              <span className="hidden xs:inline">Présidence du</span> {format(date, "do MMMM y")}
            </Button>
          }
        />
        <PopoverContent className="p-0" align="start">
          <Calendar
            className="w-full min-w-(--anchror-width)"
            mode="single"
            locale={fr}
            selected={date}
            defaultMonth={date}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                datePickerHandle.close();
                navigate(`/liturgies/${convertToId(selectedDate)}`);
              }
            }}
          />
        </PopoverContent>
      </Popover>
      <Button
        size="icon-sm"
        variant="ghost"
        title={`Aller à la la liturgie du ${format(nextDate, "do MMMM y")}`}
        onClick={() => {
          navigate(`/liturgies/${convertToId(nextDate)}`);
        }}
      >
        <ChevronRightIcon />
      </Button>

      <Button className="ml-auto" type="submit" form="liturgy-form" disabled={disabled}>
        {loading && <Spinner />}
        <span className="hidden sm:block">Enregistrer</span>
        <SaveIcon className="md:hidden" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="ghost" size="icon" className="ml-2">
              <EllipsisVerticalIcon />
            </Button>
          }
        />
        <DropdownMenuContent className="w-auto min-w-40" align="end">
          <DropdownMenuGroup>
            <DialogTrigger
              handle={codeDialogHandle}
              render={
                <DropdownMenuItem onClick={() => {}}>
                  <CodeIcon /> Code de génération
                </DropdownMenuItem>
              }
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
