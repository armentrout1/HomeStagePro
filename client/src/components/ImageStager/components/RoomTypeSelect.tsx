import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { roomTypes } from "../constants";

interface RoomTypeSelectProps {
  roomType: string;
  onRoomTypeChange: (value: string) => void;
  showRoomTypeHint?: boolean;
}

export function RoomTypeSelect({ roomType, onRoomTypeChange, showRoomTypeHint = false }: RoomTypeSelectProps) {
  return (
    <div className="mb-6 md:mb-5">
      <div className="mx-auto w-full max-w-full md:max-w-[26rem] lg:max-w-[26rem]">
        <Label
          htmlFor="room-type"
          className="mb-2 block text-center text-base md:text-lg font-medium text-slate-800"
        >
          Select Room Type
        </Label>
        <Select value={roomType} onValueChange={onRoomTypeChange}>
          <SelectTrigger
            id="room-type"
            className="pp-control mx-auto h-12 md:h-11 w-full rounded-full border border-slate-300 px-5 md:px-6 md:py-2 text-base md:text-lg shadow-sm ring-1 ring-amber-200 ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-amber-400 data-[state=open]:ring-amber-300 md:max-w-[26rem] lg:max-w-[26rem]"
          >
            <SelectValue placeholder="Select Room Type" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-lg">
            {roomTypes.map((type) => (
              <SelectItem
                key={type.value}
                value={type.value}
                className="relative flex min-h-[46px] w-full items-center rounded-full border border-slate-200 bg-white pl-10 pr-4 text-base text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 data-[highlighted]:border-slate-300 data-[highlighted]:bg-slate-50 data-[highlighted]:text-slate-900 data-[state=checked]:border-slate-400 data-[state=checked]:bg-slate-100 data-[state=checked]:font-medium data-[state=checked]:text-slate-900"
              >
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showRoomTypeHint && (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-center">
            Tip: Pick the closest room type for better staging results.
          </p>
        )}
      </div>
    </div>
  );
}
